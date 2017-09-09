'use-strict';
const jwt = require('jsonwebtoken');
const secret = require('../../config/tokenSecret').secret;

module.exports.generate = (user_id)=>{
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
    user_id: user_id
  },secret);
};
