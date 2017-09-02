'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.get_all_course = (req, res, next)=>{
  res.status(200).json({message:"come from server"});
  //  console.log('the note Ctrl function is called');
  //  if(req.body.content && req.body.user_id){
  //     let user_id = req.decoded.user_id;
  //     let _ = req.body;
  //     let date = new Date().getTime();
  //     let query = `
  //        match (a:Account) where id(a) = ${user_id}
  //        create (n:Note:Container{commitList: [${date}] })
  //        create (u:Undefined:Property{value:'${_.content}'})
  //        create (a)-[:Linked]->(n)-[:Linked{commitNbr:${date}, orderNbr:1}]->(u)
  //        return {note_id: id(n), content:u.value}
  //     `;
  //     driver.session()
  //     .run(query)
  //     .then((data)=>{
  //        if(data.records[0] && data.records[0]._fields[0]){
  //           let f = data.records[0]._fields[0];
  //           let token = jwt.sign({
  //              exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
  //              user_id:user_id
  //           },secret);
  //           res.status(200).json({
  //              token:token,
  //              note_id: f.note_id.low,
  //              content: f.content
  //           });
  //        }else {
  //           res.status(403).json({message: 'Creation failed'});
  //        }
  //     })
  //     .catch((error)=>{
  //        res.status(404).json({error: error, message:'error basic error'});
  //     });
   //
  //  }else{
  //     res.status(401).json({message: 'Email or Password is missing'});
  //  }

};
module.exports.new_result = (req, res, next)=>{
  // console.log(req)
  res.status(200).json({message:'test of new_result is done', data: req.body});
};
