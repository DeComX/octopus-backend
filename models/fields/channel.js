const Schema = require("mongoose").Schema;
const ImageSchema = require('./image');

ChannelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['wechat', 'meetup', 'eventbrite', 'forum', 'email']
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
