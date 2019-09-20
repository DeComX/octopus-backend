const router = require("express").Router();
const mongoose = require("mongoose");

const Session = require("../../models/Session");
const resource = require('../resource');
const defaultProcessor = require('../processor');
const utils = require("../../utils/utils")

const postProcess = (data, res, paginated=false) => {
  if (paginated) {
    utils.fillSessions(data.docs).then(filled => {
      data.docs = filled;
      return res.json(data);
    });
  } else {
    const promise = Array.isArray(data)
      ? utils.fillSessions(data)
      : utils.fillSession(data);
    promise.then(filled => {
      return res.json(filled)
    });
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
