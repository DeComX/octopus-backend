const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GroupModule = require('./group');
const AclConfig = require('./acl_config');
const User = require("../models/User");


const collectionName = 'access_control';
const AccessSchema = new Schema({
  propertyId: String,
  propertyType: String,
  group: String,
  role: String
}, {collection: collectionName});

const AccessModel = mongoose.model(collectionName, AccessSchema);

const init = (requesterId, callback) => {
  const types = AclConfig.listPropertyTypes()
      .filter(type => AclConfig.isPropertyBased(type));
  let accesses = types.flatMap(type => {
    return AclConfig.getRoles(type).map(role => {
      return {
        propertyType: type,
        group: AclConfig.getTypeAclGroupName(type, role),
        role: role,
      };
    });
  });
  // Add pre-defined access.
  accesses = accesses.concat(
    ...Object.keys(AclConfig.PredefinedGroupAccess).flatMap(group => {
      const groupAccess = [];
      for (let [property, roles] of AclConfig.PredefinedGroupAccess[group]) {
        for (let role of roles) {
          groupAccess.push({
            propertyType: property,
            group: group,
            role: role,
          });
        }
      }
      return groupAccess;
    })
  );
  const findTypeAccessPromises = accesses.map(access => {
    return AccessModel.findOne(access).exec();
  })
  Promise.all(findTypeAccessPromises)
  .then(results => {
    let accessToCreate = [];
    for (let idx = 0; idx < results.length; idx++) {
      if (!results[idx]) {
        const row = new AccessModel(accesses[idx]);
        accessToCreate.push(row.save());
      }
    }
    return Promise.all(accessToCreate);
  })
  .catch(err => {
    throw err;
  })
  .then(results => {
    return callback(null, null);
  })
  .catch(err => {
    return callback(err, null);
  });
}

/*
 * Name of the default group for adding individuals is
 * `${propertyType}_${propertyId}_${role}_group`
 */
const getDefaultGroupName = (propertyId, propertyType, role) => {
	return `${propertyType}_${propertyId}_${role}_group`;
}


const findPropertyCondition = (propertyId, propertyType) => {
  if (AclConfig.isPropertyBased(propertyType)) {
    return { 'propertyType': propertyType };
  }
  return { 'propertyId': propertyId };
}

// Return Promise({ err: error, isAccessible: boolean })
// accessRow is the AccessSet with given targetRole.
const checkAccessHelper = (requesterId, propertyId, propertyType, targetRole) => {
  if (propertyType == User.collection.collectionName) {
    if (requesterId == propertyId) {
      return Promise.resolve({ isAccessible: true });
    }
  }
  const aboveRolesList = AclConfig.getAboveRoles(propertyType, targetRole);
  const aboveRolesMap = aboveRolesList.reduce((map, role) => {
    map.set(role, true);
    return map;
  }, new Map());
  return new Promise((resolve, reject) => {
    let condition = { 'propertyType': propertyType };
    if (!AclConfig.isPropertyBased(propertyType)) {
      condition = { $or: [{'propertyType': propertyType},{'propertyId': propertyId}]};
    }

    AccessModel.find( condition ).exec()
    .then(accessRows => {
      if (!accessRows || !accessRows.length) {
        resolve({
          err: new Error("Cannot find the property")
        });
      }
      const accessibleRows = accessRows.filter(row => aboveRolesMap.has(row));
      if (!accessibleRows || accessibleRows.length == 0) {
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
  checkAccessHelper(requesterId, propertyId, propertyType, AclConfig.getAboveRole(targetRole))
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
        GroupModule.addToGroup(requesterId, groupName, candidateId, (err, value) => {
          if (!err) {
            return Promise.reject(err);
          }
          return Promise.resolve({});
        });
        break;
      case 'remove':
        GroupModule.removeFromGroup(requesterId, groupName, candidateId, (err, value) => {
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
  checkAccessHelper(requesterId, propertyId, propertyType, AclConfig.getAboveRole(targetRole))
  .then(result => {
    if (result.err) {
    	return Promise.reject(err);
    }
    if (!result.isAccessible) {
      return Promise.reject(new Error('PERMISSION_DENIED'));
    }
    return GroupModule.isExist(groupName);
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
  return (AclConfig.isPropertyBased(propertyType) || !propertyId)
    ? propertyType
    : propertyId;
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
    GroupModule.listMyGroups(requesterId, (err, result) => {
      if (err) {
        reject(err);
      } else if (!result || !result.access || !result.access.length) {
        resolve({ accessGroups: [] });
      } else {
        resolve({ accessGroups: result.access });
      }
    });
  });
  return listMyGroupsPromise
  .then(result => {
    const groupConditionArray = result.accessGroups.map(group => {
      return { 'group': group };
    });
    if (groupConditionArray.length == 0) {
      return Promise.resolve([]);
    }
    let condition = {
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
    for (let row of rows) {
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
    for (let accessProperty of accessPropertyArray) {
      accessProperty.role = getTopRole(accessProperty.propertyType, accessProperty.roles);
      delete accessProperty.roles
    }
    return Promise.resolve({ access: accessPropertyArray });
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

// Input an array of roles. Output the highest role.
const getTopRole = (type, roles) => {
  if (roles.length == 0) {
    return null;
  }
  for (let role of AclConfig.getRoles(type)) {
    if (roles.indexOf(role) != -1) {
      return role;
    }
  }
  return roles[0];
};

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
  let access = [];
  const propertyConditionArray = propertyArray.map(property => {
    if (property.propertyType === AclConfig.PropertyType.USER
        && property.propertyId === requesterId) {
      access.push({
        propertyId: property.propertyId,
        propertyType: property.propertyType,
        role: AclConfig.StrictRoles.ADMIN
      });
      return undefined;
    } else {
      return findPropertyCondition(property.propertyId, property.propertyType);
    }
  }).filter(condition => condition !== undefined);
  listRolesOnPropertiesHelper(requesterId, propertyConditionArray)
  .then(result => {
    result.access = result.access.concat(access);
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
  return listRolesOnPropertiesHelper(requesterId, propertyConditionArray)
  .then(result => {
    return callback(null, result);
  })
  .catch(err => {
    return callback(err, null);
  });
}

const createAclForNewProperty = (requesterId, propertyId, propertyType) => {
  GroupModule.isInGroup(
    requesterId,
    AclConfig.getTypeAclGroupName(propertyType, "admin"),
    false)
  .then(isAccessible => {
    if (!isAccessible) {
      return Promise.reject(new Error("PERMISSION_DENIED"));
    }
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
    return Promise.all(GroupModule.createGroupsInternal(groupArray));
  })
  .then(result => {
    return Promise.all(accessArray.map( access => access.save()));
  })
  .catch(err => {
    throw err;
  })
  .then(result => {
    return Promise.resolve({});
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

module.exports = {
  init: init,
  checkAccess: checkAccess,
  addAccessOfOneUser: addAccessOfOneUser,
  removeAccessOfOneUser: removeAccessOfOneUser,
  addAccessOfOneGroup: addAccessOfOneGroup,
  removeAccessOfOneGroup: removeAccessOfOneGroup,
  listRolesOnProperties: listRolesOnProperties,
  listRolesOnPropertyTypes: listRolesOnPropertyTypes,
  createAclForNewProperty: createAclForNewProperty,
  AccessModelInternal: AccessModel
}
