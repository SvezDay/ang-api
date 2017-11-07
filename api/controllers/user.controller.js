'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const dbService = require('../services/db.service');

const crash = (transaction, response,  status, message, error)=>{
  console.log(message)
  transaction.rollback();
  response.status(status).json({mess: message, error})
}

const commit = (transaction, response, status, user, data)=>{
  transaction.commit()
  .subscribe({
    onCompleted: () => {
      response.status(status).json({
        token:tokenGen(user),
        exp: utils.expire(),
        data: data
      })
    },
    onError: (error) => {
      console.log('error', error);
      crash(transaction, response, 400, "Error on the commit", error);
    }
  });
}

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
    commit(tx, res, 200, user_id, data);
  })
  .catch(err => {
    crash(tx, res, 400, "crash on the user_profile function", err)
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
    commit(tx, res, 200, user_id);
  })
  .catch(err => {
    crash(tx, res, 400, "error on the user update properties", err);
  })

}
