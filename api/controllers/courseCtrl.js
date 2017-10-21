'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
const schemas = require('../models/schema');

const labels_model = require('../models/labels.model');
const labelService = require('../services/label.service');
const utility = require('../services/utility.service');

let parser = require('../services/parser');
let tokenGen = require('../services/token.service');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));


module.exports.create_course = (req, res, next)=>{
  let session = driver.session();
  let user_id = req.decoded.user_id;
  let today = new Date().getTime();
  let _ = req.body;
  let q_1 = q1_1 = q1_2 = q_2 = '';
  let course = {};

//First part create the node
  q_1_1 = `
    match (a:Account) where id(a) = ${user_id}
    create (c:Container:Course{value:'${_.value}', model:'${_.model_title}'})
  `;
//Second part create the relationships
  q_1_2 = `create (a)-[:Linked]->(c)`;

  if(_.model_title != "Undefined"){
    let model_list = labels_model.primary_model_list[_.model_title];
    for (let x of model_list) {
      q_1_1 += ` create (p${x}:Property:${x}{value:''})`;
      q_1_2 += `-[:Linked]->(p${x})`
    };
  };

  q_1 = `${q_1_1} ${q_1_2} return {id:id(c), value:c.value}`;
  q_2 = `
    match (a:Account)-[]->(b:Board_Activity) where id(a)= $user_id
    set b.course_wait_recall = b.course_wait_recall + $course_id
    return b
  `;

  session.readTransaction(tx => tx.run(q_1))
  .then( data => {
    return data.records.map( x => {
      let f = x._fields[0];
      if(f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity
      };
      return f
    });
  })
  .then( data => {
    course.id = data[0].id;
    course.value = data[0].value
    return session.readTransaction(tx => tx.run(q_2, {user_id:user_id, course_id:course.id}))
  })
  .then( (data) => {
    console.log(data)
    res.status(200).json({
      token:tokenGen(user_id),
      id: course.id,
      value: course.value
    });
  })
  .catch( error =>{
    console.log(error);
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
    res.status(200).json({token:tokenGen(user_id), data:result});
  })
  .catch((error)=>{
    console.log(error);
    res.status(404).json({error:error});
  });
};


module.exports.get_model_list = (req, res, next)=>{
  let user_id = req.decoded.user_id;

  res.status(200).json({
    token:tokenGen(user_id),
    list:labels_model.primary_model_list
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
    res.status(200).json({token:tokenGen(user_id), properties: sorted, course:course});

  })
  .catch(error => {
    console.log('ERROR on GET_COURSE_DETAIL', error);
    res.status(400).json({message:'No detail found'});
  });
};


module.exports.update_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let today = new Date().getTime();
  let session = driver.session();
  console.log(`test of ${_.id}`)
  let query1 = `
    match (a:Account)-[l:Linked*]->(c${_.label})
    where id(a) = ${user_id} and id(c) = ${_.id}
    set c.value = '${_.value}'
  `;
  let query2 = `
    match (a:Account)-[:Linked]->(r:Recall_Memory:c${_.id})
    set r.level = 1, r.nextDate = ${today}
  `;

  session
  .readTransaction(tx => tx.run(query1))
  .then(() => { return session.readTransaction(tx => tx.run(query2) ) })
  .then(()=>{
    res.status(200).json({
      token:tokenGen(user_id), message: 'done'
    });
  })
  .catch(error => {
    console.log(error);
    res.status(400).json({error: error, message: 'Error update course'});
  })
};


module.exports.update_course_value = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let session = driver.session();
  let query1 = `
  match (a:Account)-[l:Linked*]->(c:Container:Course)
  where id(a) = ${user_id} and id(c) = ${_.id}
  set c.value = ${_.value}
  `;
  session
  .readTransaction(tx => tx.run(query1))
  .then(() => {
    res.status(200).json({token:tokenGen(user_id), message:'done'});
  })
  .catch(error => {
    console.log(error);
    res.status(400).json({error:error, message:'Error on the update of the course #${_.id}'});
  })
};


module.exports.delete_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let course_id = req.params.id;
  let session = driver.session();
  let query1 = `
    match (b:Board_Activity)<-[]-(a:Account)-[l:Linked*]->(c:Container:Course)-[ll:Linked*]->(p:Property)
    where id(a)=${user_id} and id(c)=${course_id}
    with last(l) as relation, c, ll, p, b, b.course_wait_recall as list
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
    res.status(200).json({token:tokenGen(user_id), message:'done'});
  })
  .catch( error =>{
    console.log(error);
    res.status(400).json({error:error, message: `Error to delete course #${course_id}`});
  });
};
