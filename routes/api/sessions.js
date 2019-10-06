const router = require("express").Router();
const mongoose = require("mongoose");

const Session = require("../../models/Session");
const resource = require('../resource');
const defaultProcessor = require('../processor');
const utils = require("../../utils/utils")

const postProcess = (data, paginated=false) => {
  if (paginated) {
    return utils.fillSessions(data.docs).then(filled => {
      data.docs = filled;
      return Promise.resolve(data);
    });
  } else {
    return Array.isArray(data)
      ? utils.fillSessions(data)
      : utils.fillSession(data);
  }
};

const processor = {
  ...defaultProcessor,
  postProcess: postProcess
}

router.post("/", resource.postHandler(Session, processor));
router.get("/", resource.getHandler(Session, processor));
router.delete("/", resource.deleteHandler(Session));

module.exports = router;
