const Schema = require("mongoose").Schema;
const Validator = require("validator");
const isEmpty = require("is-empty");

AddressDetailsSchema = new Schema({
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
},{ _id : false });

const AddressDetailsValidator = (address) => {
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

AddressSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  google_map_link: {
    type: String
  },
},{ _id : false });

const AddressValidator = (address) => {
  let errors = {};
  ['address'].map(
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

module.exports = {
  schema: AddressSchema,
  validator: AddressValidator
}
