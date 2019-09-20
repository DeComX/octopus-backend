const router = require("express").Router();
const resource = require('../resource');
const Member = require("../../models/Member");
const defaultProcessor = require('../processor');

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

var multer  = require('multer');
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

router.post("/", upload, resource.postHandler(Member, processor));
router.get("/", resource.getHandler(Member, processor));
router.delete("/", resource.deleteHandler(Member));

router.get("/titles", (req, res) => {
  const prefix = (req.query.prefix || "").toLowerCase();
  Member.distinct('title')
    .then(titles => {
      res.json(titles.filter(title => title.toLowerCase().startsWith(prefix)));
    })
    .catch(err => res.status(400).json(err));
});

router.get("/organizations", (req, res) => {
  const prefix = (req.query.prefix || "").toLowerCase();
  Member.distinct('organization')
    .then(orgs => {
      res.json(orgs.filter(org => org.toLowerCase().startsWith(prefix)));
    })
    .catch(err => res.status(400).json(err));
});

module.exports = router;
