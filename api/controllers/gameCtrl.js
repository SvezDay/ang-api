'use-strict';
// const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
let tokenGen = require('../services/token').generate;
let parser = require('../services/parser');
let schema = require('../models/schema');

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
  // .then( data => { return parser.dataMapper(data); })
  .then( data => {
    return data.records.map(x => {
      f = x._fields[0][Object.keys(x._fields[0])];
      if( f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity;
      };
      return f;
    });
  })
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


module.exports.course_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  query1 = `
  match (a:Account)-[l]->(m:Recall_Memory)
  where id(a)=181
  with m, extract(x in collect(m) |
  filter(y in labels(m) where y <> 'Recall_Memory')
) as pre_list
  return collect( distinct head(head(pre_list)) )as list
  `;

  session.readTransaction(tx=>tx.run(query1))
  .then( data => {
    let parse = data.records[0]._fields[0];
    return parse.map( x => {
      return Number(x.match(/([0-9]{1,})/g)[0]);
    });
  })
  .then( data => {
    console.log(data);
    query2 = `
    match (c:Course) where id(c) in [${data}]
    return {id: id(c), value: c.value, schema: c.schema, label: labels(c)}
    `;
    return session.readTransaction(tx => tx.run(query2));
  })
  .then( data => {
    return data.records.map( x => {
      let f = x._fields[0];
      if( f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity;
      }
      return f;
    });
  })
  .then( data =>{ res.status(200).json({data:data}); })
  .catch( error => {
    console.log(error);
    res.status(400).json({
      message: 'Error on the /game_course_recallable',
      error: error
    });
  });
};


module.exports.game_timer = (req, res, next)=>{
    let user_id = req.decoded.user_id;
    let session = driver.session();
    let today = new Date().getTime();
    let queryOne = '';
    let queryTwo = '';

    queryOne = `
       match (a:Account)-[:Linked]->(r:Recall_Memory)
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


module.exports.toggle_out_from_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body[0];
  let session = driver.session();

  let query = `
    match(a:Account)-[l]->(m:c${_.id})
    where id(a) = ${user_id}
    delete l, m
  `;
  let query2 = `
    match (a:Account)-[]->(b:Board_Activity)
    where id(a)=${user_id}
    set b.course_wait_recall = b.course_wait_recall + ${_.id}
  `;


  session.readTransaction(tx => tx.run(query))
  .then( ()=>{
    return session.readTransaction(tx=>tx.run(query2));
  })
  .then(()=>{ res.status(200).json({message:'Done !'})})
  .catch( error => {
    console.log(error);
    res.status(400).json({
      message: 'Error on the /game_toggle_out_from_recallable',
      error:error
    });
  });
};
module.exports.toggle_in_to_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let _ = req.body[0];
  let today = new Date().getTime();
  let recallList = [];
  let recallTarget = schema.labelRecallableTargetList();
  let query1 = query2 = query2First = query2Last = query3 = '';
  // For each property of the schema found, the second iteration allow to
  // select the property whose match for create the list of the recallable relations
  let mapper = (nodeList)=>{
    let endNode;
    nodeList.map( p => {
      recallTarget[`${p.label}`].map( l => {
        if(endNode = parser.includerReturnId(nodeList, 'label', l)){
          query2First += ` create (r${p.id}${endNode}:Recall_Memory:c${_.id}{
            level:1, nextDate: ${today}, startNode: ${p.id}, endNode: ${endNode}
          })`;
          query2Last += ` create (a)-[:Linked]->(r${p.id}${endNode})`;
        };
      });
    });
    query2 = query2First + query2Last;
  };


  query1 = `
  match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)
    where id(a)=${user_id} and id(c)=${_.id}
    with a, c,
    	extract( p in  collect(pp) |
      	{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}
      ) as newList
    return newList
  `;
  query2First = `match (a:Account) where id(a)=${user_id}`;
  query2Last = ``;
  query3 = `
  match (a:Account)-[]->(b:Board_Activity)
  where id(a)=${user_id}
  set b.course_wait_recall = filter(x in b.course_wait_recall where x <> ${_.id})
  `;


  session.readTransaction(tx=>tx.run(query1))
  .then( data => { return parser.dataMapper(data); })
  .then( data => {
    data.push({"label": "Course", "id": 270});
    mapper(data);
    return data;
  })
  .then(data => { return session.readTransaction(tx=>tx.run(query2)); })
  .then( () => {
    return session.readTransaction(tx=>tx.run(query3));
  })
  .then(()=>{ res.status(200).json({token:tokenGen(user_id), message:'Done !'})})
  .catch( error => {
    console.log(error);
      res.status(403).json({
        error:error,
        message: 'ERROR on game toggle_out_from_recallable'
    });
  });

};
