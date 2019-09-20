const router = require("express").Router();

const resource = require('../resource');
const Campaign = require("../../models/Campaign");
const defaultProcessor = require('../processor');
const utils = require("../../utils/utils")

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
  return payload;
};

const postProcess = (data, res, paginated=false) => {
  if (paginated) {
    utils.fillCampaigns(data.docs).then(filled => {
      data.docs = filled;
      return res.json(data);
    });
  } else {
    const promise = Array.isArray(data)
      ? utils.fillCampaigns(data)
      : utils.fillCampaign(data);
    promise.then(filled => {
      return res.json(filled)
    });
  }
};

const processor = {
  ...defaultProcessor,
  preProcess: preProcess,
  postProcess: postProcess
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

router.post("/", upload, resource.postHandler(Campaign, processor));
router.get("/", resource.getHandler(Campaign, processor));
router.delete("/", resource.deleteHandler(Campaign));

module.exports = router;
