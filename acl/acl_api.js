const express = require('express');
const router = express.Router();
const { check, body, validationResult } = require('express-validator');
const AccessModule = require('./property_access');

router.post('/addOneUser', [
    check('userId').not().isEmpty(),
    check('propertyId').not().isEmpty(),
    check('propertyType').not().isEmpty(),
    check('role').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.addAccessOfOneUser(
	    req.user.id, req.body.userId, req.body.propertyId,
	    req.body.propertyType, req.body.role, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

router.post('/removeOneUser', [
    check('userId').not().isEmpty(),
    check('propertyId').not().isEmpty(),
    check('propertyType').not().isEmpty(),
    check('role').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.removeAccessOfOneUser(
	    req.user.id, req.body.userId, req.body.propertyId,
	    req.body.propertyType, req.body.role, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

router.post('/addOneGroup', [
    check('group').not().isEmpty(),
    check('propertyId').not().isEmpty(),
    check('propertyType').not().isEmpty(),
    check('role').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.addAccessOfOneGroup(
	    req.user.id, req.body.group, req.body.propertyId,
	    req.body.propertyType, req.body.role, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

router.post('/removeOneGroup', [
    check('group').not().isEmpty(),
    check('propertyId').not().isEmpty(),
    check('propertyType').not().isEmpty(),
    check('role').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.removeAccessOfOneGroup(
	    req.user.id, req.body.group, req.body.propertyId,
	    req.body.propertyType, req.body.role, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json({});
	});
});

// propertyArray: [{propertyId: String, propertyType: String}, ...]
// Returns: {access: [{
//                     propertyId: String,
//                     propertyType: String,
//                     roles: [String]
//                   }]}
router.post('/listRolesOnProperties', [
    check('propertyArray').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.listRolesOnProperties(
	    req.user.id, req.body.propertyArray, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

// propertyTypeArray: [type]
// Returns: {access: [{
//                     propertyId: String,
//                     propertyType: String,
//                     roles: [String]
//                   }]}
router.post('/listRolesOnPropertyTypes', [
    check('propertyTypeArray').not().isEmpty()
  ], function(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array() });
	}
	AccessModule.listRolesOnPropertyTypes(
	    req.user.id, req.body.propertyTypeArray, (err, value) => {
	  if (err !== null) {
	    return res.status(500).json({error: err});
	  }
	  return res.json(value);
	});
});

module.exports = router;
