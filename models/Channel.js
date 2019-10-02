const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');

const collectionName = "channel";
const ChannelSchema = new Schema({
  ...fieldsHelper.getFields(collectionName),
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
  },
}, {collection: collectionName});

module.exports = Channel = mongoose.model(collectionName, ChannelSchema);
