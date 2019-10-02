const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Validator = require("validator");
const isEmpty = require("is-empty");

const event = require('./event');
const channel = require('./channel');
const ImageSchema = require('./image');

const channelFields = {
  ...channel.publicFields,
  delivered: {
    type: Boolean,
    default: false
  },
  posters: {
    type: [ImageSchema]
  },
  article: {
    type: Schema.Types.Mixed
  }
};

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
    type: [new Schema(channelFields)]
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
