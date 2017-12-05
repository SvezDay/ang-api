'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const CheckData = require('../services/check-data.service');


module.exports.create_empty_note = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;

  let params = { uid, now };
  let query = `
     match (a:Acc) where id(a) = $uid
     create (n:Cont{commitList: [$now], type: 'note'})
     create (t:Prop:Title {value:'Undefined'})
     create (u:Prop:Undefined {value:''})
     create (a)-[:Linked]->(n)-[:Has{commit:$now}]->(t)-[:Has{commit:$now}]->(u)
     return {container_id: id(n), title_id:id(t), first_property_id: id(u)}
  `;

  tx.run(query, params)
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data =>{  utils.commit(tx, res, {uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};
