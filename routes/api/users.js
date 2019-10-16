const mongoose = require("mongoose");

const router = require("express").Router();
const resource = require('../resource');
const User = require("../../models/User");
const defaultProcessor = require('../processor');
const passport = require('../../middleware/passport')();
const { generateToken, sendToken } = require('../../utils/token_utils');

const preProcess = (fields, payload, files) => {
  payload.imgs = payload.imgs || [];
  (files.files || []).forEach(file => {
    payload.imgs.push({
      name: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    });
  });
  if (payload.avatar && Object.keys(payload.avatar).length === 0) {
    delete payload.avatar;
  }
  return payload;
};

const checkExistence = (req) => {
  return {email: req.body.email};
};

const processor = {
  ...defaultProcessor,
  preProcess: preProcess,
  checkExistence: checkExistence
};

var multer = require('multer');
const uuidv4 = require('uuid/v4');
const path = require('path');
var storage = multer.diskStorage({
  destination: './files',
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname))
  }
});
var upload = multer({ storage: storage }).fields([
  {name: "files", maxCount: 5}
]);

router.post("/", upload, resource.postHandler(User, processor));
router.get("/all", resource.getHandler(User, processor));
router.get("/id", resource.getOneByIdHandler(User, processor));
router.delete("/", resource.deleteHandler(User));

const isArray = (schema, field) => {
  return schema.path(field) instanceof mongoose.Schema.Types.Array;
}

router.get("/selector", (req, res) => {
  const prefix = (req.query.prefix || "").toLowerCase();
  const prefixReg = new RegExp("^" + prefix, 'i');
  const field = req.query.field;

  let aggregator = User.aggregate([{$project: {[field]: 1}}]);
  if (isArray(User.schema, field)) {
      aggregator = aggregator.unwind(field);
  }
  aggregator.match({[field]: prefixReg})
    .limit(15)
    .group({ _id: null, values: {"$addToSet": "$" + field }})
    .exec()
    .then(result => {
      res.json((result[0] || {}).values || []);
    })
    .catch(err => {
      res.status(400).json(err)
    });
});

router.post('/auth/local', function(req, res, next) {
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

router.post('/auth/google', function(req, res, next) {
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
