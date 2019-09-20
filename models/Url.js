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
  clicks: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = Url = mongoose.model("urls", UrlSchema);
