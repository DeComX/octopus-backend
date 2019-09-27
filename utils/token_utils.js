const config = require("../config");
var jwt = require('jsonwebtoken');

var createToken = function(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: {name: user.avatar.name}
  }, config.secretOrKey,
  {
    expiresIn: 60 * 120
  });
};

module.exports = {
  createToken: createToken,
  generateToken: function(req, res, next) {
    req.token = "Bearer " + createToken(req.user);
    return next();
  },
  sendToken: function(req, res) {
    return res.status(200).send({token: req.token});
  }
};
