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

const getCreatorGroup = (propertyType) => {
  return `group_${propertyType}_creators`;
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
  READ_METADATA: "read_metadata",
  READ_DETAIL: "read_detail",
};

const UserAboveRoles = new Map([
  [UserRoles.OWNER, null],
  [UserRoles.AMDIN, UserRoles.OWNER],
  [UserRoles.READ_WRITE, UserRoles.AMDIN],
  [UserRoles.READ_METADATA, UserRoles.READ_WRITE],
  [UserRoles.READ_METADATA, UserRoles.READ_METADATA],
]);

/*****************
 * Event roles.
 *****************/
const EventRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ_WRITE: "read_write",
  READ: "read",
  PUBLISH: "publish",
};

const EventAboveRoles = new Map([
  [EventRoles.OWNER, null],
  [EventRoles.AMDIN, EventRoles.OWNER],
  [EventRoles.READ_WRITE, EventRoles.AMDIN],
  [EventRoles.READ, EventRoles.READ_WRITE],
  [EventRoles.PUBLISH, EventRoles.AMDIN],
]);

/****************************************************/

const listPropertyTypes = () => {
  return Object.values(PropertyType);
}

// Indicates if the acl of the given property type is property based. Otherwise
// the acl is role bases, whose property ID is empty.
const isPropertyBased = (propertyType) => {
  switch (propertyType) {
    case PropertyType.MEMBER:
    case PropertyType.ORGANIZATION:
    case PropertyType.SESSION:
      return false;
    default:
      return true;
  }
}

const getRoles = (propertyType) => {
  switch (propertyType) {
    case PropertyType.MEMBER:
      return Object.values(MemberRoles);
    case PropertyType.EVENT:
      return Object.values(EventRoles);
    default:
      return Object.values(DefaultRoles);
  }
}

const getAllAboveRoles = (propertyType) => {
  switch (propertyType) {
    case PropertyType.user:
      return UserAboveRoles;
    case PropertyType.EVENT:
      return EventAboveRoles;
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
  getCreatorGroup: getCreatorGroup,
  listPropertyTypes: listPropertyTypes,
  isPropertyBased: isPropertyBased,
  getRoles: getRoles,
  getAboveRole: getAboveRole,
  getAboveRoles: getAboveRoles,
}