const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PropertyType = require('./property_type');
const Group = require('./group');

const AccessBundleSchema = new Schema({
  userIds: [String],
  groupNames: [String]
})

const AccessSchema = new Schema({
  propertyId: String,
  propertyType: String,
  accessGroup: AccessBundleSchema,
  role: String
})

const AccessModel = mongoose.model('access_control', AccessSchema)

const isIncluded = (userId, accessGroup) => {
  for (id of accessGroup.userIds) {
    if (userId === id) {
      return true;
    }
  }
  for (groupName of accessGroup.groupNames) {
  	if (Group.isInGroup(userId)) {
  	  return true;
  	}
  	return false;
  }
}

const findPropertyPromise = (propertyId, propertyType) => {
  if (PropertyType.isPropertyBased(propertyType)) {
    // There should be only one matched row exists.
    return AccessModel.findOne({
      propertyType: propertyType,
      role: role
    }).exec();
  }
  // There should be only one matched row exists.
  return AccessModel.findOne({
    propertyId: propertyId,
    role: role
  }).exec();
}

// Return Promise({ err: error, isAccessible: boolean, accessRow: AccessBundleSchema })
const checkAccessHelper = (userId, propertyId, propertyType, role) => {
  findPropertyPromise(propertyId, propertyType)
  .then(result => {
  	if (!result) {
  	  return Promise.resolve({
  	    err: new Error("Cannot find the property or role")
  	  });
  	}
  	return Promise.resolve({
  	  isAccessible: isIncluded(userId, result.accessGroup),
  	  accessRow: result.accessGroup
  	});
  })
  .catch(err => {
    return Promise.resolve({err: err});
  });
}

// callback = (err: boolean) => {}
const checkAccess = (userId, propertyId, propertyType, role, callback) => {
  checkAccessHelper(userId, propertyId, propertyType, role)
  .then(result => {
    return callback(result.err, result.isAccessible);
  })
}



const addAccessPromise = (propertyId, propertyType, updatedAccessBundle) => {
  if (PropertyType.isPropertyBased(propertyType)) {
    // There should be only one matched row exists.
    return AccessModel.findOneAndUpdate({
      propertyType: propertyType,
      role: role
    }, updatedAccessBundle).exec();
  }
  // There should be only one matched row exists.
  return AccessModel.findOneAndUpdate({
    propertyId: propertyId,
    role: role
  }, updatedAccessBundle).exec();
}

// op: 'add' or 'remove'
const mutateAccessHelper = (requesterId, candidatorIdOrName, isGroup, op, propertyId, propertyType, role, callback) => {
  const operation = (accessGroup, IdOrName, isGroup, op) => {
    switch (op) {
      case 'add':
        if (!isGroup) {
          accessGroup.userIds.push(IdOrName);
        } else {
          accessGroup.groupNames.push(IdOrName);
        }
        break;
      case 'remove':
        if (!isGroup) {
          accessGroup.userIds = accessGroup.userIds.filter(id => id !== IdOrName);
        } else {
          accessGroup.groupNames = accessGroup.groupNames.filter(name => name != IdOrName);
        }
        break;
  	}
  };
  checkAccessHelper(userId, propertyId, propertyType, role)
  .then(result => {
    if (result.err) {
    	return callback(err, null); 
    }
    if (!result.isAccessible) {
      return callback(new Error('PERMISSION_DENIED'), null);
    }
    operation(result.accessGroup, candidatorIdOrName, isGroup, op);
    return addAccessPromise(propertyId, propertyType, result.accessGroup);
  })
  .then(result => {
    return callback(null, null);
  })
  .catch(err => {
    return callback(err, null);
  });
}

// requesterId: userId of requester
// candidatorIdOrName: userId or group name to grant access
// isGroup: whether the given "candidatorIdOrName" is group name.
const addAccess = (requesterId, candidatorIdOrName, isGroup, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidatorIdOrName, isGroup, 'add', propertyId, propertyType, role, callback);
}

const removeAccess =  (requesterId, candidatorIdOrName, isGroup, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidatorIdOrName, isGroup, 'remove', propertyId, propertyType, role, callback);
}