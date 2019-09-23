// Move the following configs of type and role into database.
const PropertyType = {
  CAMPAIGN: "campaign",
  CHANNEL: "channel",
  EVENT: "event",
  IMAGE: "image",
  MEMBER: "member",
  ORGANIZATION: "organization",
  SESSION: "session",
};

const DefaultRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ: "read",
  READWRITE: "readwrite",
};

const DefaultAdminRoles = new Map([
  [DefaultRoles.OWNER, null],
  [DefaultRoles.AMDIN, DefaultRoles.OWNER],
  [DefaultRoles.READ, DefaultRoles.AMDIN],
  [DefaultRoles.READWRITE, DefaultRoles.AMDIN],
]);

const listPropertyTypes = () => {
  return Object.values(PropertyType);
}

// Indicates if the acl of the given property type is property based. Otherwise
// the acl is role bases, whose property ID is empty.
const isPropertyBased = (propertyType) => {
  switch (propertyType) {
  	case PropertyType.MEMBER:
  	case PropertyType.ORGANIZATION:
  	  return false;
  	default:
  	  return true;
  }
}

const listRoles = (propertyType) => {
  switch (propertyType) {
    default:
      return Object.values(DefaultRoles);
	}
}

// Find the role, which can manage targetRole.
// Return undefined if targetRole and propertyType does not match.
const getAdminRole = (propertyType, targetRole) => {
  let adminRoleMap;
  switch (propertyType) {
    default:
    adminRoleMap = DefaultAdminRoles;
  }
  return adminRoleMap.get(targetRole);
}

// Find the role above and including targetRole.
// Return undefined if targetRole and propertyType does not match.
const getAboveRoles = (propertyType, targetRole) => {
  const aboveRoles = [];
  let adminRoleMap;
  switch (propertyType) {
    default:
    adminRoleMap = DefaultAdminRoles;
  }
  let role = targetRole;
  while (adminRoleMap.has(role)) {
    aboveRoles.push(role);
    role = adminRoleMap.get(role);
  }
}

module.exports = {
  listPropertyTypes: listPropertyTypes,
  isPropertyBased: isPropertyBased,
  listRoles: listRoles,
  getAdminRole: getAdminRole,
  getAboveRoles: getAboveRoles
}