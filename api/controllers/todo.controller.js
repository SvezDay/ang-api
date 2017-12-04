'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const CheckData = require('../services/check-data.service');
const access = require('../services/access-db.service');


module.exports.list = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;
  let list = {todo:[], today:[], succeed:[]}

  let params = { uid, now };
  let query = `
    match (a:Account)-->(:Todo)-[:Has]->(ts:Task) where id(a) = $uid
    with ts,
    filter(x in collect(ts) where x.status = 'close' ) as valid,
    filter(x in collect(ts) where
                         x.status = 'open' and x.date <> '' ) as today,
    filter(x in collect(ts) where
                         x.status = 'open' and x.date = '' ) as todo
    return {valid:collect(valid[0]), today:collect(today[0]), todo:collect(todo[0])}
  `;

  tx.run(query, params)
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data => {
    if(data.records && data.records[0]._fields[0]){
      return data.records[0]._fields[0];
    }else{
      throw {mess:"no data returned"};
    }
  })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.create_task = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;

  let params = { uid, value:ps.value };
  let query = `
     match (a:Account)-->(ts:Todo) where id(a) = $uid
     create (t:Task{status:"open", date:"", value:$value})
     create (ts)-[:Has]->(t)
     return t
  `;

  tx.run(query, params)
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data => {
    if(data.records && data.records[0]._fields){
      return data.records[0]._fields;
    }else{
      throw {mess:"no data returned"};
    }
  })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.delete_task = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.params;
  let params = { uid, tid:ps.id };

  let query = `match(t:Task) where id(t)=toInteger($tid) detach delete t`;
  CheckData.num(Number(ps.id, 'ps.id') )
  .then(()=>{ return access.user(uid, ps.id, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.update_task = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let params = { uid, tid:ps.identity, value:ps.properties.value };

  let query = `
    match(t:Task) where id(t)=toInteger($tid)
    set t.value = $value
  `;

  CheckData.num(Number(params.tid, 'params.tid') )
  .then(()=>{return CheckData.str(params.value, "params.value")})
  .then(()=>{ return access.user(uid, params.tid, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.task_for_today  = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let now = new Date().getTime().toString();
  let ps = req.body;
  let params = { uid, tid:ps.id, date:now};

  let query = `
    match (t:Task) where id(t)=toInteger($tid)
    set t.date = $date;
  `;

  CheckData.num(Number(params.tid, 'params.tid') )
  .then(()=>{ return access.user(uid, params.tid, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.task_for_later = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let params = { uid, tid:ps.id};

  let query = `
    match (t:Task) where id(t)=toInteger($tid)
    set t.date = ""
  `;

  CheckData.num(Number(params.tid, 'params.tid') )
  .then(()=>{ return access.user(uid, params.tid, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.close_task = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let now = new Date().getTime().toString();
  let ps = req.body;
  let params = { uid, tid:ps.id, now};

  let query = `
    match (t:Task) where id(t)=toInteger($tid)
    set t.date = $now
    set t.status = "close"
  `;

  CheckData.num(Number(params.tid, 'params.tid') )
  .then(()=>{ return access.user(uid, params.tid, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.reopen_task = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let now = new Date().getTime().toString();
  let ps = req.body;
  let params = { uid, tid:ps.id, now};

  let query = `
    match (t:Task) where id(t)=toInteger($tid)
    set t.date = $now
    set t.status = "open"
  `;

  CheckData.num(Number(params.tid, 'params.tid') )
  .then(()=>{ return access.user(uid, params.tid, tx) })
  .then(()=>{ return tx.run(query, params) })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
