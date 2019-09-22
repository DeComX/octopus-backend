// Move the following configs of type and role into database.
const PropertyType = {
  CAMPAIGN: "campaign",
  CHANNEL: "channel",
  EVENT: "event",
  IMAGE: "image",
  MEMBER: "member",
  ORGANIZATION: "organization",
  SESSION: "session",
}

const DefaultRoles = {
  OWNER: "owner",
  AMDIN: "admin",
  READ: "read",
  READWRITE: "readwrite",
}

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

const listRoles = (type) => {
  switch(type) {
    default:
      return DefaultRoles;
	}
}

module.exports = {
	listPropertyTypes: listPropertyTypes,
	isPropertyBased: isPropertyBased,
	listRoles: listRoles,
}