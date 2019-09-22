const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PropertyType = require('./property_type');
const Group = require('./group');

const AccessSetSchema = new Schema({
  userIds: [String],
  groupNames: [String]
});

const AccessSchema = new Schema({
  propertyId: String,
  propertyType: String,
  accessSet: AccessSetSchema,
  role: String
});

const AccessModel = mongoose.model('access_control', AccessSchema);

const isIncluded = (userId, accessSet) => {
  for (id of accessSet.userIds) {
    if (userId === id) {
      return true;
    }
  }
  for (groupName of accessSet.groupNames) {
    if (Group.isInGroup(groupName, userId)) {
      return true;
    }
    return false;
  }
}

const isAbleToAccess = (userId, targetRole, accessRows) => {
  if (!accessRows || !accessRows.length) {
    return false;
  }
  const type = accessRows[0].propertyType;
  const aboveRoles = PropertyType.getAboveRoles(type, targetRole);
  const permittedAccessRows = accessRows.filter(row => {
    let matched = false;
    for (role of aboveRoles) {
      if (role === row.role) {
        matched = true;
        break;
      }
    }
    return matched
  });
  for (row of permittedAccessRows) {
    if (isIncluded(userId, row.accessSet)) {
      return true;
    }
  }
  return false;
}

const findPropertyPromise = (propertyId, propertyType) => {
  if (PropertyType.isPropertyBased(propertyType)) {
    // There should be only one matched row exists.
    return AccessModel.find({ propertyType: propertyType }).exec();
  }
  // There should be only one matched row exists.
  return AccessModel.find({ propertyId: propertyId }).exec();
}

// Return Promise({ err: error, isAccessible: boolean, accessRow: AccessSetSchema })
// accessRow is the AccessSet with given targetRole.
const checkAccessHelper = (userId, propertyId, propertyType, targetRole) => {
  findPropertyPromise(propertyId, propertyType)
  .then(accessRows => {
    if (!accessRows || !accessRows.length) {
      return Promise.resolve({
        err: new Error("Cannot find the property")
  	  });
    }
    const targetAccessRow = accessRows.find(row => row.role === targetRole);
    if (!targetAccessRow) {
      return Promise.resolve({
        err: new Error(`Role ${targetRole} is invalid.`)
      });
    }
    return Promise.resolve({
      isAccessible: isAbleToAccess(userId, targetRole, accessRows)
    });
  })
  .catch(err => {
    return Promise.resolve({err: err});
  });
}

// callback = (err: boolean) => {}
const checkAccess = (userId, propertyId, propertyType, targetRole, callback) => {
  checkAccessHelper(userId, propertyId, propertyType, targetRole)
  .then(result => {
    return callback(result.err, result.isAccessible);
  })
}



const addAccessPromise = (propertyId, propertyType, targetRole, updatedAccessBundle) => {
  if (PropertyType.isPropertyBased(propertyType)) {
    // There should be only one matched row exists.
    return AccessModel.findOneAndUpdate({
      propertyType: propertyType,
      role: targetRole
    }, updatedAccessBundle).exec();
  }
  // There should be only one matched row exists.
  return AccessModel.findOneAndUpdate({
    propertyId: propertyId,
    role: targetRole
  }, updatedAccessBundle).exec();
}

const findRowWithRolePromise = (propertyId, propertyType, role) => {
  if (PropertyType.isPropertyBased(propertyType)) {
    // There should be only one matched row exists.
    return AccessModel.findOne({ propertyType: propertyType, role: role }).exec();
  }
  // There should be only one matched row exists.
  return AccessModel.findOne({ propertyId: propertyId, role: role }).exec();
}

// op: 'add' or 'remove'
// targetRole is the role of candidate instead of requester.
const mutateAccessHelper = (requesterId, candidateIdOrName, isGroup, op, propertyId, propertyType, targetRole, callback) => {
  const operation = (accessSet, IdOrName, isGroup, op) => {
    switch (op) {
      case 'add':
        if (!isGroup) {
          accessSet.userIds.push(IdOrName);
        } else {
          accessSet.groupNames.push(IdOrName);
        }
        break;
      case 'remove':
        if (!isGroup) {
          accessSet.userIds = accessSet.userIds.filter(id => id !== IdOrName);
        } else {
          accessSet.groupNames = accessSet.groupNames.filter(name => name != IdOrName);
        }
        break;
  	}
  };
  checkAccessHelper(userId, propertyId, propertyType, PropertyType.getAdminRole(targetRole))
  .then(result => {
    if (result.err) {
    	return callback(err, null); 
    }
    if (!result.isAccessible) {
      return callback(new Error('PERMISSION_DENIED'), null);
    }
    return findRowWithRolePromise(propertyId, propertyType, targetRole);
  })
  .catch(err => { throw err })
  .then(result => {
    operation(result.accessSet, candidateIdOrName, isGroup, op);
    return addAccessPromise(propertyId, propertyType, targetRole, result.accessSet);
  })
  .then(result => {
    return callback(null, null);
  })
  .catch(err => {
    return callback(err, null);
  });
}

// requesterId: userId of requester
// candidateIdOrName: userId or group name to grant access
// isGroup: whether the given "candidateIdOrName" is group name.
const addAccess = (requesterId, candidateIdOrName, isGroup, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidateIdOrName, isGroup, 'add', propertyId, propertyType, role, callback);
}

const removeAccess =  (requesterId, candidateIdOrName, isGroup, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidateIdOrName, isGroup, 'remove', propertyId, propertyType, role, callback);
}

const listAccessByProperty = (requesterId, propertyId, propertyType) => {}

// Always add GROUP_SYSTEM_ADMIN as owner.
const createAclForProperty = (requesterId, propertyId, propertyType) => {}

const removeAclOfProperty = (requesterId, propertyId, propertyType) => {}

module.exports = {
	checkAccess: checkAccess,
	addAccess: addAccess,
	removeAccess: removeAccess,
	listAccessByProperty: listAccessByProperty,
	createAclForProperty: createAclForProperty,
	removeAclOfProperty: removeAclOfProperty
}