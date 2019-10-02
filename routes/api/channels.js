const express = require("express");
const router = express.Router();
const { check, body, validationResult } = require('express-validator');

const ACL = require('../../acl/property_access');
const Channel = require('../../models/Channel');

router.get("/allchannels", (req, res) => {
  Channel.find({}, 'name type link')
    .then(channels => res.json(channels))
    .catch(
      err => res.status(400).json({
        ok: false,
        message: err
      }));
});

router.post("/newchannel", [
    check('name').not().isEmpty(),
    check('type').not().isEmpty()
  ], (req, res) => {
  const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  Channel
    .find({name: req.body.name, type: req.body.type})
    .then(channel => {
      if (channel) {
        res.status(400).json(
          {ok: false, message: "Channel already exists"});
      } else {
        new Channel({
          name: req.body.name,
          type: req.body.type,
          link: req.body.link,
          auth: req.body.auth
        })
        .save()
        .then(saved => res.json({ok: true}))
        .catch(err => {
          res.status(400).json({ok: false, message: JSON.stringify(err)});
        })
      }
    })
    .catch(err => {
      res.status(400).json({ok: false, message: "Failed to query database"});
    });
});

router.post("/updatechannel", [
    check('_id').not().isEmpty(),
    check('update').not().isEmpty()
  ], (req, res) => {
  const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  Channel
    .findByIdAndUpdate(req.body._id, req.body.update)
    .then(channel => {
      if (!channel) {
        res.status(400).json({ok: false, message: "Channel not found"});
      } else {
        res.json({ok: true});
      }
    })
    .catch(err => {
      res.status(400).json(
        {ok: false, message: "Failed to update the channel"});
    });
});

module.exports = router;
