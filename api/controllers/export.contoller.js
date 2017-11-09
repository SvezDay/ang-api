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
      // this transaction is now committed
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

module.exports.export_archi_container = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let tx = session.beginTransaction();

  // let q = `
  //   match path=(a:Account)-[l*]->(c:Container)
  //   where id(a)=${user_id}
  //   return path
  // `;

  let q = `
    match (a:Account) where id(a)=${user_id}
    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked'})
    yield nodes, relationships
    return nodes, relationships
  `;
  tx.run(q)
  .then( data => {
    console.log('data.records.length' , data.records.length)
  })
  .then( data => {
    commit(res, tx, 200)
  })
  .catch( err => crash(res, tx, 400, mess:"Error on the export_container", err:err))

}
