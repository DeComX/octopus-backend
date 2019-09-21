const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

var passport = require('passport');
var GoogleTokenStrategy = require('passport-google-token').Strategy;
var LocalStrategy = require('passport-local').Strategy;
const googleAuth = require("../config").googleAuth;
const User = require("../models/User");

const validateLoginInput = require("../validation/login");
module.exports = function() {
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, function(email, password, done) {
      const { errors, isValid } = validateLoginInput({
        email: email,
        password: password
      });
      if (!isValid) {
        done(errors, false);
      }

      User.findOne({ email }).then(user => {
        if (user) {
          if (!user.password) {
              done({password: "Password not set. Please contact admin to assign you one or use google login"}, false);
          }

          bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
              done(null, {
                id: user._id,
                email: user.email,
                name: user.name
              });
            } else {
              done({password: "Password not match"}, false);
            }
          });
        } else {
          done({email: "User not found"}, false);
        }
      });
    }
  ));
  passport.use(new GoogleTokenStrategy({
      clientID: googleAuth.clientID,
      clientSecret: googleAuth.clientSecret
    }, function (accessToken, refreshToken, profile, done) {
      User.upsertGoogleUser(accessToken, refreshToken, profile, function(err, user) {
        if (err) {
          done(err, false);
        } else {
          done(null, {
            id: user._id,
            email: user.email,
            name: user.name
          });
        }
      });
    }
  ));
  return passport;
};
