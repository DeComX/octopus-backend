const express = require("express");
const router = express.Router();
const passport = require('../../middleware/passport')();

const User = require("../../models/User");
var { generateToken, sendToken } = require('../../utils/token_utils');

router.post('/local', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(400).json(err);
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(400).json(JSON.stringify(err));
      }
      next();
    });
  })(req, res, next);
}, generateToken, sendToken);

router.post('/google', function(req, res, next) {
  passport.authenticate('google-token', function(err, user, info) {
    if (err) {
      return res.status(400).json(err);
    }

    req.logIn(user, function(err) {
      if (err) {
        return res.status(400).json(JSON.stringify(err));
      }
      next();
    });
  })(req, res, next);
}, generateToken, sendToken);

module.exports = router;
