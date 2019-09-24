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
    return GroupModel.findOne({ name: GROUP_GROUP_CREATORS }).exec();
  })
  .catch(err => {
    throw err;
  })
  .then(result => {
    if (result) {
      return callback(new Error(`${GROUP_GROUP_CREATORS} already exists.`), null);
    }
    let group_group_creators = new GroupModel({
      name: GROUP_GROUP_CREATORS,
      ownerIds: [requesterId],
      userIds: []
    })
    return group_group_creators.save();
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
}

module.exports = {
  // Init should only be caught once when bootstrapping the system.
  init: init,
  isInGroup, isInGroup,
  createGroup: createGroup,
  addToGroup: addToGroup,
  removeFromGroup: removeFromGroup,
  listMyGroups: listMyGroups
}