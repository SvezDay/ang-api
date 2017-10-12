'use-strict';
const neo4j = require('neo4j-driver').v1;
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports = driver;
