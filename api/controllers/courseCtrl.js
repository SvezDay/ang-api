'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
const schemaQuery = require('../models/schema').getSchemaQuery;
const schemaObj = require('../models/schema');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.create_course = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let date = new Date().getTime();
  let session = driver.session();
  let query = query1 = query2 = '';
  schemaObj.getSchemaObj(_.schema)
  .then((schema)=>{
    console.log('check schema: ', schema);
    query1 = `match (a:Account) where id(a) = ${user_id}
    create (n:Container:Course{value:'${_.value}', schema:'${_.schema}'})`;

    query2 = `create (a)-[:Linked]->(n)`;
    for (let x of schema) {
      query1 += ` create (p${x}:Property:${x}{value:''})`;
      query2 += `-[:Linked]->(p${x})`
    }
    query = `${query1} ${query2}`;

    session
    .readTransaction(tx => tx.run(query, {}))
    .then((data)=>{
      res.status(200).json({message:'done'});
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
    }
    res.status(200).json({data:result});
  })
  .catch((error)=>{
    console.log(error);
    res.status(404).json({error:error});
  });
}
module.exports.get_schema_list = (req, res, next)=>{
  schemaObj.getAll()
  .then(list => {
      res.status(200).json({list:list});
  })
  .catch(()=>{
    res.status(400).json({message:'No list found'});
  });
};
