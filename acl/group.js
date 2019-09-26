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

const GroupSchema = new Schema({
  // name is unique.
  name: String,
  ownerIds: [String],
  userIds: [String]
});

const GroupModel = mongoose.model('group', GroupSchema);

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

  const groupCreatorGroups = [GROUP_GROUP_CREATORS].concat(
    ...AclConfig.listPropertyTypes().map(type => {
      return AclConfig.getCreatorGroup(type);
  }));
  GroupModel.findOne({ name: GROUP_SYSTEM_ADMIN }).exec()
  .then(result => {
    if (result) {
      return callback(new Error(`${GROUP_SYSTEM_ADMIN} already exists.`), null);
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
    return groupCreatorGroups.map(group => {
      GroupModel.findOne({ name: group }).exec();
    });
  })
  .catch(err => {
    throw err;
  })
  .then(results => {
  	const groupToCreate = [];
  	for (let i = 0; i < results.length; i++) {
  	  if (!results[i]) {
  	    groupToCreate.push(groupCreatorGroups[i]);
  	  }
  	}
  	return groupToCreate.map(groupName => {
  	  let group = new GroupModel({
        name: groupName,
        ownerIds: [requesterId],
        userIds: []
      })
      return group.save();
  	});
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
  groupNameArray
    .filter(groupName => groupName !== GROUP_ALL_USERS && groupName !== GROUP_ALL)
    .map(groupName => {
      groupFilter.push({ name: groupName })
    });

  GroupModel.find(groupFilter)
  .then(groups => {
    if (!groups || !groups.length) {
      return Promise.resolve(false);
    }
    for (group of groups) {
      if (group.ownerIds.indexOf(userId) !== -1) {
        return Promise.resolve(true);
      }
      if (!isOwner && group.userIds.indexOf(userId) !== -1) {
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  })
}

const createGroup = (requesterId, groupName, callback) => {
  isInGroup(requesterId, [GROUP_GROUP_CREATORS], true)
  .then(accessible => {
    if (!accessible) {
      return callback(new Error(`No permission to create a group.`), null);
    }
    if (PROTECTED_GROUPS.indexOf(groupName) != -1) {
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
  GroupModel.findOne({ name: groupName }).exec()
  .then(result => {
    if (!result) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  })
  .catch(err => {
    return Promise.resolve(false);
  })
}

const addToGroup = (requesterId, groupName, userId, callback) => {
  isInGroup(requesterId, [groupName])
  .then(accessible => {
    if (!accessible) {
      return callback(new Error(`No permission to add user to the group.`), null);
    }
    return GroupModel.findOne({ name: groupName }).exec()
  })
  .then(group => {
    if (!group) {
      return callback(new Error(`${groupName} not found.`), null);
    }
    if (isAddOwner) {
      group.ownerIds.push(requesterId);
    } else {
      group.userId.push(requesterId);
    }
    return GroupModel.findOneAndUpdate({ name: groupName }, group).exec();
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

const removeFromGroup = (requesterId, groupName, isRemoveOwner, userId, callback) => {
  isInGroup(requesterId, [groupName], true)
  .then(accessible => {
    if (!accessible) {
      return callback(new Error(`No permission to remove user from the group.`), null);
    }
    return GroupModel.findOne({ name: groupName }).exec()
  })
  .then(group => {
    if (!group) {
      return callback(new Error(`${groupName} not found.`), null);
    }
    if (isRemoveOwner) {
      group.ownerIds = group.ownerIds.filter(id => id != requesterId);
    } else {
      group.userId = group.userId.filter(id => id != requesterId);
    }
    return GroupModel.findOneAndUpdate({ name: groupName }, group).exec();
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

// callback: (error, {own: [groups], access: [groups]} )
// Access groups is superset of own groups.
const listMyGroups = (requesterId, callback) => {
  let ownGroups = [];
  let accessGroups = [];
  GroupModel.find({ ownerIds: { $elemMatch: requesterId } }).exec()
  .then(ownGroups => {
    ownGroups = ownGroups.map(group => group.name);
    return GroupModel.find({ userIds: { $elemMatch: requesterId } }).exec();
  })
  .catch(err => {
    throw err;
  })
  .then(groups => {
    const dedupGroups = new Map();
    for (groupName of ownGroups) {
      dedupGroups.set(groupName, true);
    }
    for (group of groups) {
      dedupGroups.set(group.name, true);
    }
    accessGroups = Array.from(dedupGroups.keys());
    return callback(null, { own: ownGroups, access: accessGroups});
  })
  .catch(err => {
    return callback(err, null);
  })
}

module.exports = {
  // Init should only be caught once when bootstrapping the system.
  init: init,
  isInGroup, isInGroup,
  createGroup: createGroup,
  getGroup: getGroup,
  isExist: isExist,
  addToGroup: addToGroup,
  removeFromGroup: removeFromGroup,
  listMyGroups: listMyGroups
}