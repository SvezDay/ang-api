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
  let query1 = queryFirstPart = querySecondPart = query2 = '';
  let courseRecorded;

  schemaObj.getSchemaObj(_.schema)
  .then((schema)=>{
    console.log('check schema: ', schema);
    //First part create the node
    queryFirstPart = `
      match (a:Account) where id(a) = ${user_id}
      create (n:Container:Course{value:'${_.value}', schema:'${_.schema}'})
    `;
    //Second part create the relationships
    querySecondPart = `create (a)-[:Linked]->(n)`;
    for (let x of schema) {
      query1 += ` create (p${x}:Property:${x}{value:''})`;
      query2 += `-[:Linked]->(p${x})`
    }
    query1 = `${queryFirstPart} ${querySecondPart} return {id:id(n), value:n.value}`;
    // The second query create the RecallMemory node with the id of the nodes's course
    query2 = `
      match (a:Account)
      where id(a) = ${user_id}
      create (r:RecallMemory:r${course.id.low}{startNode: , endNode: ,level:1, nextDate:${today}}
      create (a)-[:Linked]->(r)
    `;

    session.readTransaction(tx => tx.run(query1, {}))
    .then( data => {
      // return parser.dataMapper(data);
      courseRecorded = parser.dataMapper(data);;
      return courseRecorded;
    })
    .then( data => {
      return session.readTransaction( tx => tx.run(query2, {}));
    })
    .then( data => {
      let token = jwt.sign({
         exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
         user_id:user_id
      },secret);
      res.status(200).json({
        token:token,
        id: courseRecorded.id.low,
        value: courseRecorded.value
      });
    })
    .catch((error)=>{
      res.status(404).json({error: error, message:'error basic error'});
    });
  })
  .catch(()=>{
    res.status(404).json({message:"No schema found"});
  })

}
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
  let query = `
    match (a:Account)-[l:Linked*]->(c:Container:Course)-[ll:Linked*]->(p:Property)
    where id(a)=${user_id} and id(c)=${course_id}
    with last(l) as relation, c, ll, p
    forEach(l in ll | delete l, p)
    delete relation, c
  `;
  console.log(query);
  session
  .readTransaction(tx => tx.run(query, {}))
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
