const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');
const mongoosePaginate = require('mongoose-paginate-v2');

const collectionName = "organization";
const OrganizationSchema = new Schema({
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

OrganizationSchema.plugin(mongoosePaginate);

module.exports = Organization = mongoose.model(collectionName, OrganizationSchema);
