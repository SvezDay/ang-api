'use-strict';
let driver = require('./config/driver');
let tokenGen = require('./api/services/token.service');
let utils = require('./api/services/utils.service');
const CheckData = require('./api/services/check-data.service');

module.exports.authenticate = (req, res, next)=>{
  let ps = req.body;
  let session = driver.session();
  let tx = session.beginTransaction();

  let params = {
    email:ps.email,
    password:ps.password
  };
  let query = `
  MATCH (a:Account{email:$email, password:$password})
  RETURN {id: id(a), properties: properties(a)} as data
  `;
  console.log(params)
  CheckData.str(ps.email)
  .then( ()=>{
    return CheckData.str(ps.password) })
  .then( ()=>{ return tx.run(query, params) })
  .then( data => {
    console.log('data', data.records)
    // Check if response or not
    if(data.records.length && data.records[0]._fields.length){
      return data.records[0]._fields[0];
    }else{
      throw {status: 403, mess: "not found"}
    }
  })
  .then( data =>{
    let prop = data.properties;
    let uid = data.id.low;
    console.log('uid ===========================', uid)
    // utils.commit(tx, res, 200, uid, {first: prop.first})
    // session.close();
    utils.commit(tx, res, {uid, data:{first: prop.first}})
  })
  .catch( e =>{
    // utils.crash(tx, res, err.status || 400, "error", err.err || err)
    console.log('========================================', e)
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.register = (req, res, next)=>{
  let ps = req.body;
  let session = driver.session();
  let tx = session.beginTransaction();

  let params = {
    email:ps.email,
    password:ps.passpord,
    first:ps.first,
    last:ps.last,
    middle:ps.middle
  };
  let query = `
  MATCH (a:Account{email:$email})
  WITH COUNT(a) as numb
  CALL apoc.do.when(
    numb=1,
    "MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data",
    "CREATE (a:Account{
      email:$email,
      password:$password,
      first:$first,
      last:$last,
      middle:$middle,
      admin:'user',
      subscription_commit_length:''
    })
    CREATE (b:Board_Activity{course_wait_recall:[]})
    CREATE (t:Todo)
    CREATE (t)<-[:Linked]-(a)-[:Linked]->(b)
    RETURN {properties:properties(a), id:id(a)} as data"
  ) YIELD value
  RETURN value
  `;
  CheckData.str(ps.email)
  .then( () => { return CheckData.str(ps.password) })
  .then( () => { return CheckData.str(ps.first) })
  .then( () => { return CheckData.str(ps.last) })
  .then( () => { return CheckData.str(ps.middle) })
  .then( () => { return tx.run(query, params) })
  .then( data => {
    // Check if response or not
    if(data.records.length && data.records[0]._fields.length){
      return data.records[0]._fields[0];
    }else{
      throw {status: 403, err: "not create"}
    }
  })
  .then( data => {
    let prop = data.properties;
    let uid = data.id.low;
    utils.commit(tx, res, {uid, data:{first: prop.first}})
  })
  .catch( e =>{
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
}
