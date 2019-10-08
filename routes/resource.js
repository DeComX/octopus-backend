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
      return Promise.all([
        ACL.createAclForNewProperty(userId, data._id, model.collection.collectionName),
        processor.postProcess(data)
      ]);
    })
    .catch(err => {throw err;})
    .then(result => res.json(result[1]))
    .catch(err => {
      res.status(400).json({"errReason": err})
    });
}

const doUpdate = (model, processor, update, res) => {
  model.findByIdAndUpdate(
      update._id,
      update,
      {new: true})
    .then((data) => processor.postProcess(data))
    .catch(err => {throw err;})
    .then(processed => res.json(processed))
    .catch((err) => res.status(400).json({"errReason": err}));
}

const postHandler = (model, processor) => (req, res) => {
  // if it submits form data with files, the result
  // will be encoded in payload field of req.body
  const payload = req.body.payload ? JSON.parse(req.body.payload) : req.body;

  const userId = req.user.id;
  const propertyType = model.collection.collectionName;
  const propertyId = payload._id;
  const role = !payload._id ? AclConfig.StrictRoles.ADMIN : AclConfig.StrictRoles.READ_WRITE;
  ACL.checkAccess(userId, propertyId, propertyType, role, (err, isAccessible) => {
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

const constructQuery = (req_query) => {
  let query = {$and: []};
  query.$and = query.$and.concat(
    (req_query.regexFilters || []).map(regexFilter => {
      const parsed = JSON.parse(regexFilter);
      return {[parsed.key]: new RegExp(parsed.value, 'i')}
    })
  );
  const parsedFilters = (req_query.filters || []).map(filter => JSON.parse(filter));
  query.$and = query.$and.concat(parsedFilters);
  if (query.$and.length === 0) {
    query = {};
  }
  return query;
}

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
  let options = JSON.parse(req.query.options || "{}");
  options = Object.assign(defaultPaginationOptions, options);
  if (req.query.select) {
    options.select = req.query.select;
  }

  model
    .paginate(constructQuery(req.query), options)
    .then((result) => {
      processor.postProcess(result, paginated=true).then(
        processed => {
          res.json(processed)
        }
      );
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({"errReason": err});
    })
};

const defaultOptions = {
  limit: 10,
  sort: {updated_at: -1},
};

const noPaginationGet = (model, processor, req, res, select) => {
  let options = JSON.parse(req.query.options || "{}");
  options = Object.assign(defaultOptions, options);
  let query = model
    .find(constructQuery(req.query))
    .sort(options.sort)
    .limit(options.limit);
  if (req.query.select) {
    query = query.select(req.query.select);
  }
  query
    .then((data) => {
      return processor.postProcess(data || [])
    })
    .catch(err => {throw err;})
    .then(processed => res.json(processed))
    .catch((err) => {
      res.status(400).json({"errReason": err});
    });
};

const getHandler = (model, processor) => (req, res) => {
  const userId = req.user.id;
  let propertyId = "";
  const query = constructQuery(req.query);
  if (query["$and"] && query["$and"].length > 0) {
    for (filter of query["$and"]) {
      if ("_id" in filter) {
        propertyId = filter["_id"] || "";
        break;
      }
    }
  }
  const propertyType = model.collection.collectionName;
  const role = AclConfig.StrictRoles.READ_DETAIL;
  ACL.checkAccess(userId, propertyId, propertyType, role, (err, isAccessible) => {
    if (!isAccessible) {
      return res.status(401).json({err: 'No permission to update.'});
    }

    if (req.query.enablePagination) {
      paginationGet(model, processor, req, res);
    } else {
      noPaginationGet(model, processor, req, res);
    }
  });
};

// No access control on getMetatdataHandler, since metadata are open to
// everyone.
const getMetadataHandler = (model, processor) => (req, res) => {
  const publicFields =
    fieldsHelper.getPublicFields(model.collection.collectionName);
  req.query.select = Object.keys(publicFields).join(' ');
  getHandler(model, processor)(req, res);
};

// only support delete one by id
const deleteHandler = (model) => (req, res) => {
  const userId = req.user.id;
  const propertyType = model.collection.collectionName;
  const propertyId = req.query._id;
  ACL.checkAccess(userId, propertyId, propertyType, "owner", (isAccessible) => {
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
  getMetadataHandler: getMetadataHandler,
  postHandler: postHandler,
  deleteHandler: deleteHandler
}
