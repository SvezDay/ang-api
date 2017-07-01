'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apiRoutes = express.Router();
const secret = require('../config/tokenSecret').secret;
const algo = require('../config/tokenSecret').algo;

module.exports = apiRoutes.use((req, res, next)=>{

   // Check headers or url parameters or post parameters for token
   const token = req.headers['x-access-token'] | req.query.token | req.body.token;

   // Decode token
   if(token){
      let cb = (err, decoded)=>{
         if(err) return res.json({
            success: 'false', message: 'Fail to authenticate token !'
         });
         req.decoded = decoded;
         next();
      };
      jwt.verify(token, secret, { algorithms: algo }, cb);


   }
   // Trow error
   else {
      return res.status(403).json({
         success: false,
         message: 'No token provided.'
      })
   }
})
