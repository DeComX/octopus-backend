const Schema = require("mongoose").Schema;
const ImageSchema = require('./image');

ChannelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  article: {
    type: String,
  },
  posters: {
    type: [ImageSchema],
  },
  delivered: {
    type: Boolean,
  }
},{ _id : false });

module.exports = ChannelSchema;
