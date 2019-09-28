const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = function(req, res, next) {
  if (req.path.startsWith('/static') ||
      req.path.startsWith('/api/v1/user/auth') ||
      req.path.startsWith('/api/v1/publicurl')) {
    return next();
  }

  var token = req.headers['x-auth-token'] || req.headers["authorization"];
  if (!token) {
    return res.status(401).send({errReason: "Access denied. No token provided."});
  }

  try {
    const decoded = jwt.verify(token.substr(7), config.secretOrKey);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send({errReason: "Invalid token."});
  }
};
