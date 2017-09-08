'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
var neo4j = require('neo4j-driver').v1;

const secret = require('./config/tokenSecret').secret;
const algo = require('./config/tokenSecret').algo;
// const driverLib = require('./middleware/driver_lib');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));


module.exports.authenticate = (req, res, next)=>{
   if(req.body.email && req.body.password){
      let _ = req.body;
      let query = `
         MATCH (a:Account{email:'${_.email}', password:'${_.password}'})
         RETURN {id: id(a), properties: properties(a)} as data
      `;
      // "Match (a:Account)"
      // +" call apoc.index.nodes('Account', 'email') YIELD node as account return account"
      driver.session()
      .run(query)
      .then((data)=>{
         if(data.records[0] && data.records[0]._fields[0]){

            let f = data.records[0]._fields[0];
            let name =  f.properties.first ||
                        f.properties.fb_username ||
                        f.properties.gapi_username ||
                        f.properties.li_username;
            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               user_id:f.id.low
            },secret);

            res.status(200).json({
               token:token,
               id: f.id.low,
               name: name
            });
         }else {
            res.status(201).json({message: 'not found'});
         }
      })
      .catch((error)=>{
         res.status(401).json({error: error, message:'error basic error'});
      });

   }else{
      res.status(400).json({message: 'Email or Password is missing'});
   }

}
module.exports.register = (req, res, next)=>{
   // Check the data in body
   if(!req.body.first || !req.body.last || !req.body.email || !req.body.password) {
      return res.status(401).json({message: "Parameters missing"});
   }
   let _ = req.body;
   let session = driver.session();
   let query = `
      MATCH (a:Account{email:'${_.email}'})
      WITH COUNT(a) as numb
      CALL apoc.do.when(
         numb=1,
         "MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data",
         "CREATE (n:Account{
            email:'${_.email}',
            password:'${_.password}',
            first:'${_.first}',
            last:'${_.last}',
            middle:'${_.middle}'
         })
         CREATE (b:Board_Activity{course_wait_recall:[]})
         CREATE (n)-[:Linked]->(b)
         RETURN {properties:properties(n)} as data"
      ) YIELD value
      RETURN value
      `;
   session
   .readTransaction( tx => tx.run(query, {}))
   .then( data => {
      if(data.records[0] && data.records[0]._fields[0]){
         res.status(200).json(data.records[0]._fields[0]);
      }else {
         res.status(401).json({message: 'not found'});
      };
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
