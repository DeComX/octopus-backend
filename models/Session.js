const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');
const mongoosePaginate = require('mongoose-paginate-v2');

const collectionName = "sessions";
const SessionSchema = new Schema({
  ...fieldsHelper.getFields(collectionName),
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
  },
});

SessionSchema.plugin(mongoosePaginate);

SessionSchema.statics.isArrayField = (field) => {
  return ["speakers", "topics"].includes(field);
}

SessionSchema.statics.isObjectIdField = (field) => {
  return ["speakers"].includes(field);
}

module.exports = Session = mongoose.model(collectionName, SessionSchema);
