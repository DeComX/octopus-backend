const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Validator = require("validator");
const isEmpty = require("is-empty");

const event = require('./event');
const ChannelSchema = require('./channel');
const ImageSchema = require('./image');

const CompaignFields = {
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
    required: true
  },
  description: {
    type: String,
    required: true
  },
  event: {
    type: mongoose.mongo.ObjectId,
    required: true
  },
  channels: {
    type: [ChannelSchema]
  },
  note: {
    type: String,
  },
  imgs: {
    type: [ImageSchema]
  }
};

const CampaignValidator = (data) => {
  let errors = {};
  ['name', 'start_at', 'end_at', 'description', 'event'].map(
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
  fields: CompaignFields,
  validator: CampaignValidator
}
