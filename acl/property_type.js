// Move the following configs of type and role into database.
const PropertyType = {
  CAMPAIGN: "campaign",
  CHANNEL: "channel",
  EVENT: "event",
  USER: "user",
  ORGANIZATION: "organization",
  SESSION: "session",
};

const DefaultRoles = {
  ADMIN: "admin",
  READ: "read",
  READ_WRITE: "read_write",
};

const DefaultAdminRoles = new Map([
  [DefaultRoles.ADMIN, null],
  [DefaultRoles.READ, DefaultRoles.ADMIN],
  [DefaultRoles.READWRITE, DefaultRoles.ADMIN],
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
    case PropertyType.CHANNEL:
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
