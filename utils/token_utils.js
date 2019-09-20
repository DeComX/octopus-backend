var keys = require('../config/keys');
var jwt = require('jsonwebtoken');

var createToken = function(user) {
  return jwt.sign({
    id: user.id,
    emai: user.email
  }, keys.secretOrKey,
  {
    expiresIn: 60 * 120
  });
};

module.exports = {
  generateToken: function(req, res, next) {
    req.token = "Bearer " + createToken(req.user);
    return next();
  },
  sendToken: function(req, res) {
    return res.status(200).send({user: req.user, token: req.token});
  }
};
