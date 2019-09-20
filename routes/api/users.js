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
        return res.status(400).json({errorReason: JSON.stringify(err)});
      }
      next();
    });
  })(req, res, next);
}, generateToken, sendToken);

router.route('/local')
  .post(passport.authenticate('local', {
      session: false, failureFlash: true
    }), function(req, res, next) {
      console.log(req);
      console.log(req.user);
      if (!req.user) {
        return res.status(401).json(req.flash.message);
      }
      next();
    }, generateToken, sendToken);

router.route('/google')
  .post(passport.authenticate('google-token', {session: false}), function(req, res, next) {
    console.log(req.user);
    if (!req.user) {
      return res.send(401, 'User Not Authenticated');
    }
    next();
  }, generateToken, sendToken);

module.exports = router;
