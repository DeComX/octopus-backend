const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;
const fieldsHelper = require('./fields/helper');

const collectionName = "user";
const UserSchema = new Schema({
  ...fieldsHelper.getFields(collectionName),
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
  },
}, { collection: collectionName });

UserSchema.plugin(mongoosePaginate);

UserSchema.statics.upsertGoogleUser = function(accessToken, refreshToken, profile, cb) {
  var that = this;
  return this.findOne({
    'email': profile.emails[0].value
  }, function(err, user) {
    if (!user) {
      if (profile._json.hd !== 'abcer.world') {
        return cb("Invalid domain name, only abcer.world is allowed", null);
      }
      console.log(profile);
      var newUser = new that({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleProvider: {
          id: profile.id,
          token: accessToken
        },
        updated_at: new Date()
      });
      console.log(newUser);
      newUser.save(function(error, savedUser) {
        return cb(error, savedUser);
      });
    } else {
      user.googleProvider = {
        id: profile.id,
        token: accessToken
      };
      user.updated_at = new Date();
      user.markModified("googleProvider");
      user.markModified("updated_at");
      user.save(function(error, savedUser) {
        return cb(error, savedUser);
      });
    }
  });
};

module.exports = User = mongoose.model(collectionName, UserSchema);
