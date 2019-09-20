const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');

const collectionName = "members";
const MemberSchema = new Schema({
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

MemberSchema.plugin(mongoosePaginate);

module.exports = Member = mongoose.model(collectionName, MemberSchema);
