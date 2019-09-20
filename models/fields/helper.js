const event = require('./event');
const session = require('./session');
const member = require('./member');
const organization = require('./organization');
const campaign = require('./campaign');


const getFields = (collectionName) => {
  switch(collectionName) {
    case 'events':
      return event.fields;
    case 'sessions':
      return session.fields;
    case 'members':
      return member.fields;
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
    case 'members':
      return member.validator;
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
