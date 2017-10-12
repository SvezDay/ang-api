'use-strict';

const _ = require('lodash');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require("passport-jwt");
const mongoose = require('mongoose');

const User = mongoose.model('User');
const db = require('../config/database');
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

var users = [
  {
    id: 1,
    name: 'jonathanmh',
    password: '%2yx4'
  },
  {
    id: 2,
    name: 'test',
    password: 'test'
  }
];
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = db.secret;

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, next) {
   console.log('payload received', jwt_payload);
   // usually this would be a database call:
   var user = users[_.findIndex(users, {id: jwt_payload.id})];
   if (user) {
     next(null, user);
   } else {
     next(null, false);
   }
}));

// exports.signin = function(req, res){
//    if (!req.body.username || !req.body.password){
//       res.json({success: false, msg: 'Please pass name and password.'});
//    }else {
//       let newUser = new User({
//          username: req.body.username,
//          password: req.body.password
//       });
//       newUser.save(function(err){
//          if (err){
//             return res.json({success: false, msg: 'Username already exists.'});
//          };
//          res.json({success: true, msg: 'Successful created new user.'});
//       })
//    }
// };

exports.login = function(req, res){
   if (!req.body.email || !req.body.password){
      let email = req.body.email;
      let password = req.body.password;

      var user = users[_.findIndex(users, {email})];
      if( ! user ){
         res.status(401).json({message:"no such user found"});
      }

      if(user.password === req.body.password) {
         // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
         var payload = {id: user.id};
         var token = jwt.sign(payload, jwtOptions.secretOrKey);
         res.json({message: "ok", token: token});
      } else {
         res.status(401).json({message:"passwords did not match"});
      }
   }
};
