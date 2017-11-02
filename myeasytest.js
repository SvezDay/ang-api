'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');
const utils = require('./api/services/utils.service');

module.exports = (req, res, next)=>{

  let session = driver.session();
  let user_id = 560;
  let ps = {container_id:309 , label:"Definition" ,value:"hello world", id:313};
  let now = Math.round(new Date().getTime() / 999999999);

  let store = [];
  let query2_1 = "";
  let query2_2 = "create (a:Account)";

    let tx = session.beginTransaction();

    let commit = ()=>{
      tx.commit()
      .subscribe({
        onCompleted: function () {
          // this transaction is now committed
          res.json({mess: 'ok'})
        },
        onError: function (error) {
          console.log('error', error);
          tx.rollback()
          res.json({status: 200, mess: 'err on commit', err:error})
        }
      });

    }
    let crash = ()=>{
      tx.rollback();
    }

    let match = (datas)=>{
      tx.run(query2_1 + query2_2)
      .subscribe({
        onNext: function () {
          // console.log('record._fields[0].identity', record._fields);
        },
        onCompleted: function () {
          // this transaction is now committed
          crash()
          // res.json({mess: 'ok'})
        },
        onError: function (error) {
          console.log('error', error);
          // tx.rollback()
          // res.json({status: 200, mess: 'err on commit', err:error})
        }
      });
    }
    let create = ()=>{
      tx.run(`
        create (t:Testing{name:${now}})
        create (u:Testing{name:${now}}) return u, t
        `)
      .subscribe({
        onNext: function (record) {
          record._fields.map(x => {
            let i = x.identity.low
            query2_1 += ` match (t${i}:Testing) where id(t${i}) = ${i} `;
            query2_2 += `-[:TestHas]->(t${i})`;
          })
          console.log('query2', query2_1 + query2_2)
        },
        onCompleted: function () {
          // console.log('store', store)
          match(store)
          // session.close();
          // res.json({data: 'h'})
        },
        onError: function (error) {
          console.log('error', error);
          // tx.rollback()
          // res.json({data: error})
        }
      });
    }

    create();



};
