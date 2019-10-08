const express = require("express");
const router = express.Router();
const { check, body, validationResult } = require('express-validator');

const ACL = require('../../acl/property_access');
const Channel = require('../../models/Channel');

router.get("/allchannels", (req, res) => {
  const userId = req.user.id;
  const propertyType = "channel";
  const role = AclConfig.StrictRoles.READ_DETAIL;
  ACL.checkAccess(userId, "", propertyType, role, (err, isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to read channel.'});
    }
    Channel.find({}, 'name type link')
      .then(channels => res.json(channels))
      .catch(
        err => res.status(400).json({
          ok: false,
          message: err
        }));
  });
});

router.post("/newchannel", [
    check('name').not().isEmpty(),
    check('type').not().isEmpty()
  ], (req, res) => {
  const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  const userId = req.user.id;
  const propertyType = "channel";
  const role = AclConfig.StrictRoles.ADMIN;
  ACL.checkAccess(userId, "", propertyType, role, (err, isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to create channel.'});
    }
    Channel
      .findOne({name: req.body.name, type: req.body.type})
      .then(channel => {
        if (channel) {
          res.status(400).json(
            {ok: false, message: "Channel already exists"});
        } else {
          new Channel({
            name: req.body.name,
            type: req.body.type,
            link: req.body.link,
            auth: req.body.auth,
            updated_at: new Date()
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
});

router.post("/updatechannel", [
    check('_id').not().isEmpty(),
    check('update').not().isEmpty()
  ], (req, res) => {
  const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  const userId = req.user.id;
  const propertyType = "channel";
  const role = AclConfig.StrictRoles.READ_WRITE;
  ACL.checkAccess(userId, "", propertyType, role, (err, isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to update channel.'});
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
});

router.post("/deletechannel", [
    check('_id').not().isEmpty()
  ], (req, res) => {
  const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  const userId = req.user.id;
  const propertyType = "channel";
  ACL.checkAccess(userId, "", propertyType, "owner", (err, isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to delete channel.'});
    }
    Channel
      .findByIdAndRemove(req.body._id)
      .then(data => {
        res.json({ok: true, data: data});
      }).catch((err) => {
        res.status(400).json({"errReason": err});
      });
  });
});

module.exports = router;
