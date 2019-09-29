const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TypeAndRole = require('./acl_config');
const Group = require('./group');
const AclConfig = require('./acl_config');

const AccessSchema = new Schema({
  propertyId: String,
  propertyType: String,
  group: String,
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

const checkCreateAccess = (requesterId, propertyType) => {
  return new Promise((resolve, reject) => {
    Group.isInGroup(requesterId, [AclConfig.getCreatorGroup(propertyType)], false)
    .then(isAccessible => {
      resolve({ isAccessible: isAccessible });
    })
    .catch(err => {
      reject(err);
    });
  });
}

// Return Promise({ err: error, isAccessible: boolean })
// accessRow is the AccessSet with given targetRole.
const checkAccessHelper = (requesterId, propertyId, propertyType, targetRole) => {
  if (targetRole === AclConfig.CreateRole) {
    return checkCreateAccess(requesterId, propertyType);
  }
  const aboveRolesList = TypeAndRole.getAboveRoles(propertyType, targetRole);
  const aboveRolesMap = aboveRoleList.reduce((map, role) => {
    map.set(role, true);
    return map;
  }, new Map());
  return new Promise((resolve, reject) => {
    AccessModel.find( findPropertyCondition(propertyId, propertyType) ).exec()
    .then(accessRows => {
      if (!accessRows || !accessRows.length) {
        resolve({
          err: new Error("Cannot find the property")
        });
      }
      const accessibleRows = accessRows.filter(row => aboveRolesMap.has(row));
      if (!accessibleRows || !accessibleRows.length) {
        resolve({ isAccessible: false });
      }
      const accessibleGroups = new Map();
      for (row of accessibleRows) {
        accessibleGroups.set(row.group, true);
      }
      Group
        .isInGroup(userId, Array.from(accessibleGroups.keys()), false)
        .then(accessible => resolve({isAccessible: accessible}));
    })
    .catch(err => {
      reject(err);
    })
    .then(isAccessible => {
      resolve({ isAccessible: isAccessible });
    })
  });
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
    	return Promise.reject(err);
    }
    if (!result.isAccessible) {
      return Promise.reject(new Error('PERMISSION_DENIED'));
    }
    const groupName = getDefaultGroupName(propertyId, propertyType, targetRole);
    switch (op) {
      case 'add':
        Group.addToGroup(requesterId, groupName, candidateId, (err, value) => {
          if (!err) {
            return Promise.reject(err);
          }
          return Promise.resolve({});
        });
        break;
      case 'remove':
        Group.removeFromGroup(requesterId, groupName, candidateId, (err, value) => {
          if (!err) {
            return Promise.reject(err);
          }
          return Promise.resolve({});
        });
        break;
      default:
        return Promise.reject(new Error(`Invalid operation ${op}.`));
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
  mutateAccessHelper(requesterId, candidateId, 'remove', propertyId, propertyType, role).
  then(err => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, null);
  })
}

// op: 'add' or 'remove'
// targetRole is the role of candidate instead of requester.
// Return Promise({ err: error })
const mutateAccessOfOneGroupHelper = (requesterId, groupName, op, propertyId, propertyType, targetRole) => {
  checkAccessHelper(requesterId, propertyId, propertyType, TypeAndRole.getAboveRole(targetRole))
  .then(result => {
    if (result.err) {
    	return Promise.reject(err);
    }
    if (!result.isAccessible) {
      return Promise.reject(new Error('PERMISSION_DENIED'));
    }
    return Group.isExist(groupName);
  })
  .then(exists => {
    if (!exists) {
      return Promise.reject(new Error(`Group ${groupName} does not exists.`));
    }
    switch (op) {
      case 'add':
        const newAccessRow = new AccessModel({
          propertyId: propertyId,
          propertyType: propertyType,
          group: groupName,
          role: targetRole
        })
        return newAccessRow.save();
      case 'remove':
        return AccessModel.findOneAndDelete({
          propertyId: propertyId,
          propertyType: propertyType,
          group: groupName,
          role: targetRole
        }).exec();
      default:
        return Promise.reject(new Error(`Invalid operation ${op}.`));
    }
  })
  .then(result => {
    return Promise.resolve({});
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

const addAccessOfOneGroup = (requesterId, groupName, propertyId, propertyType, role, callback) => {
  mutateAccessOfOneGroupHelper(requesterId, groupName, 'add', propertyId, propertyType, role).
  then(err => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, null);
  })
}

const removeAccessOfOneGroup = (requesterId, groupName, propertyId, propertyType, role, callback) => {
  mutateAccessHelper(requesterId, groupName, 'remove', propertyId, propertyType, role).
  then(err => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, null);
  })
}

const encodeProperty = (propertyId, propertyType) => {
  return TypeAndRole.isPropertyBased(propertyType) ? propertyId : propertyType;
}

//
// Returns: Promise({
//            err: error,
//            access: [{
//                       propertyId: String,
//                       propertyType: String,
//                       roles: [String]
//                     }]
//          })
const listRolesOnPropertiesHelper = (requesterId, propertyConditionArray) => {
  const listMyGroupsPromise = new Promise((resolve, reject) => {
    Group.listMyGroups(requesterId, (err, result) => {
      if (err) {
        reject(err);
      }
      if (!result || !result.access || !result.access.length) {
        resolve({ accessGroups: [] });
      }
      resolve({ accessGroups: result.access });
    });
  });
  listMyGroupsPromise
  .then(result => {
    const groupConditionArray = result.accessGroups.map(group => {
      return { 'name': group };
    });
    const condition = {
      $and: [
        { $or: propertyConditionArray },
        { $or: groupConditionArray }
      ]
    }
    return AccessModel.find(condition).exec();
  })
  .catch(err => {
    throw new Error(`Failed to listMyGroups. Error: ${err}`);
  })
  .then(rows => {
  	const propertyMap = new Map();
    for (row of rows) {
      const idf = encodeProperty(row.propertyId, row.propertyType);
      if (!propertyMap.has(idf)) {
        propertyMap.set(idf, {
          propertyId: row.propertyId,
          propertyType: row.propertyType,
          roles: []
        });
      }
      propertyMap.get(idf)['roles'].push(row.role);
    }
    const accessPropertyArray = Array.from(propertyMap.values()).filter(ap => {
      return ap.roles && ap.roles.length > 0;
    });
    return Promise.resolve({ access: accessPropertyArray });
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

// propertyArray: [{propertyId: String, propertyType: String}, ...]
// Returns: callback(err, {
//            err: error,
//            access: [{
//                       propertyId: String,
//                       propertyType: String,
//                       roles: [String]
//                     }]
//          })
const listRolesOnProperties = (requesterId, propertyArray, callback) => {
  if (!propertyArray || !propertyArray.length) {
    return Promise.resolve({ access: [] });
  }
  const propertyConditionArray = propertyArray.map(property => {
    return findPropertyCondition(property.propertyId, property.propertyType);
  });
  listRolesOnPropertiesHelper(requesterId, propertyConditionArray)
  .then(result => {
    return callback(null, result);
  })
  .catch(err => {
    return callback(err, null);
  });
}

// propertyTypeArray: [type]
// Returns: callback(err, {
//            err: error,
//            access: [{
//                       propertyId: String,
//                       propertyType: String,
//                       roles: [String]
//                     }]
//          })
const listRolesOnPropertyTypes = (requesterId, propertyTypeArray, callback) => {
  if (!propertyTypeArray || !propertyTypeArray.length) {
    return Promise.resolve({ access: [] });
  }
  const propertyConditionArray = propertyTypeArray.map(type => {
    return { 'propertyType': type };
  });
  listRolesOnPropertiesHelper(requesterId, propertyConditionArray)
  .then(result => {
    return callback(null, result);
  })
  .catch(err => {
    return callback(err, null);
  });
}

const createAclForNewProperty = (requesterId, propertyId, propertyType) => {
  const accessArray = AclConfig.getRoles(propertyType).map(role => {
    let name = `group_${propertyType}_${role}`;
    if (!AclConfig.isPropertyBased(propertyType)) {
      name = `group_${propertyType}_${propertyId}_${role}`;
    }
    return new AccessModel({
      propertyId: propertyId,
      propertyType: propertyType,
      group: name,
      role: role
    });
  });
  const groupArray = accessArray.map(access => {
    return {
      group: access.group,
      ownerId: requesterId
    };
  });
  Promise.all(Group.createGroupsInternal(groupArray))
  .then(result => {
    return Promise.all(accessArray.map( access => access.save()));
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

module.exports = {
  checkAccess: checkAccess,
  addAccessOfOneUser: addAccessOfOneUser,
  removeAccessOfOneUser: removeAccessOfOneUser,
  addAccessOfOneGroup: addAccessOfOneGroup,
  removeAccessOfOneGroup: removeAccessOfOneGroup,
  listRolesOnProperties: listRolesOnProperties,
  listRolesOnPropertyTypes: listRolesOnPropertyTypes,
  createAclForNewProperty: createAclForNewProperty
}
