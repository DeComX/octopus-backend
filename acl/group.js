const AclConfig = require('./acl_config');
/*
 * Group for ACL.
 * Each group contains a list of owners and a list of members. Nested group
 * is not supported.
 * Group name is unique.
 * Group owner can add/remove memeber/owner.
 * Only memebers in GROUP_GROUP_CREATORS can create new groups.
 * PROTECTED_GROUPS contains whitelisted group names, which cannot be used.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'group';
const GroupSchema = new Schema({
  // name is unique.
  name: {
    type: String,
    required: true,
    unique: true
  },
  ownerIds: [String],
  userIds: [String]
}, {collection: collectionName});

const GroupModel = mongoose.model(collectionName, GroupSchema);
const UserModel = require('../models/User');

// Everyone including non users.
const GROUP_ALL = 'GROUP_ALL';
// All users.
const GROUP_ALL_USERS = 'GROUP_ALL_USERS';
// System admin group.
const GROUP_SYSTEM_ADMIN = 'GROUP_SYSTEM_ADMIN';
// The groups users, who can create new groups;
const GROUP_GROUP_CREATORS = 'GROUP_GROUP_CREATORS';

const PROTECTED_GROUPS = [GROUP_SYSTEM_ADMIN, GROUP_GROUP_CREATORS, GROUP_ALL_USERS, GROUP_ALL];


// callback: (err, value) => {}
// value is always null.
const init = (requesterId, callback) => {
  if (!requesterId) {
    return callback(new Error('Missing system owner user ID.'), null);
  }

  // The acl groups for all property types.
  const typeAclGroups = AclConfig.listPropertyTypes().flatMap(type => {
    return AclConfig.getRoles(type).map(role => {
      return AclConfig.getTypeAclGroupName(type, role);
    });
  });

  const groupCreatorGroups = typeAclGroups.concat(
    ...AclConfig.PredefinedGroup);

  GroupModel.findOne({ name: GROUP_SYSTEM_ADMIN }).exec()
  .then(result => {
    if (result) {
      console.log("Group GROUP_SYSTEM_ADMIN already exists, skipping...");
      return Promise.resolve({});
    }
    let group_system_admin = new GroupModel({
      name: GROUP_SYSTEM_ADMIN,
      ownerIds: [requesterId],
      userIds: []
    })
    return group_system_admin.save();
  })
  .catch(err => {
    throw err;
  })
  .then(result => {
    return Promise.all(groupCreatorGroups.map(group => {
      GroupModel.findOne({ name: group }).exec();
    }));
  })
  .catch(err => {
    throw err;
  })
  .then(results => {
  	const actualGroupsToCreate = [];
  	for (let i = 0; i < results.length; i++) {
  	  if (!results[i]) {
  	    actualGroupsToCreate.push(groupCreatorGroups[i]);
  	  }
  	}
  	return Promise.all(actualGroupsToCreate.map(groupName => {
      let group = new GroupModel({
        name: groupName,
        ownerIds: [requesterId],
        userIds: []
      })
      return group.save();
  	}));
  })
  .catch(err => {
  	throw err;
  })
  .then(result => {
  	return callback(null, null);
  })
  .catch(err => {
  	return callback(err, null);
  });
}

// Return Promise(boolean).
const isInGroup = (userId, groupNameArray, isOwner) => {
  if (!userId || !groupNameArray || !groupNameArray.length) {
    return Promise.resolve(false);
  }
  allGroups = groupNameArray.filter(groupName => groupName === GROUP_ALL_USERS || groupName === GROUP_ALL);
  if (allGroups.length) {
    return Promise.resolve(true);
  }
  let groupFilter = [];
  allGroups.map(groupName => {
    groupFilter.push({ name: groupName })
  });

  return new Promise((resolve, reject) => {
    GroupModel.find({$or: groupFilter})
    .then(groups => {
      if (!groups || !groups.length) {
        resolve(false);
      }
      for (group of groups) {
        if (group.ownerIds.indexOf(userId) !== -1) {
          resolve(true);
        }
        if (!isOwner && group.userIds.indexOf(userId) !== -1) {
          resolve(true);
        }
      }
      resolve(false);
    })
  });
}

const createGroup = (requesterId, groupName, callback) => {
  isInGroup(requesterId, [GROUP_GROUP_CREATORS], true)
  .then(accessible => {
    if (!accessible) {
      return callback(new Error(`No permission to create a group.`), null);
    }
    if (PROTECTED_GROUPS.indexOf(groupName) !== -1) {
      return callback(new Error(`Cannot create group ${groupName}`), null);
    }
    return GroupModel.findOne({ name: groupName }).exec();
  })
  .then(result => {
    if (result) {
    	return callback(new Error(`${groupName} already exists.`), null);
    }
    let group = new GroupModel({
      name: groupName,
      ownerIds: [requesterId],
      userIds: []
    })
    return group.save();
  })
  .catch(err => {
    throw err;
  })
  .then(result => {
    return callback(null, null);
  })
  .catch(err => {
    return callback(err, null);
  });
}

// callback: (err, {name: String, ownerIds: [String], userIds: [String]})
const getGroup = (requesterId, groupName, callback) => {
  isInGroup(requesterId, [groupName], false)
  .then(isMember => {
    if (!isMember) {
      return callback(new Error(`No permission to get group ${groupName}`));
    }
    return GroupModel.findOne({ name: groupName }).exec();
  })
  .catch(err => {
    throw err;
  })
  .then(group => {
    return callback(null, group);
  })
  .catch(err => {
    return callback(err, null);
  })
}

// Return Promise(boolean).
const isExist = (groupName) => {
  return new Promise((resolve, reject) => {
    GroupModel.findOne({ name: groupName }).exec()
    .then(result => {
      if (!result) {
        resolve(false);
      }
      resolve(true);
    })
    .catch(err => {
      resolve(false);
    })
  });
}

const isOwnerOfGroup = (requesterId, groupName) => {
  return new Promise((resolve, reject) => {
    GroupModel
      .findOne({ name: groupName })
      .then(group => {
        if (group) {
          resolve(group.ownerIds.indexOf(requesterId) !== -1);
        } else {
          resolve(false);
        }
      })
      .catch(err => resolve(false));
  });
}

const updateGroup = (requesterId, groupName, update, callback) => {
  isOwnerOfGroup(requesterId, [groupName])
  .then(accessible => {
    if (!accessible) {
      throw(new Error(`No permission to add user to the group.`));
    }
    return GroupModel.findOneAndUpdate({ name: groupName }, update).exec()
  })
  .then(group => {
    callback(null, group);
  })
  .catch(err => {
    callback(err, null);
  });
}

// callback: (error, {own: [groups], access: [groups]} )
// Access groups is superset of own groups.
const listMyGroups = (requesterId, callback) => {
  let ownGroups = [];
  let accessGroups = [];

  GroupModel.find({ ownerIds: requesterId }).exec()
  .then(queriedOwnGroups => {
    ownGroups = queriedOwnGroups || [];
    return GroupModel.find({
       $and: [{
         userIds: requesterId
       }, {
         ownerIds: { "$ne": requesterId }
       }]
     }).exec();
  })
  .catch(err => {
    throw err;
  })
  .then(groups => {
    accessGroups = groups || [];
    let userIds = new Set([]);
    for (const group of ownGroups.concat(accessGroups)) {
      for (const userId of group.ownerIds.concat(group.userIds || [])) {
        userIds.add(userId);
      }
    }
    return UserModel.where('_id').in(Array.from(userIds)).exec();
  })
  .catch(err => {
    return callback(err, null);
  })
  .then(queriedUsers => {
    let users = queriedUsers.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});
    return callback(null, {
      own: ownGroups,
      access: accessGroups,
      users: users
    });
  })
}

// Do not expose this function through routes.
// groupArray: [{name: String, ownerId: String}]
const createGroupsInternal = (groupArray) => {
  return groupArray.map(item => {
    const newGroup = new GroupModel({
      name: item.group,
      ownerIds: [item.ownerId],
      userIds: []
    });
    return newGroup.save();
  });
}

module.exports = {
  // Init should only be caught once when bootstrapping the system.
  init: init,
  isInGroup, isInGroup,
  createGroup: createGroup,
  getGroup: getGroup,
  isExist: isExist,
  updateGroup: updateGroup,
  listMyGroups: listMyGroups,
  createGroupsInternal: createGroupsInternal,
  GroupModelInternal: GroupModel,
}
