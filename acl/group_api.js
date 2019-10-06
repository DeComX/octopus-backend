const express = require('express');
const router = express.Router();
const { check, body, validationResult } = require('express-validator');
const GroupModule = require('./group');

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

router.post('/updateGroup', [
    check('group').not().isEmpty(),
    check('ownerIds').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
  const update = {
    ownerIds: req.body.ownerIds,
    userIds: req.body.userIds
  };
	GroupModule.updateGroup(
	    req.user.id, req.body.group, update, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json(err.message);
	  }
	  return res.json({});
	});
});

// Return {own: [groups], access: [groups]}
router.get('/listGroupNames', function(req, res) {
	GroupModule.listMyGroups(req.user.id, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

// Return {own: [groups], access: [groups], users: [users_in_group]}
router.get('/listGroupDetails', function(req, res) {
	GroupModule.listMyGroupDetails(req.user.id, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

module.exports = router;
