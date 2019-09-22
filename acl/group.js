const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
  name: String,
  userIds: [String]
});

const GroupModel = mongoose.model('group', GroupSchema);

// Everyone including non users.
const GROUP_ALL_NAME = 'group_all';
// All users.
const GROUP_ALL_USERS_NAME = 'group_all_users';

const GROUP_SYSTEM_ADMIN = new GroupModel({
  name: 'group_system_admin',
  userIds: []
});

const init = (callback) => {
  GROUP_SYSTEM_ADMIN.save()
  .then(result => {
    return callback(null, null);
  })
  .catch(err => {
  	return callback(err, null);
  })
};

const isInGroup = (groupName, userId) => {
  GroupModel.find({ name: groupName })
  .then(groups => {
    if (!groups || groups.length != 1) {
      return false;
    }
    for (uid of groups[0]) {
      if (uid === userId) {
        return true;
      }
    }
    return false;
  })
}

const isSystemAdmin = (userId) => {
	return isInGroup(GROUP_SYSTEM_ADMIN.name, userId);
}

const createGroup = (requesterId, name, callback) => {
  if (!isSystemAdmin(requesterId)) {
  	return callback(new Error('PERMISSION_DENIED'), null);
  }
  GroupModel.findOne({ name: name })
  .then(group => {
    if (group) {
      return callback(new Error('Group already exists.'), null);
    }
    const newGroup = new GroupModel({ name: name });
    return newGroup.save();
  })
  .catch(err => {
  	throw err;
  })
  .then(result => {
    return callback(null, null);
  })
  .catch(err => {
    return callback(err, null);
  })
}

const addToGroup = (requesterId, groupName, userId, callback) => {
  if (!isSystemAdmin(requesterId)) {
  	return callback(new Error('PERMISSION_DENIED'), null);
  }
  GroupModel.findOne({ name: groupName })
  .then(group => {
    if (!group) {
      return callback(new Error('Group not found.'), null);
    }
    group.userIds.push(userId);
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
  })
}

const removeFromGroup = (requesterId, groupName, userId, callback) => {
  if (!isSystemAdmin(requesterId)) {
  	return callback(new Error('PERMISSION_DENIED'), null);
  }
  GroupModel.findOne({ name: groupName })
  .then(group => {
    if (!group) {
      return callback(new Error('Group not found.'), null);
    }
    group.userIds = group.userIds.filter(id => id !== userId);
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
  })
}

module.exports = {
  init: init,
  isInGroup, isInGroup,
  createGroup: createGroup,
  addToGroup: addToGroup,
  removeFromGroup: removeFromGroup
}