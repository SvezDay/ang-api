'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const CheckData = require('../services/check-data.service');


module.exports.list = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;
  let list = {todo:[], today:[], succeed:[]}

  let params = { uid, now };
  let query = `
     match (a:Account)-->(:Todo)-[:Has]->(ts:Task) where id(a) = $uid
     with ts, filter(x in collect(ts) where x.status = 'close' ) as succeed
     with ts, succeed, filter(x in collect(ts) where
                          x.status = 'open' and x.date <> '' ) as today
     with ts, succeed, today, filter(x in collect(ts) where
                          x.status = 'open' and x.date = '' ) as todo
     return ts
  `;

  tx.run(query, params)
  .then( data => { return utils.parseInt(data) })
  .then( data => {

  })
  .then( data =>{  utils.commit({tx, res, uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

// module.exports.create_task
// module.exports.delete_task
// module.exports.update_task
//
// module.exports.task_for_today // todo to today
// module.exports.task_for_later // today to todo
//
// module.exports.close_task
// module.exports.reopen_task
