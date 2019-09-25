const PropertyType = {
  CAMPAIGN: "campaign",
  CHANNEL: "channel",
  EVENT: "event",
  IMAGE: "image",
  MEMBER: "member",
  ORGANIZATION: "organization",
  SESSION: "session",
};

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
 * Member roles.
 *****************/
const MemberRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ_WRITE: "read_write",
  READ_METADATA: "read_metadata",
  READ_DETAIL: "read_detail",
};

const MemberAboveRoles = new Map([
  [MemberRoles.OWNER, null],
  [MemberRoles.AMDIN, MemberRoles.OWNER],
  [MemberRoles.READ_WRITE, MemberRoles.AMDIN],
  [MemberRoles.READ_METADATA, MemberRoles.READ_WRITE],
  [MemberRoles.READ_METADATA, MemberRoles.READ_METADATA],
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

const MemberAboveRoles = new Map([
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
    case PropertyType.MEMBER:
      return MemberAboveRoles;
    case PropertyType.EVENT:
      return MemberAboveRoles;
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
  listPropertyTypes = listPropertyTypes,
  isPropertyBased: isPropertyBased,
  getPropertyType: getPropertyType,
  getRoles: getRoles,
  getAboveRole: getAboveRole,
  getAboveRoles: getAboveRoles,
}