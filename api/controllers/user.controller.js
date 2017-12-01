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
  console.log('uid===================================', uid)
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let params = {uid}
  let query = `
    match (a:Account) where id(a)=$uid return a
  `;

  tx.run(query, params)
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
  .then( data => {
    utils.commit(tx, res, {uid, data});
  })
  .catch( e =>{
    let mess = 'profile user function ' +e.mess;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });


};

module.exports.update_properties = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid =  req.decoded.user_id;
  let ps = req.body;
  let params = {uid, key:ps.key, value:ps.value};
  let query = `
    match (a:Account) where id(a)= $uid
    set a.$key = $value
  `;

  tx.run(query, params)
  .then( data => {
    // console.log(data.records)
  })
  .then( () => {
    utils.commit(tx, res, {uid});
  })
  .catch( e =>{
    let mess = 'update properties function ' +e.mess;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });

}

module.exports.download_all = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id || 0;
  let now = new Date();
  let nodes = relations = nodeFields = relationFields = [];
  let nodesCsv;
  let params = {uid}
  let query = `
    match (a:Account) where id(a)=$uid
    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked|Has'})
    yield nodes, relationships return nodes, relationships
  `;
  // yield nodes, relationships return {nodes:nodes, relationships:relationships}

  tx.run(query, params)
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
          token:tokenGen(uid),
          exp: utils.expire(),
          data: csv
        })

      })
    })
  })
  .catch( err => {
    let mess = 'error on download_all ' +e.mess;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  })

}

module.exports.upload_data = (req, res, next)=>{
  // let session = driver.session();
  // let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.files;
  let now = new Date();

  let str = new Buffer(ps[0].buffer).toString();
  console.log(str)
  let params = {uid}
  let query = `
    match (a:Account) where id(a)=$uid

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
    token:tokenGen(uid),
    exp: utils.expire(),
    data: 'hello from backend'})

}
