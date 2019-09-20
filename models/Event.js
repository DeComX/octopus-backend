const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');
const mongoosePaginate = require('mongoose-paginate-v2');

const collectionName = "events";
const EventSchema = new Schema({
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

EventSchema.plugin(mongoosePaginate);

EventSchema.statics.isObjectIdField = (field) => {
  return ["venue"].includes(field);
}

module.exports = Event = mongoose.model(collectionName, EventSchema);
