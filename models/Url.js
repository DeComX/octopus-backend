const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
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
});

module.exports = Url = mongoose.model("urls", UrlSchema);
