'use-strict';
let driver = require('./config/driver');
let tokenGen = require('./api/services/token.service');
let utils = require('./api/services/utils.service');

// module.exports.authenticate = (req, res, next)=>{
//    if(!req.body.email || !req.body.password){
//      return res.status(400).json({message: 'Email or Password is missing'});
//    }
//     let _ = req.body;
//     let session = driver.session();
//     let query = `
//        MATCH (a:Account{email:'${_.email}', password:'${_.password}'})
//        RETURN {id: id(a), properties: properties(a)} as data
//     `;
//
//     session.readTransaction(tx =>tx.run(query))
//     .then((data)=>{
//        if(data.records[0] && data.records[0]._fields[0]){
//
//           let f = data.records[0]._fields[0];
//           let prop = f.properties;
//           let uid = f.id.low;
//           // let exp = new Date().getTime() + (1000 * 60 * 30);
//           let now = new Date().getTime();
//
//           res.status(200).json({
//              token:tokenGen(uid),
//              exp: utils.expire(),
//              first: prop.first
//           });
//        }else {
//           res.status(201).json({message: 'not found'});
//        }
//     })
//     .catch((error)=>{
//        res.status(401).json({error: error, message:'error basic error'});
//     });
// };
module.exports.authenticate = (req, res, next)=>{
   if(!req.body.email || !req.body.password){
     return res.status(400).json({message: 'Email or Password is missing'});
   }
    let _ = req.body;
    let session = driver.session();
    let tx = session.beginTransaction();
    let query = `
       MATCH (a:Account{email:$email, password:$password})
       RETURN {id: id(a), properties: properties(a)} as data
    `;
    let params = {
      email:_.email,
      password:_.password
    }
    tx.run(query, params)
    .then((data)=>{
       if(data.records[0] && data.records[0]._fields[0]){

          let f = data.records[0]._fields[0];
          let prop = f.properties;
          let uid = f.id.low;

          utils.commit(tx, res, 200, uid, {first: prop.first})
          // res.status(200).json({
          //    token:tokenGen(uid),
          //    exp: utils.expire(),
          //    first: prop.first
          // });
       }else {
          // res.status(201).json({message: 'not found'});
          utils.crash(tx, res, 400, "not found")
       }
    })
    .catch((error)=>{
      utils.crash(tx, res, 400, "error", error)
       // res.status(401).json({error: error, message:'error basic error'});
    });
};
module.exports.register = (req, res, next)=>{
   // Check the data in body
   if(!req.body.first || !req.body.last || !req.body.email || !req.body.password) {
      return res.status(401).json({message: "Parameters missing"});
   }
   let _ = req.body;
   let session = driver.session();
   let query = `
      MATCH (a:Account{email:'${_.email}'})
      WITH COUNT(a) as numb
      CALL apoc.do.when(
         numb=1,
         "MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data",
         "CREATE (n:Account{
            email:'${_.email}',
            password:'${_.password}',
            first:'${_.first}',
            last:'${_.last}',
            middle:'${_.middle}',
            admin:'user',
            subscription_commit_length:''
         })
         CREATE (b:Board_Activity{course_wait_recall:[]})
         CREATE (n)-[:Linked]->(b)
         RETURN {properties:properties(n), id:id(n)} as data"
      ) YIELD value
      RETURN value
      `;
      console.log(query)
   session.readTransaction( tx => tx.run(query))
   .then( data => {
      if(data.records[0] && data.records[0]._fields[0]){
        console.log(data.records[0]._fields[0])
        let f = data.records[0]._fields[0].data;
        let prop = f.properties;
        let uid = f.id.low;
        res.status(200).json({
          token:tokenGen(uid),
          exp: utils.expire(),
          first: prop.first
        });
      }else {
         res.status(401).json({message: 'not found'});
      };
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
