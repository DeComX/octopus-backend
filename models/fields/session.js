const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Validator = require("validator");
const isEmpty = require("is-empty");

const SessionFields = {
  title: {
    type: String,
    required: true
  },
  highlight: {
    type: String
  },
  type: {
    type: String,
    enum: ['presentation', 'workshop', 'panel', 'hackathon', 'other'],
    required: true,
  },
  duration: {
    type: Number,
  },
  summary: {
    type: String,
    required: true
  },
  topics: {
    type: [String],
  },
  deck_link: {
    type: String,
  },
  materials: {
    type: String,
  },
  speakers: {
    type: [mongoose.mongo.ObjectId],
    required: true,
  },
  note: {
    type: String
  }
};

const SessionValidator = (data) => {
  let errors = {};
  ['title', 'summary', 'speakers'].map(
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
  publicFields: SessionFields,
  fields: SessionFields,
  validator: SessionValidator
}
