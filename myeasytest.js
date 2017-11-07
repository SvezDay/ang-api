'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');
const utils = require('./api/services/utils.service');

const crash = (response, transaction, status, message, error)=>{
  transaction.rollback();
  response.json({status: status, mess: message, error:error})
}

const commit = (response, transaction, status, data)=>{
  console.log('check commit')
  transaction.commit()
  .subscribe({
    onCompleted: () => {
      // this transaction is now committed
      response.status(status).json({data: data})
    },
    onError: (error) => {
      console.log('error', error);
      crash(response, transaction, 400, "Error on the commit", error);
    }
  });
}
module.exports = (req, res, next)=>{

  let tx = driver.session().beginTransaction();
  let user_id = 560;
  let ps = {container_id:309 , label:"Definition" ,value:"hello world", id:313};
  let now = new Date().getTime();
  let tomorrow = now + (1000 * 60 * 60 * 24* 180)

  // create (h:Testor{name: 'hello', date: '${now}'})
  // create (w:Testor{name: 'world', date: '${tomorrow}'})
  // return h, w
    tx.run(`
      match (t:Testor) return t
      `)
    .then( data => {
      // return loop();
      console.log(data.records[0]._fields)
      // return deleteCommit()
      return data.records
    })
    .then( data => {
      console.log('check after then')
      commit(res, tx, 200, data)
    })
    .catch( err => {
      console.log(err);
      crash(res, tx, err.status || 400, err.mess, err.err || err)
    });


};
