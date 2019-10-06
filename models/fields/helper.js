const event = require('./event');
const session = require('./session');
const user = require('./user');
const organization = require('./organization');
const campaign = require('./campaign');
const channel = require('./channel');

const getPublicFields = (collectionName) => {
  switch(collectionName) {
    case 'event':
      return event.publicFields;
    case 'session':
      return session.publicFields;
    case 'user':
      return user.publicFields;
    case 'organization':
      return organization.publicFields;
    case 'campaign':
      return campaign.publicFields;
    case 'channel':
      return channel.publicFields;
    default:
      return {};
  }
}

const getFields = (collectionName) => {
  switch(collectionName) {
    case 'event':
      return event.fields;
    case 'session':
      return session.fields;
    case 'user':
      return user.fields;
    case 'organization':
      return organization.fields;
    case 'campaign':
      return campaign.fields;
    case 'channel':
      return channel.fields;
    default:
      return {};
  }
}

const getValidator = (collectionName) => {
  switch(collectionName) {
    case 'event':
      return event.validator;
    case 'session':
      return session.validator;
    case 'user':
      return user.validator;
    case 'organization':
      return organization.validator;
    case 'campaign':
      return campaign.validator;
    case 'channel':
      return channel.validator;
    default:
      return {};
  }
}

module.exports = {
  getPublicFields: getPublicFields,
  getFields: getFields,
  getValidator: getValidator,
}
