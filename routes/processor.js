const preProcess = (fields, payload, files) => {
  let result = {};
  Object.keys(fields).map(field => result[field] = payload[field]);
  return result;
};

const postProcess = (data) => {
  return Promise.resolve(data);
};

module.exports = {
  preProcess: preProcess,
  postProcess: postProcess
};
