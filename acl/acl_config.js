const Campaign = require("../models/Campaign");
const Event = require("../models/Event");
const Organization = require("../models/Organization");
const Session = require("../models/Session");
const User = require("../models/User");
const Channel = require("../models/Channel");

const PropertyType = {
  CAMPAIGN: Campaign.collection.collectionName,
  CHANNEL: Channel.collection.collectionName,
  EVENT: Event.collection.collectionName,
  USER: User.collection.collectionName,
  ORGANIZATION: Organization.collection.collectionName,
  SESSION: Session.collection.collectionName,
};

const getTypeAclGroupName = (propertyType, role) => {
  return `group_${propertyType}_${role}`;
}

/*****************
 * Default roles.
 *****************/
const DefaultRoles = {
  ADMIN: "admin", // create/delete/publish
  READ_WRITE: "read_write", // read_write
  READ: "read", // read only
};

const DefaultAboveRoles = new Map([
  [DefaultRoles.ADMIN, null],
  [DefaultRoles.READ_WRITE, DefaultRoles.ADMIN],
  [DefaultRoles.READ, DefaultRoles.READ_WRITE],
]);

/*****************
 * Controlled roles.
 *****************/
const StrictRoles = {
  ADMIN: "admin", // create/delete
  READ_WRITE: "read_write", // read_write
  READ_DETAIL: "read_detail", // read only
  READ_METADATA: "read_metadata", // read meta only
};

const StrictAboveRules = new Map([
  [StrictRoles.ADMIN, null],
  [StrictRoles.READ_WRITE, StrictRoles.ADMIN],
  [StrictRoles.READ_DETAIL, StrictRoles.READ_WRITE],
  [StrictRoles.READ_METADATA, StrictRoles.READ_DETAIL],
]);

/*********************************
 * Predefined groups and access
 *********************************/

const PredefinedGroup = [
  "GROUP_Growth",
  "GROUP_BD_Team",
  "GROUP_Event_Team",
  "GROUP_Content_Team",
  "GROUP_Marketing_Team",
];

const PredefinedGroupAccess = {
  "GROUP_Growth": {
    PropertyType.USER: [
      StrictRoles.ADMIN,
    ],
    PropertyType.ORGANIZATION: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.SESSION: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.EVENT: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.CAMPAIGN: [
      StrictRoles.READ_DETAIL,
    ],
  },
  "GROUP_BD_Team": {
    PropertyType.USER: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.ORGANIZATION: [
      StrictRoles.ADMIN,
    ],
    PropertyType.SESSION: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.EVENT: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.CAMPAIGN: [
      StrictRoles.READ_DETAIL,
    ],
  },
  "GROUP_Event_Team": {
    PropertyType.USER: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.ORGANIZATION: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.SESSION: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.EVENT: [
      StrictRoles.ADMIN,
    ],
    PropertyType.CAMPAIGN: [
      StrictRoles.READ_DETAIL,
    ],
  },
  "GROUP_Content_Team": {
    PropertyType.USER: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.ORGANIZATION: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.SESSION: [
      StrictRoles.ADMIN,
    ],
    PropertyType.EVENT: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.CAMPAIGN: [
      StrictRoles.READ_DETAIL,
    ],
  "GROUP_Marketing_Team": {
    PropertyType.USER: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.ORGANIZATION: [
      StrictRoles.READ_METADATA,
    ],
    PropertyType.SESSION: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.EVENT: [
      StrictRoles.READ_DETAIL,
    ],
    PropertyType.CAMPAIGN: [
      StrictRoles.ADMIN,
    ],
};

/****************************************************/

const listPropertyTypes = () => {
  return Object.values(PropertyType);
}

// Indicates if the acl of the given property type is property based. Otherwise
// the acl is role bases, whose property ID is empty.
const isPropertyBased = (propertyType) => {
  switch (propertyType) {
    case PropertyType.USER:
    case PropertyType.ORGANIZATION:
    case PropertyType.SESSION:
    case PropertyType.CHANNEL:
      return true;
    default:
      return false;
  }
}

const getRoles = (propertyType) => {
  switch (propertyType) {
    case PropertyType.USER:
      return Object.values(StrictRoles);
    case PropertyType.ORGANIZATION:
      return Object.values(StrictRoles);
    default:
      return Object.values(DefaultRoles);
  }
}

const getAllAboveRoles = (propertyType) => {
  switch (propertyType) {
    case PropertyType.user:
      return UserAboveRoles;
    case PropertyType.CAMPAIGN:
      return CampaignAboveRoles;
    default:
      return DefaultAboveRoles;
  }
}

const getAboveRole = (propertyType, role) => {
  return getAllAboveRoles(propertyType).get(role);
}

// Find the role above and including targetRole.
// Return undefined if targetRole and propertyType does not match.
const getAboveRoles = (propertyType, targetRole) => {
  const aboveRoles = [];
  let adminRoleMap = getAllAboveRoles(propertyType);
  let role = targetRole;
  while (adminRoleMap.has(role)) {
    aboveRoles.push(role);
    role = adminRoleMap.get(role);
  }
  return aboveRoles;
}

module.exports = {
  getTypeAclGroupName: getTypeAclGroupName,
  listPropertyTypes: listPropertyTypes,
  isPropertyBased: isPropertyBased,
  getRoles: getRoles,
  getAboveRole: getAboveRole,
  getAboveRoles: getAboveRoles,
}
