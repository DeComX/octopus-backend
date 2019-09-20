const router = require("express").Router();
const Organization = require("../../models/Organization");
const defaultProcessor = require('../processor');
const resource = require('../resource');

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
  if (payload.logo && Object.keys(payload.logo).length === 0) {
    delete payload.logo;
  }
  return payload;
};

const processor = {
  ...defaultProcessor,
  preProcess: preProcess,
}

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

router.post("/", upload, resource.postHandler(Organization, processor));
router.get("/", resource.getHandler(Organization, processor));
router.delete("/", resource.deleteHandler(Organization));

module.exports = router;
