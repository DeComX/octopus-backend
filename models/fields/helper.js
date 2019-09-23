const event = require('./event');
const session = require('./session');
const user = require('./user');
const organization = require('./organization');
const campaign = require('./campaign');

const getFields = (collectionName) => {
  switch(collectionName) {
    case 'events':
      return event.fields;
    case 'sessions':
      return session.fields;
    case 'users':
      return user.fields;
    case 'organizations':
      return organization.fields;
    case 'campaigns':
      return campaign.fields;
    default:
      return {};
  }
}

const getValidator = (collectionName) => {
  switch(collectionName) {
    case 'events':
      return event.validator;
    case 'sessions':
      return session.validator;
    case 'users':
      return user.validator;
    case 'organizations':
      return organization.validator;
    case 'campaigns':
      return campaign.validator;
    default:
      return {};
  }
}

module.exports = {
  getFields: getFields,
  getValidator: getValidator,
}
