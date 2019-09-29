const TokenUtils = require('../utils/token_utils');

const getToken = (userId) => {
  const user = {
    id: userId,
    email: `${userId}@gmail.com`,
    name: userId,
    avatar: { name: `${userId}.png` }
  }
  return "Bearer " + TokenUtils.createToken(user);
}

module.exports = {
  getToken: getToken
}