'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apiRoutes = express.Router();
const secret = require('../config/tokenSecret').secret;
const algo = require('../config/tokenSecret').algo;

module.exports = apiRoutes.use((req, res, next)=>{

   // Check headers or url parameters or post parameters for token
   const token = req.headers['x-access-token'] || req.query.token || req.body.token;
   // console.log("req.headers: ", req.headers);
   // console.log('token: ', token);
   // Decode token
   if(token){
      let cb = (err, decoded)=>{

         if(err) {
            console.log('token ERROR 1');
            console.log(err);
            return res.status(401).json({
               success: 'false', message: 'Fail to authenticate token !'
            });
         }
         req.decoded = decoded;
         next();
      };
      jwt.verify(token, secret, cb);

   }
   // Trow error
   else {
      console.log('token ERROR 2');
      return res.status(401).json({
         success: false,
         message: 'No token provided.'
      })
   }
})
