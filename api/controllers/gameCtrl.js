'use-strict';
// const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
let tokenGen = require('../services/token').generate;
let parser = require('../services/parser');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.course_wait_recall = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let query = `
    match (a:Account)-[]->(b:Board_Activity)
    where id(a) = ${user_id}
    with b, b.course_wait_recall as list, count(b.course_wait_recall) as nb
    call apoc.do.when(
      nb >= 1,
      "match (c:Container) where id(c) in list
       return {id:id(c), value:c.value, schema: c.schema, label:labels(c)}",
      "return {message: 'No course wait for !'}",
    {list:list, nb:nb}) yield value
    return value
  `;
  session
  .readTransaction(tx => tx.run(query, {}))
  .then( data => { return parser.dataMapper(data); })
  .then( data => {
    res.status(200).json({
      token: tokenGen(user_id),
      data: data
    });
  })
  .catch( error => {
    console.log(error);
    res.status(400).json({message: 'Error on the /api/course_wait_recall'})
  });
};

module.exports.game_timer = (req, res, next)=>{
    let user_id = req.decoded.user_id;
    let session = driver.session();
    let today = new Date().getTime();
    let queryOne = '';
    let queryTwo = '';

    queryOne = `
       match (a:Account)-[:Linked]->(r:RecallMemory)
       where id(a) = ${user_id} and r.nextDate <= ${today}
       return
          case
            when count(r) >= 1
              then {startNode: r.startNode, endNode: r.endNode, level:r.level}
            else {message:'No recall available !'}
          end
    `;
    queryTwo = `
      match (start) where id(n) = ${data.startNode}
      match (end) where id(n) = ${data.endNode}
      return
        case
          when count(start) <> 0 && count(end) <> 0
            then {
              start_id: id(start), start_label: labels(start), start_value: start.value,
              end_id: id(end), end_label: labels(end), end_value: end.value
            }
          else
            {message: "Error for the recall of "+${data.startNode}+" or "+${data.endNode}}
        end
    `;
    session.readTransaction(tx => tx.run(queryOne, {}))
    .then( data => { return parser.dataMapper(data); })
    .then( data => {
      if(data.message){
        res.status(400).json({message:data.message});
      }else {
        return data;
      };
    })
    .then( data => {
      return session.readTransaction(tx => tx.run(queryTwo, {}))
    })
    .then( data => { return parser.dataMapper(data); })
    .then( data => {
        if (data.message){
          res.status(400).json({message: data.message});
        }else {
          // let token = jwt.sign({
          //   exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
          //   user_id:user_id
          // },secret);
          res.status(200).json({
            token: tokenGen(user_id),
            start_id: f.start_id, start_label: f.start_label, start_value: f.start_value,
            end_id: f.end_id, end_label: f.end_label, end_value: f.end_value
          });
        }
    })
    .catch((error)=>{
       res.status(404).json({error: error, message:'error basic error'});
    });

};
module.exports.get_all_course = (req, res, next)=>{
  res.status(200).json({message:"come from server"});
};
module.exports.new_result = (req, res, next)=>{
  // console.log(req)
  res.status(200).json({message:'test of new_result is done', data: req.body});
};
