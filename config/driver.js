'use-strict';
const neo4j = require('neo4j-driver').v1;
const conf = require('./config').driver;
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || conf.bolt;
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || conf.username;
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || conf.password;

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports = driver;
