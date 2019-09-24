const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TypeAndRole = require('./acl_config');
const Group = require('./group');

const AccessSchema = new Schema({
  propertyId: String,
  propertyType: String,
  groups: [String],
  role: String
});

const AccessModel = mongoose.model('access_control', AccessSchema);

/*
 * Name of the default group for adding individuals is
 * `${propertyType}_${propertyId}_${role}_group`
 */
const getDefaultGroupName = (propertyId, propertyType, role) => {
	return `${propertyType}_${propertyId}_${role}_group`;
}


const findPropertyCondition = (propertyId, propertyType) => {
  if (TypeAndRole.isPropertyBased(propertyType)) {
    return { 'propertyType': propertyType };
  }
  return { 'propertyId': propertyId };
}

// Return Promise({ err: error, isAccessible: boolean })
// accessRow is the AccessSet with given targetRole.
const checkAccessHelper = (requesterId, propertyId, propertyType, targetRole) => {
  const aboveRolesList = TypeAndRole.getAboveRoles(propertyType, targetRole);
  const aboveRolesMap = aboveRoleList.reduce((map, role) => {
    map.set(role, true);
    return map;
  }, new Map());
  AccessModel.find( findPropertyCondition(propertyId, propertyType) ).exec()
  .then(accessRows => {
    if (!accessRows || !accessRows.length) {
      return Promise.resolve({
        err: new Error("Cannot find the property")
  	  });
    }
    const accessibleRows = accessRows.filter(row => aboveRolesMap.has(row));
    if (!accessibleRows || !accessibleRows.length) {
      return Promise.resolve({ isAccessible: false });
    }
    const accessibleGroups = new Map();
    for (row of accessibleRows) {
      for (group of row.groups) {
        accessibleGroups.set(group, true);
      }
    }
    return Group.isInGroup(userId, Array.from(accessibleGroups.keys()), false);
  })
  .catch(err => {
    return Promise.resolve({ err: err });
  })
  .then(isAccessible => {
    return Promise.resolve({ isAccessible: isAccessible });
  })
}

// callback = (err: boolean) => {}
const checkAccess = (userId, propertyId, propertyType, targetRole, callback) => {
  checkAccessHelper(userId, propertyId, propertyType, targetRole)
  .then(result => {
    return callback(result.err, result.isAccessible);
  })
}

// op: 'add' or 'remove'
// targetRole is the role of candidate instead of requester.
// Return Promise({ err: error })
const mutateAccessOfOneUserHelper = (requesterId, candidateId, op, propertyId, propertyType, targetRole) => {
  checkAccessHelper(requesterId, propertyId, propertyType, TypeAndRole.getAboveRole(targetRole))
  .then(result => {
    if (result.err) {
    	return Promise.resolve({ err: err }); 
    }
    if (!result.isAccessible) {
      return Promise.resolve({ err: new Error('PERMISSION_DENIED') });
    }
    const groupName = getDefaultGroupName(propertyId, propertyType, targetRole);
    switch (op) {
      case 'add':
        Group.addToGroup(requesterId, groupName, candidateId, (err, value) => {
          if (!err) {
            return Promise.resolve({ err: err });
          }
          return Promise.resolve({});
        });
        break;
      case 'remove':
        Group.removeFromGroup(requesterId, groupName, candidateId, (err, value) => {
          if (!err) {
            return Promise.resolve({ err: err });
          }
          return Promise.resolve({});
        });
        break;
      default:
        return Promise.resolve({ err: new Error(`Invalid operation ${op}.`) });
    }
  });
}

const addAccessOfOneUser = (requesterId, candidateId, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidateId, 'add', propertyId, propertyType, role).
  then(err => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, null);
  })
}

const removeAccessOfOneUser = (requesterId, candidateId, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, candidateId, 'add', propertyId, propertyType, role).
  then(err => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, null);
  })
}

module.exports = {
	checkAccess: checkAccess,
	addAccessOfOneUser: addAccessOfOneUser,
	removeAccessOfOneUser: removeAccessOfOneUser,
	addAccessOfOneGroup: addAccessOfOneGroup,
	removeAccessOfOneGroup: removeAccessOfOneGroup,
}