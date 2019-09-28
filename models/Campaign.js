const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');
const mongoosePaginate = require('mongoose-paginate-v2');

const collectionName = "campaign";
const CampaignSchema = new Schema({
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

CampaignSchema.plugin(mongoosePaginate);

module.exports = Event = mongoose.model(collectionName, CampaignSchema);
