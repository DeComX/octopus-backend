const Schema = require("mongoose").Schema;
const Validator = require("validator");
const isEmpty = require("is-empty");

const ImageSchema = require('./image');

const UserPublicFields = {
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
  },
  organization: {
    type: String,
  },
  avatar: {
    type: ImageSchema
  }
}

const UserFields = {
  ...UserPublicFields,
  email: {
    type: String,
    required: true,
    unique : true
  },
  source: {
    type: [String],
  },
  roles: {
    type: [{
      type: String,
      enum: [
        'member',
        'presenter',
        'advisor',
        'honor_member',
        'operator',
        'volunteer'
      ]
    }],
    default: ["member"],
    required: true
  },
  subscription_status:{
    type: String,
    enum: ['subscribed', 'unsubscribed', 'opt_out', 'cleaned'],
    default: 'unsubscribed'
  },
  expectation: {
    type: [String]
  },
  interested_topics: {
    type: [String]
  },
  skills: {
     type: [String]
  },
  introduction: {
    type: String,
  },
  imgs: {
    type: [ImageSchema]
  },
  github: {
    type: String
  },
  linkedin: {
    type: String
  },
  password: {
    type: String,
  },
  location: {
    type: String
  },
  googleProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  },
  resume: {
    type: String
  },
  interested_in_volunteer: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String
  }
};

const UserValidator = (data) => {
  let errors = {};
  ['name', 'email'].map(
    field => {
      if (isEmpty(data[field])) {
        errors[field] = field + " field is required";
      }
    }
  );

  if (isEmpty(errors)) {
    if (!Validator.isEmail(data.email)) {
      errors.email = "Email is invalid";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = {
  publicFields: UserPublicFields,
  fields: UserFields,
  validator: UserValidator
}
