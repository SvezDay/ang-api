'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;

let tokenGen = require('../services/token.service');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.user_profile = (req, res, next)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = req.decoded.user_id;
  let _ = req.body;

  res.status(200).json({
    token: tokenGen(user_id),
    data: {}
  });

};
