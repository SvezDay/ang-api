'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const CheckData = require('../services/check-data.service');


module.exports.get_all_recallable = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;

  let params = { uid, now };

  tx.run(`
    match (a:Acc)-[]->(c:Recall)
    where id(a)=$uid and (toInteger(c.next) < toInteger($now) or c.next = "")
    with c limit 1
    match (q) where id(q)=c.qid
    match (r) where id(r)=c.rid
    return {question:q, response:r}
    `, params)
  .then( data => { return utils.parseResult(data) })
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
module.exports.recording_result = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let params = { uid, now, qid:ps.qid, rid:ps.rid, res:ps.result};

  params.result ? params.res = 1 : params.res = -2

  //Check Data
  CheckData.num(toInteger(params.qid))
  .then(()=>{ return CheckData.num(toInteger(params.rid))})
  .then(() =>{
    return tx.run(`
      match (a:Acc)-[]->(c:Recall{qid:toInteger($qid), rid:toInteger($rid)})
      where id(a)=$uid
      with 2 ^ ((ln(c.step)/ln(2)) + $res) as newStep
      set c.step = newStep
      set c.next = toString($now + (newStep * 86400000))
      `, params)
  })
  .then( () =>{  utils.commit(tx, res, {uid}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
