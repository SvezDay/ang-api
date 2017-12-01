'use-strict';
const jwt = require('jsonwebtoken');
const conf= require('../../config/config').token_secret;

module.exports = (user_id)=>{
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
    user_id: user_id
  },conf.secret);
};
