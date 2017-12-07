'use-strict';
const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');
const utils = require('./api/services/utils.service');
const CheckData = require('./api/services/check-data.service');

module.exports.test = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let ps = req.body;
  let uid = 71;
  let now = new Date().getTime().toString();
  let params = {uid, now};


  // List of Recallable container
  tx.run(`
    match (a:Acc)-[]->(c:Recall)
    where id(a)=$uid and (toInteger(c.next) < toInteger($now) or c.next = "")
    with c limit 1
    match (q) where id(q)=c.qid
    match (r) where id(r)=c.rid
    return {question:q, response:r}
    `, params)
  .then( data => { return utils.parseResult(data)})
  .then( data => { return utils.parseInt2(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
}
