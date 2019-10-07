const Schema = require("mongoose").Schema;
const Validator = require("validator");
const isEmpty = require("is-empty");

const ImageSchema = require('./image');
const Address = require('./address');

const OrganizationPublicFields = {
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  website: {
    type: String,
  },
  addresses: {
    type: [Address.schema],
  },
  logo: {
    type: ImageSchema,
  },
};

ContactInfoScheam = new Schema({
  type: {
    type: String,
    enum: ['email', 'wechat', 'tel', 'telegram', 'facebook', 'linkedin'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
},{ _id : false });

ContactSchma = new Schema({
  name: {
    type: String,
  },
  title: {
    type: String
  },
  contact_info: {
    type: [ContactInfoScheam]
  },
  // user id if the user is one of our members
  user_id: {
    type: String
  }
},{ _id : false });

const OrganizationFields = {
  ...OrganizationPublicFields,
  type: {
    type: [String],
    enum: ['venue', 'project', 'community', 'capital', 'other'],
    requried: true
  },
  contacts: {
    type: [ContactSchma]
  },
  focused_area: {
    type: [String]
  },
  imgs: {
    type: [ImageSchema]
  },
  extra_fields: {}
};

const OrganizationValidator = (data) => {
  let errors = {};
  ['name', 'type'].map(
    (field) => {
      if (isEmpty(data[field])) {
        errors[field] = field + " field is required";
      }
    }
  );
  let isValid = isEmpty(errors);
  if (data.type === 'venue') {
    if (data.addresses.length === 0) {
      errors.addresses_all = "At least one address is required for veune org";
    } else {
      errors.addresses = data.addresses.map(address => {
        Address.validator(data.address);
      });
    }
    isValid = isValid && errors.addresses.reduce((isValid, errRes) => {
      return isValid && errRes.isValid;
    }, true);
  }
  return {
    errors,
    isValid: isValid
  };
};

module.exports = {
  publicFields: OrganizationPublicFields,
  fields: OrganizationFields,
  validator: OrganizationValidator
}
