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
  let params = {uid};
  let recallCont = [];
      // globalList = [],
  let recallable = [];
  let unrecallable = [];


  // List of Recallable container
  tx.run(`
    match (a:Acc)-[:Linked]->(rs:Recall)
    where id(a) = $uid
    with collect(distinct rs.cid) as list
    return list
    `, params)
  .then( data => { return utils.parseResult(data)})
  .then( data => { return utils.parseInt2(data) })
  .then( data => { params.recallList = utils.sortLabel(data) })
  .then( () => {
    return tx.run(`
      match (a:Acc)-[:Linked]->(c:Cont)-[:Has{commit:last(c.commitList)}]->(t:Title)
      where id(a)=$uid
      return c, t
      `, params)
  })
  .then( data =>{ return utils.parseResult(data) })
  .then( data =>{ return utils.parseInt2(data) })
  .then( data =>{ return utils.sortLabel(data) })
  .then( data =>{
    data.map(x => {
      if( recallCont.indexOf(x[0].identity) ){
        recallable.push({
          cid: x[0].identity,
          type: x[0].properties.type,
          tid: x[1].identity,
          val: x[1].properties.value
        })
      }else{
        unrecallable.push({
          cid: x[0].identity,
          type: x[0].properties.type,
          tid: x[1].identity,
          val: x[1].properties.value
        })
      }
    })
    return {recallable, unrecallable};
  })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
}
