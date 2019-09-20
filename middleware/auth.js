const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

module.exports = function(req, res, next) {
  if (req.path.startsWith('/static') ||
      req.path == '/api/v1/auth/local' ||
      req.path == '/api/v1/auth/google' ||
      req.path.startsWith('/api/v1/publicurl')) {
    return next();
  }

  var token = req.headers['x-auth-token'] || req.headers["authorization"];
  if (!token) {
    return res.status(401).send({errReason: "Access denied. No token provided."});
  }

  try {
    const decoded = jwt.verify(token.substr(7), keys.secretOrKey);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send({errReason: "Invalid token."});
  }
};
