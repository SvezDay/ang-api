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
      let session = driver.session();
      session.run(
            "MATCH (a:Account{email:$email, password:$password})"
         +  " RETURN {id: id(a), properties: properties(a)} as data"
         ,{email: req.body.email, password: req.body.password}
         // "Match (a:Account)"
         // +" call apoc.index.nodes('Account', 'email') YIELD node as account return account"
      )
      .then((data)=>{
         if(data.records[0] && data.records[0]._fields){
            res.status(200).json(data.records[0]._fields);
         }else {
            res.status(201).json({message: 'not found'});
         }
      })
      .catch((error)=>{
         console.log(error);
         res.status(401).json({error: error});
      });


      // apoc.query('MATCH (a:Account{email:_email}) RETURN a',{"_email":req.body.email})
      //    // 'MATCH (a:Account) where exists(a.email) RETURN a'
      // // )
      // .exec()
      // .then((response)=>{
      //    console.log(response[0].data[0]);
      //    res.status(200).json({success: true, message: 'good', data: response});
      // }, (fail)=>{
      //    console.log('fail', fail);
      //    res.status(401).json({success: false, message: 'Email or Password is incorrect'});
      // })

      // // MATCH (m:Module)
      // // CALL apoc.path.spanningTree(m, {relationshipFilter:'FOLLOWED_BY', labelFilter:'>CATEGORY'}) YIELD path
      // // WITH m, last(nodes(path)) as node, length(path) as depth
      // // WITH m, depth, collect(node) as nodesAtDepth
      // // ORDER BY depth ASC
      // // RETURN collect(nodesAtDepth) as nodes
      //
      // apoc
      // .query(
      //    // 'MATCH (a:Account{email:`email`}) '
      //    // + 'RETURN {properties: properties(a), id:id(a)}'
      //       "MATCH (a:Account{email:$email})"
      //    +  " CALL apoc.when( count(a) > 0"
      //    +  " , 'RETURN {exists: 1, id:id(a), properties: properties(a)} as data'"
      //    +  " , 'RETURN {exists:0} as data'"
      //    // +  " ,'CREATE (a:Account{email:_email})"
      //    // +  " RETURN {id:id(a), properties: properties(a)} as user'"
      //    +  " ) YIELD value"
      //    +  " RETURN value.data as data"
      //    ,{email: req.body.email}
      // )
      // .exec()
      // .then((response)=>{
      //    let result = response[0].data[0];
      //    if(result.properties.password == req.body.password){
      //       result.properties.password = '';
      //       let token = jwt.sign({
      //          exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
      //          data: result
      //       },secret, { algorithm: algo });
      //       res.json({success: true, token});
      //    }else {
      //       res.json({success: false, message: 'Email or Password is incorrect.'});
      //    }
      // },
      // (fail)=>{
      //    res.status(200).json({error: fail});
      //
      // });
   }else{
      res.status(400).json({message: 'Email or Password is missing'});
   }

}
module.exports.register = (req, res, next)=>{
   // Check if first + last already exists
   // or email already exists
   // also create it

   apoc
   .query('MATCH (a:Account) RETURN properties(a)')
   .exec()
   .then(
      (response)=>{
         res.status(200).json({result: response[0].data});
      },
      (fail)=>{
         res.status(200).json({error: fail});

      }
   )
}
