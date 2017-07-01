'use-strict';
const path = require('path');
const neo4j = require('neo4j-driver').v1;
const passport = require("passport");
const mongoose = require('mongoose');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const Schema = mongoose.Schema;
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.login = (req, res, next)=>{ // accountId, content{title}
   var session = driver.session();
   session.run(
      "MATCH (account:Account{email:$email}) "
      + " RETURN {properties:properties(account), id:id(account)}"
      ,{email:$email}
   )
   .then((data)=>{
      return {
         properties: data.records[0]._fields[0].properties,
         id: data.records[0]._fields[0].id.low
      };
   })
   .then((user)=>{
      if(user.properties.password == req.body.password){
         res.status(200).json({result: user});
      }else {
         res.status(400).json({error: "error on email or password !"});
      }
   })
   .catch((error)=>{
      res.status(400).json({error: error});
   })
}
