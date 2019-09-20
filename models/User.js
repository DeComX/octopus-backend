const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unqiue: true,
    required: true
  },
  password: {
    type: String,
  },
  googleProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
  }
});

UserSchema.statics.upsertGoogleUser = function(accessToken, refreshToken, profile, cb) {
  var that = this;
  return this.findOne({
    'email': profile.emails[0].value
  }, function(err, user) {
    if (!user) {
      var newUser = new that({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleProvider: {
          id: profile.id,
          token: accessToken
        },
        updated_at: new Date(),
      });
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
        return cb(error, user);
      });
    }
  });
};

module.exports = User = mongoose.model("users", UserSchema);
