'use-strict';

const passport = require('passport');
const passportJWT = require("passport-jwt");
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const User = require('../models/user');
const db = require('./database'); // exports secret and db path

const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');


module.exports = function(passport){
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
}
