const Campaign = require("../models/Campaign");
const Event = require("../models/Event");
const Organization = require("../models/Organization");
const Session = require("../models/Session");
const User = require("../models/User");

const PropertyType = {
  CAMPAIGN: Campaign.collection.collectionName,
  CHANNEL: "channels",
  EVENT: Event.collection.collectionName,
  IMAGE: "images",
  USER: User.collection.collectionName,
  ORGANIZATION: Organization.collection.collectionName,
  SESSION: Session.collection.collectionName,
};

const CreateRole = "create";

const getCreatorGroupName = (propertyType) => {
  return `group_${propertyType}_creators`;
}

const getTypeAclGroupName = (propertyType, role) => {
  return `group_${propertyType}_${role}`;
}

/*****************
 * Default roles.
 *****************/
const DefaultRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ_WRITE: "read_write",
  READ: "read",
};

const DefaultAboveRoles = new Map([
  [DefaultRoles.OWNER, null],
  [DefaultRoles.AMDIN, DefaultRoles.OWNER],
  [DefaultRoles.READ_WRITE, DefaultRoles.AMDIN],
  [DefaultRoles.READ, DefaultRoles.READ_WRITE],
]);

/*****************
 * User roles.
 *****************/
const UserRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ_WRITE: "read_write",
  READ_DETAIL: "read_detail",
  READ_METADATA: "read_metadata",
};

const UserAboveRoles = new Map([
  [UserRoles.OWNER, null],
  [UserRoles.AMDIN, UserRoles.OWNER],
  [UserRoles.READ_WRITE, UserRoles.AMDIN],
  [UserRoles.READ_DETAIL, UserRoles.READ_WRITE],
  [UserRoles.READ_METADATA, UserRoles.READ_DETAIL],
]);

/*****************
 * Campaign roles.
 *****************/
const CampaignRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ_WRITE: "read_write",
  READ: "read",
  PUBLISH: "publish",
};

const CampaignAboveRoles = new Map([
  [CampaignRoles.OWNER, null],
  [CampaignRoles.AMDIN, CampaignRoles.OWNER],
  [CampaignRoles.READ_WRITE, CampaignRoles.AMDIN],
  [CampaignRoles.READ, CampaignRoles.READ_WRITE],
  [CampaignRoles.PUBLISH, CampaignRoles.AMDIN],
]);

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
    case PropertyType.MEMBER:
      return Object.values(MemberRoles);
    case PropertyType.CAMPAIGN:
      return Object.values(CampaignRoles);
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
  CreateRole: CreateRole,
  getCreatorGroupName: getCreatorGroupName,
  getTypeAclGroupName: getTypeAclGroupName,
  listPropertyTypes: listPropertyTypes,
  isPropertyBased: isPropertyBased,
  getRoles: getRoles,
  getAboveRole: getAboveRole,
  getAboveRoles: getAboveRoles,
}
