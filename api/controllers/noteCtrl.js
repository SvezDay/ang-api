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

module.exports.create_note = (req, res, next)=>{
   console.log('the note Ctrl function is called');
   if(req.body.content && req.body.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.body;
      let query = `
         match (a:Account) where id(a) = ${user_id}
         create (n:Note:Container)
         create (u:Undefined:Property{value:'${_.content}'})
         create (a)-[:Linked]->(n)-[:Linked]->(u)
         return {note_id: id(n), content:u.value}
      `;
      driver.session()
      .run(query)
      .then((data)=>{
         if(data.records[0] && data.records[0]._fields[0]){
            let f = data.records[0]._fields[0];
            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               user_id:user_id
            },secret);
            res.status(200).json({
               token:token,
               note_id: f.note_id.low,
               content: f.content
            });
         }else {
            res.status(403).json({message: 'Creation failed'});
         }
      })
      .catch((error)=>{
         res.status(404).json({error: error, message:'error basic error'});
      });

   }else{
      res.status(401).json({message: 'Email or Password is missing'});
   }

}

module.exports.get_all_note = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let query = `
         match (a:Account)-[:Linked]->(n:Note:Container)-[:Linked]->(x)
         where id(a)= ${user_id}
         return {note_id: id(n), content:x.value} as list
      `;
      driver.session()
      .run(query)
      .then((data)=>{
         if(data.records[0]){
            let f = data.records;
            let list = [];
            for (var i = 0; i < f.length; i++) {
               list.push({
                  note_id:f[i]._fields[0].note_id.low,
                  content:f[i]._fields[0].content
               });
            }
            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               user_id:user_id
            },secret);
            res.status(200).json({
               token:token,
               list: list
            });
         }else {
            res.status(403).json({message: 'Creation failed'});
         }
      })
      .catch((error)=>{
         res.status(404).json({error: error, message:'error basic error'});
      });
   }else {
      res.status(401).json({message: 'Error token params'});
   }

}

module.exports.get_note_detail = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.params;
      let query = `
      match (a:Account)-[l1:Linked]->(n:Note:Container)-[:Linked*]->(x)
      where id(a)= ${user_id} and id(n) = ${_.id}
      with collect(x) as xs, a, l1, n, x
      return
      case
         when count(l1)=1 then xs
         else {data:{message: 'No access user'}}
         end
      `;
         //se call apoc.path.spanningTree(n, 'Linked>') yield path
      driver.session()
      .run(query)
      .then((data)=>{
         if(data.records && data.records[0]){
            let d = data.records;
            let detail = [];
            for (var i = 0; i < d.length; i++) {
               let check = true;
               let j = 0;
               while (check) {
                  if(d[i]._fields[0][0].labels[j] != 'Property'){
                     d[i]._fields[0][0].labels = d[i]._fields[0][0].labels[j];
                     check = false;
                  }else {
                     j++;
                  }
               }
               detail.push({
                  node_id:d[i]._fields[0][0].identity.low,
                  content:d[i]._fields[0][0].properties.value,
                  labels:d[i]._fields[0][0].labels
               });
            }

            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               user_id:user_id
            },secret);
            res.status(200).json({
               token:token,
               detail: detail
            });
         }else {
            res.status(403).json({message: 'No access user'});
         }
      })
      .catch((error)=>{
         res.status(404).json({error: error, message:'error basic error'});
      });
   }else {
      res.status(401).json({message: 'Error token params'});
   }

}
