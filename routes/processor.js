const preProcess = (fields, payload, files) => {
  let result = {};
  Object.keys(fields).map(field => result[field] = payload[field]);
  return result;
};

const postProcess = (data, res) => {
  return res.json(data);
};

module.exports = {
  preProcess: preProcess,
  postProcess: postProcess
};
