const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Validator = require("validator");
const isEmpty = require("is-empty");

const organization = require('./organization');
const session = require('./session');
const ImageSchema = require('./image');

const EventFields = {
  name: {
    type: String,
    required: true
  },
  start_at: {
    type: Date,
    required: true
  },
  end_at: {
    type: Date,
    required: true,
  },
  venue: {
    type: new Schema(organization.publicFields),
    required: true,
  },
  description: {
    type: String,
  },
  sessions: {
    type: [new Schema(session.fields)],
    required: true,
  },
  posters: {
    type: [ImageSchema],
  },
  topics: {
    type: [String],
  },
  highlight: {
    type: String,
  },
  partners: {
    type: [new Schema(organization.publicFields)],
  },
  note: {
    type: String,
  },
};

const EventValidator = (data) => {
  let errors = {};
  ['name', 'start_at', 'end_at', 'venue', 'sessions'].map(
    (field) => {
      if (isEmpty(data[field])) {
        errors[field] = field + " field is required";
      }
    }
  );

  let isValid = isEmpty(errors);
  errors['sessionsNested'] = {};
  (data['sessions'] || []).map((presentation) => {
    const perrors = session.validator(presentation);
    isValid = isValid && perrors.isValid;
    errors['sessionsNested'][presentation._id] = perrors;
  });

  return {
    errors,
    isValid: isValid
  };
};

module.exports = {
  publicFields: EventFields,
  fields: EventFields,
  validator: EventValidator
}
