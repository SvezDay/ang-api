'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');

const secret = require('./config/tokenSecret').secret;
const algo = require('./config/tokenSecret').algo;

module.exports.authenticate = (req, res, next)=>{
   if(req.body.email && req.body.password){

      // MATCH (m:Module)
      // CALL apoc.path.spanningTree(m, {relationshipFilter:'FOLLOWED_BY', labelFilter:'>CATEGORY'}) YIELD path
      // WITH m, last(nodes(path)) as node, length(path) as depth
      // WITH m, depth, collect(node) as nodesAtDepth
      // ORDER BY depth ASC
      // RETURN collect(nodesAtDepth) as nodes

      apoc
      .query(
         // 'MATCH (a:Account{email:`email`}) '
         // + 'RETURN {properties: properties(a), id:id(a)}'
            "MATCH (a:Account{email:$email})"
         +  " CALL apoc.when( count(a) > 0"
         +  " , 'RETURN {exists: 1, id:id(a), properties: properties(a)} as data'"
         +  " , 'RETURN {exists:0} as data'"
         // +  " ,'CREATE (a:Account{email:_email})"
         // +  " RETURN {id:id(a), properties: properties(a)} as user'"
         +  " ) YIELD value"
         +  " RETURN value.data as data"
         ,{email: req.body.email}
      )
      .exec()
      .then((response)=>{
         let result = response[0].data[0];
         if(result.properties.password == req.body.password){
            result.properties.password = '';
            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               data: result
            },secret, { algorithm: algo });
            res.json({success: true, token});
         }else {
            res.json({success: false, message: 'Email or Password is incorrect.'});
         }
      },
      (fail)=>{
         res.status(200).json({error: fail});

      });

   }else{
      res.json({success: false, message: 'Email or Password is incorrect.'});
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
