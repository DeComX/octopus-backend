const express = require('express');
const router = express.Router();
const { check, body, validationResult } = require('express-validator');
const GroupModule = require('./group');

router.post('/init', function(req, res) {
	GroupModule.init(req.user.id, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

router.post('/create', [
    check('group').not().isEmpty(),
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	GroupModule.createGroup(
	    req.user.id, req.body.group, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

// Return: {name: String, ownerIds: [String], userIds: [String]}
router.post('/get', [
    check('group').not().isEmpty(),
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	GroupModule.getGroup(
	    req.user.id, req.body.group, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

router.post('/addUser', [
    check('group').not().isEmpty(),
    check('userId').not().isEmpty(),
    check('isAddOwner').not().isEmpty(),
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	GroupModule.addToGroup(
	    req.user.id, req.body.group, req.body.userId, req.body.isAddOwner, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

router.post('/removeUser', [
    check('group').not().isEmpty(),
    check('userId').not().isEmpty(),
    check('isRemoveOwner').not().isEmpty(),
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	GroupModule.removeFromGroup(
	    req.user.id, req.body.group, req.body.userId, req.body.isRemoveOwner, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

// Return {own: [groups], access: [groups]}
router.post('/listGroups', function(req, res) {
	GroupModule.listMyGroups(req.user.id, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

module.exports = router;