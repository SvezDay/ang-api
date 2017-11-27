'use-strict';
const json2csv = require('json2csv');
const fs = require('fs');


const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const dbService = require('../services/db.service');
const recoverField = require('../services/recoverField.service')


module.exports.user_profile = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let user_id = req.decoded.user_id;

  let q = `
    match (a:Account) where id(a)=${user_id} return a
  `;

  tx.run(q)
  .then( data => {
    let u = data.records[0]._fields[0];
    delete u.properties.password;
    delete u.properties.identity;
    delete u.identity;
    delete u.labels;
    u.properties.subscription_commit_length =
      u.properties.subscription_commit_length.low;
    return u
  })
  .then(data=>{
    utils.commit(tx, res, 200, user_id, data);
  })
  .catch(err => {
    utils.crash(tx, res, 400, "crash on the user_profile function", err)
  })


};

module.exports.update_properties = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let user_id =  req.decoded.user_id;
  let ps = req.body;
  console.log('CONTROL PARAMS ps', ps)

  let q = `
    match (a:Account) where id(a)= ${user_id}
    set a.${ps.key} = ${ps.value}
  `;

  tx.run(q)
  .then( data => {
    console.log(data.records)
  })
  .then( ()=>{
    utils.commit(tx, res, 200, user_id);
  })
  .catch(err => {
    utils.crash(tx, res, 400, "error on the user update properties", err);
  })

}

module.exports.download_all = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let user_id = req.decoded.user_id || 0;
  let now = new Date();
  let nodes = relations = nodeFields = relationFields = [];
  let nodesCsv;

  let q = `
    match (a:Account) where id(a)=${user_id}
    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked|Has'})
    yield nodes, relationships return nodes, relationships
  `;
  // yield nodes, relationships return {nodes:nodes, relationships:relationships}

  tx.run(q)
  .then( data => { return data.records[0]._fields })
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data)})
  // .then( data => {
  //   recoverField(data[0]).then(nf => {
  //     json2csv({data:data[0], fields:nf}, function (err, csvn){
  //       if(err){console.log(err); throw{status: 403, mess: 'no user access', err:err}}
  //
  //       // recoverField(data[1]).then(rf => {
  //       //   json2csv({data:data[1], fields:rf}, function (err, csvr){
  //       //     if(err){console.log(err); throw{status: 403, mess: 'no user access', err:err}}
  //
  //           res.status(200).json({
  //             token:tokenGen(user_id),
  //             exp: utils.expire(),
  //             // data: {nodes:csvn, relationships:csvr}
  //             data: csvn
  //           })
  //
  //       //   })
  //       // })
  //
  //     })
  //   })
  // })
  .then( data => {
    recoverField(data[0]).then(nf => {
      json2csv({data:data[0], fields:nf}, function (err, csv){
        if(err){console.log(err); throw{status: 403, mess: 'no user access', err:err}}
        fs.writeFile('test.csv', csv, (err)=>{console.log(err)})
        res.status(200).json({
          token:tokenGen(user_id),
          exp: utils.expire(),
          data: csv
        })

      })
    })
  })
  .catch( err => {
    console.log(err);
    utils.crash(tx, res, err.status || 400, err.mess || 'error on download_all',err.err || err);
  })

}

module.exports.upload_data = (req, res, next)=>{
  // let session = driver.session();
  // let tx = session.beginTransaction();
  let user_id = req.decoded.user_id;
  let _ = req.files;
  let now = new Date();

  let str = new Buffer(_[0].buffer).toString();
  console.log(str)

  let q = `
    match (a:Account) where id(a)=${user_id}

    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked|Has'})
    yield nodes, relationships return nodes, relationships
  `;

  // tx.run(q)
  // .then( data => {
  //   utils.commit(tx, res, 204, user_id);
  // })
  // .catch( err => {
  //   console.log(err);
  //   utils.crash(tx, res, err.status || 400, err.mess || 'error on download_all',err.err || err);
  // })
  res.status(204).json({
    token:tokenGen(user_id),
    exp: utils.expire(),
    data: 'hello from backend'})

}
