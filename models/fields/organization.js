const Schema = require("mongoose").Schema;
const Validator = require("validator");
const isEmpty = require("is-empty");

const ImageSchema = require('./image');

AddressSchema = new Schema({
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  zipcode: {
    type: String,
  },
  map_url: {
    type: String
  },
  website: {
    type: String
  }
},{ _id : false });

const AddressValidator = (address) => {
  let errors = {};
  ['address', 'city', 'state', 'country', 'zipcode'].map(
    field => {
      if (isEmpty(address[field])) {
        errors[field] = field + " field is required";
      }
    }
  );
  return {
    errors,
    isValid: isEmpty(errors)
  };
}

const OrganizationFields = {
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
  team_info: {
    type: String
  },
  type: {
    type: String,
    enum: ['venue', 'project', 'community', 'other'],
    requried: true
  },
  focused_area: {
    type: [String]
  },
  address: {
    type: AddressSchema,
    required: true
  },
  logo: {
    type: ImageSchema,
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
  console.log(data);
  if (data.type === 'venue') {
    errors.address = AddressValidator(data.address || {});
    isValid = isValid && errors.address.isValid;
  }
  return {
    errors,
    isValid: isValid
  };
};

module.exports = {
  fields: OrganizationFields,
  validator: OrganizationValidator
}
