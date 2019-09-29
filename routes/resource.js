const express = require("express");
const router = express.Router();
var mongoose = require('mongoose');
const ACL = require('../acl/property_access');
const AclConfig = require('../acl/acl_config');

const fieldsHelper = require('../models/fields/helper');

const doInsert = (model, processor, update, userId, res) => {
  if (!update._id) {
    delete update._id;
  }
  new model(update).save()
    .then((data) => {
      processor.postProcess(data, res)
      return ACL.createAclForNewProperty(userId, data._id, model.collection.collectionName);
    })
    .catch(err => {
      throw err;
    })
    .then(result => res.status(200).json({}))
    .catch((err) => res.status(400).json({"errReason": err}));
}

const doUpdate = (model, processor, update, res) => {
  model.findByIdAndUpdate(
      update._id,
      update,
      {new: true})
    .then((data) => processor.postProcess(data, res))
    .catch((err) => res.status(400).json({"errReason": err}));
}

const postHandler = (model, processor) => (req, res) => {
  // if it submits form data with files, the result
  // will be encoded in payload field of req.body
  const payload = req.body.payload ? JSON.parse(req.body.payload) : req.body;

  const userId = req.user.id;
  const propertyType = model.collection.collectionName;
  const propertyId = payload._id;
  const role = !payload._id ? AclConfig.CreateRole : "read_write";
  ACL.checkAccess(userId, propertyId, propertyType, role, (isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to update.'});
    }
    const validator = fieldsHelper.getValidator(model.collection.collectionName);
    const { errors, isValid } = validator(payload);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const fields = fieldsHelper.getFields(model.collection.collectionName);
    const update = {
      ...processor.preProcess(fields, payload, req.files),
      updated_at: new Date()
    };

    if (!payload._id) {
      if (processor.checkExistence) {
        model.findOne(processor.checkExistence(req)).then(record => {
          if (record) {
            const name = model.collection.collectionName;
            res.status(400).json({errorReason: name + " already exists"});
          } else {
            doInsert(model, processor, update, res);
          }
        })
      } else {
        doInsert(model, processor, update, userId, res);
      }
    }
    // to update
    else {
      update._id = payload._id;
      doUpdate(model, processor, update, res);
    }
  })
};

const defaultPaginationOptions = {
  page: 1,
  limit: 20,
  sort: {updated_at: -1},
}

// req.query = {
//   regexFilters: []  # for regex queryies, apply to {$and: []}
//   filters: []  # for non-regex queries, apply to {$and: []}
//   options: {} # for pagination options
// }
const paginationGet = (model, processor, req, res) => {
  let query = {$and: []};
  let options = JSON.parse(req.query.options || "{}");
  options = Object.assign(defaultPaginationOptions, options);

  query.$and = query.$and.concat(
    (req.query.regexFilters || []).map(regexFilter => {
      const parsed = JSON.parse(regexFilter);
      return {[parsed.key]: new RegExp(parsed.value, 'i')}
    })
  );
  const parsedFilters = (req.query.filters || []).map(filter => JSON.parse(filter));
  query.$and = query.$and.concat(parsedFilters);

  if (query.$and.length === 0) {
    query = {};
  }
  model
    .paginate(query, options)
    .then((result) => {
      processor.postProcess(result, res, paginated=true);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({"errReason": err});
    });
};

const defaultOptions = {
  limit: 10,
  sort: {updated_at: -1},
};

const noPaginationGet = (model, processor, req, res) => {
  let options = JSON.parse(req.query.options || "{}");
  options = Object.assign(defaultOptions, options);

  let query = {$and: []};
  query.$and = query.$and.concat(
    (req.query.regexFilters || []).map(regexFilter => {
      const parsed = JSON.parse(regexFilter);
      return {[parsed.key]: new RegExp(parsed.value, 'i')}
    })
  );
  query.$and = query.$and.concat(
    (req.query.filters || []).map(filter => JSON.parse(filter))
  );
  if (query.$and.length === 0) {
    query = {};
  }

  model
    .find(query)
    .sort(options.sort)
    .limit(options.limit)
    .then((data) => {
      processor.postProcess(data || [], res)
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({"errReason": err});
    });
};

const getHandler = (model, processor) => (req, res) => {
  if (req.query.enablePagination) {
    paginationGet(model, processor, req, res);
  } else {
    noPaginationGet(model, processor, req, res);
  }
}

// only support delete one by id
const deleteHandler = (model) => (req, res) => {
  const userId = req.user.id;
  const propertyType = model.collection.collectionName;
  const propertyId = req.query._id;
  ACL.checkAccess(userId, propertyId, propertyType, "read_write", (isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to update.'});
    }
    if (req.query._id) {
      model
        .findByIdAndRemove(mongoose.mongo.ObjectId(req.query._id),)
        .then(data => {
          res.json({ok: true, data: data});
        }).catch((err) => {
          res.status(400).json({"errReason": err});
        });
    } else {
      res.status(400).json({"errReason": "no id provided"});
    }
  });
};

module.exports = {
  getHandler: getHandler,
  postHandler: postHandler,
  deleteHandler: deleteHandler
}
