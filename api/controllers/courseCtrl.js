'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
const schemaQuery = require('../models/schema').getSchemaQuery;
const schemaObj = require('../models/schema');
let parser = require('../services/parser');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));


module.exports.create_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let today = new Date().getTime();
  let session = driver.session();
  let q_1 = q1_1 = q1_2 = q_2 = '';
  let course = {};


  schemaObj.getSchemaObj(_.schema)
  .then( schema =>{
//First part create the node
    q_1_1 = `
      match (a:Account) where id(a) = ${user_id}
      create (c:Container:Course{value:'${_.value}', schema:'${_.schema}'})
    `;
//Second part create the relationships
    q_1_2 = `create (a)-[:Linked]->(c)`;
    for (let x of schema) {
      q_1_1 += ` create (p${x}:Property:${x}{value:''})`;
      q_1_2 += `-[:Linked]->(p${x})`
    };
    q_1 = `${q_1_1} ${q_1_2} return {id:id(c), value:c.value}`;
    q_2 = `
      match (a:Account)-[]->(b:Board_Activity) where id(a)= $user_id
      set b.course_wait_recall = b.course_wait_recall + $course_id
    `;
    return;
  }).then(()=>{
    return session.readTransaction(tx => tx.run(q_1, {}))
  }).then( data => {
    return parser.dataMapper(data);
  }).then( data => {
    course.id = data.id.low;
    course.value = data.value
    return session.readTransaction(tx => tx.run(q_2, {user_id:user_id, course_id:course.id}))
  }).then( () => {
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({
      token:token,
      id: course.id,
      value: course.value
    });
  }).catch(()=>{
    res.status(404).json({message:"ERROR on /api/create_course"});
  });
};


module.exports.get_all_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let query = `
    match (a:Account)-[:Linked]->(c:Container:Course)
    where id(a) = ${user_id}
    return
      case
        when count(c) >= 1 then {id: id(c), value: c.value}
        else {}
      end
  `;
  session
  .readTransaction(tx => tx.run(query, {}))
  .then((data)=>{
    let result = [];
    for (let x of data.records) {
      result.push({id:x._fields[0].id.low, value:x._fields[0].value});
    };
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({token:token, data:result});
  })
  .catch((error)=>{
    console.log(error);
    res.status(404).json({error:error});
  });
}
module.exports.get_schema_list = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  schemaObj.getAll()
  .then(list => {
console.log('===================================================');
console.log(list);
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
      res.status(200).json({token:token, list:list});
  })
  .catch(()=>{
    res.status(400).json({message:'No list found'});
  });
};
module.exports.get_course_detail = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let course_id = req.params.id;
  let session = driver.session();
  let query = `
    match (a:Account)-[l:Linked*]->(c:Container:Course)-[ll:Linked*]->(p:Property)
    where id(a) = ${user_id} and id(c) = ${course_id}
    return
      case
        when count(l) >= 1 then {properties: collect(p), course:c}
        else {}
      end
  `;
  console.log(query);
  session
  .readTransaction(tx => tx.run(query, {}))
  .then( data => {
    let sorted = data.records[0]._fields[0].properties.map(x => {
      let index = x.labels.indexOf('Property');
      x.labels.splice(index, 1);

      return {
        id: x.identity.low,
        value: x.properties.value,
        property: x.labels
      };
    });
    let course = {
      id: data.records[0]._fields[0].course.identity.low,
      value: data.records[0]._fields[0].course.properties.value,
      schema: data.records[0]._fields[0].course.properties.schema,
      labels: data.records[0]._fields[0].course.labels
    };
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({token:token, properties: sorted, course:course});

  })
  .catch(error => {
    console.log('ERROR on GET_COURSE_DETAIL', error);
    res.status(400).json({message:'No detail found'});
  });
};
module.exports.update_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let session = driver.session();
  let query = `
    match (a:Account)-[l:Linked*]->(c${_.label})
    where id(a) = ${user_id} and id(c) = ${_.id}
    set c.value = $value
  `;
  console.log('===============================================');
  console.log(_);
  console.log(query);
  session
  .readTransaction(tx => tx.run(query, {value:_.value}))
  .then(()=>{
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({token:token, message: 'done'});
  })
  .catch(error => {
    console.log(error);
    res.status(400).json({error: error, message: 'Error update course'});
  })
};
module.exports.delete_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let course_id = req.params.id;
  let session = driver.session();
  let query1 = `
    match (b:Board_Activity)<-[]-(a:Account)-[l:Linked*]->(c:Container:Course)-[ll:Linked*]->(p:Property)
    where id(a)=${user_id} and id(c)=${course_id}
    with last(l) as relation, c, ll, p, b.course_wait_recall as list
    forEach(l in ll | delete l, p)
    with b, relation, c, [x in list where x <> ${course_id} | x ] as new_list
    set b.course_wait_recall = new_list
    delete relation, c
  `;
  let query2 = `
    match (a:Account)-[ll:Linked]->(r:Recall_Memory:c${course_id})
    with ll, r, count(r) as nb
    call apoc.do.when(
          nb >= 1,
          "  match (a:Account)-[ll:Linked]->(r:Recall_Memory:c${course_id}) delete ll, r return {message: 'removed', nb: nb}",
          " return {message: 'Not exists', nb: nb}",
        {nb: nb}) yield value
        return value
  `;
  session
  .readTransaction(tx => tx.run(query1, {}))
  .then(()=>{
    return session.readTransaction(tx => tx.run(query2, {}))
  })
  .then(()=>{
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({token:token, message:'done'});
  })
  .catch( error =>{
    console.log(error);
    res.status(400).json({error:error, message: `Error to delete course #${course_id}`});
  });
};
module.exports.update_course_value = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let session = driver.session();
  let query = `
  match (a:Account)-[l:Linked*]->(c:Container:Course)
  where id(a) = ${user_id} and id(c) = ${_.id}
  set c.value = $value
  return c
  `;
    console.log(query);
  session
  .readTransaction(tx => tx.run(query, {value:_.value}))
  .then((result)=>{
    console.log(result.records[0]._fields[0]);
    let token = jwt.sign({
      exp: Math.floor(Date.now() / 1000 ) + (60 * 60),
      user_id:user_id
    }, secret);
    res.status(200).json({token:token, message:'done'});
  })
  .catch(error => {
    console.log(error);
    res.status(400).json({error:error, message:'Error on the update of the course #${_.id}'});
  })

};
