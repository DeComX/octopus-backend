const Schema = require("mongoose").Schema;
const ImageSchema = require('./image');

const ChannelPublicFields = {
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'wechat_group',
      'wechat_official_account',
      'meetup',
      'eventbrite',
      'forum',
      'email'
    ]
  },
  link: {
    type: String,
  }
};

const ChannelFields = {
  ...ChannelPublicFields,
  auth: {
    type: String,
  }
};

const ChannelValidator = (data) => {
  let errors = {};
  ['name', 'type'].map(
    (field) => {
      if (isEmpty(data[field])) {
        errors[field] = field + " field is required";
      }
    }
  );

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = {
  publicFields: ChannelPublicFields,
  fields: ChannelFields,
  validator: ChannelValidator
}
