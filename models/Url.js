const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const collectionName = 'url';
const UrlSchema = new Schema({
  short: {
    type: String,
    required: true,
    unique : true
  },
  long: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  clicks: {
    type: [Date]
  }
}, { collection: collectionName });

module.exports = Url = mongoose.model(collectionName, UrlSchema);
