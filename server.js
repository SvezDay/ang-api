/* Refs:
------------------------------------------------- Authentication & authorization
https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
https://github.com/auth0/node-jsonwebtoken
https://www.youtube.com/watch?v=fDHihQ5hB5I
------------------------------------------------- Apoc
https://www.npmjs.com/package/apoc
*/
let express = require('express');
let bodyParser = require('body-parser');

let cors = require('cors');
let morgan = require('morgan');

let app = express();
let port = process.env.PORT || 3200;
process.env.NEO4J_PROTOCOL="http";
// process.env.NEO4J_HOST=192+"."+168+"."+.0+"."+5
// process.env.NEO4J_HOST=127+"."+0+"."+.0+"."+1
process.env.NEO4J_HOST="127.0.0.1";
process.env.NEO4J_PORT=7474;
process.env.NEO4J_USERNAME="neo4j";
process.env.NEO4J_PASSWORD="futur$";

let appRoutes = require('./api/appRoutes');
let tokenRoutes = require('./api/tokenRoutes');
let freeRoutes = require('./tokenFreeRoutes');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next)=>{
   // res.header("Access-Control-Allow-Origin", "http://localhost:4200");
   res.header("Access-Control-Allow-Origin", "https://ang-app.herokuapp.com", "http://localhost:4200");
   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, x-access-token");
   next();
});

// return error message for unauthorized requests
app.use(function (err, req, res, next) {
   if (err.name === 'UnauthorizedError') {
      res.status(401).json({message:'Missing or invalid token'});
   }
});

// Add cors protection
app.use(cors());

// Add the bodyParser limits

// Add the error module

// Add the scope checking

app.use('/api', tokenRoutes, appRoutes());

app.post('/authenticate', freeRoutes.authenticate);
app.post('/register', freeRoutes.register);

const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;
const secret = require('./config/tokenSecret').secret;
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

// function writeTx(session, query, params){
//    return new Promise((resolve, reject)=>{
//       session
//       .writeTransaction(tx => {
//          tx.run(query, params)
//       })
//       .then(() => {
//          console.log('CHECK resolve writeTx');
//          resolve('done');
//       })
//       .catch(function (error) {
//          console.log('CHECK reject writeTx');
//          reject(error);
//       });
//    })
// }
//
// function readTx(session, query, params){
//    return new Promise((resolve, reject)=>{
//       session
//       .readTransaction(tx => {
//          tx.run(query, params)
//       })
//       .then((result) => {
//          console.log('CHECK resolve readTx');
//          console.log('result of the readTx function');
//          console.log(result);
//          resolve(result);
//       })
//       .catch((error) =>{
//          console.log('CHECK reject readTx');
//          reject(error);
//       });
//    })
// }

app.post('/test', function(req, res){
   let _ = req.body;
   let date = new Date().getTime();
   const session = driver.session();
   const readA = `
   match (a:Account)-[l1:Linked]->(n:Note:Container)-[l:Linked*{commitNbr:last(n.commitList)}]->(x:Property)
      where id(a)= 181 and id(n) = 227
      with l1, x
      return
      case
         when count(l1)>=1 then collect(x)
         else {data:{message: 'No access user'}}
      end
   `;



   session
   .readTransaction(tx => tx.run(readA, {}))
   .then(data => {

      if(data.records && data.records[0]){
         let d = data.records[0]._fields[0];
         console.log(d[0][0]);
         let detail = [];
         let it = 0;
         let mapped = d.map(x=>{
            it++;
            return {
               node_id: x.identity.low,
               value:x.properties.value,
               labels:x.labels,
               order:it
            };
         });
         // for (var i = 0; i < d.length; i++) {
         //    let check = true;
         //    let j = 0;
         //    while (check) {
         //       if(d[0][i].labels[j] != 'Property'){
         //          d[0][i].labels = d[0][i].labels[j];
         //          check = false;
         //       }else {
         //          j++;
         //       }
         //    }
         //    detail.push({
         //       node_id:d[0][i].identity.low,
         //       value:d[0][i].properties.value,
         //       labels:d[0][i].labels
         //    });
         // };

   res.json({data:mapped})
      }else {
         res.status(403).json({message: 'No access user'});
      }

   })
   .catch(function (error) {
      console.log("========================== CHECK 1 ERROR ==============");
     console.log(error);
     res.status(200).json({error:error});
   });







   // const query1 = `
   // create (n:Container:Note)
   // create (p:Property:Undefined{value:'This is a test for transactions'})
   // create (u:Property:Undefined{value:'5'})
   // create (n)-[l1:Linked]->(p)-[l2:Linked]->(u)
   // `;
   // const params1 = {};
   // const query2 = `
   // match (n:Note)-[:Linked]->(p:Property)-[:Linked]->(u:Property{value:'4'})
   // return n, p, u
   // `;
   // const params2 = {};
   //
   //
   // session.writeTransaction(tx => {
   //    tx.run(query1, params1)
   // })
   // .then(() => {
   //    const readTxPromise = session.readTransaction(tx => tx.run(query2, params2));
   //    readTxPromise.then(result => {
   //       session.close();
   //       console.log(result);
   //       const singleRecord = result.records[0];
   //       const createdNodeId = singleRecord.get(0);
   //       res.status(200).json({data:[singleRecord, createdNodeId]});
   //    })
   //    .catch(function (error) {
   //       console.log("========================== CHECK 2 ERROR ==============");
   //      console.log(error);
   //      res.status(200).json({error:error});
   //    });
   // })
   // .catch(function (error) {
   //    console.log("========================== CHECK 1 ERROR ==============");
   //   console.log(error);
   //   res.status(200).json({error:error});
   // });




// Chaining of transactions
// writeTx(session, query1, params1).then((result1)=>{
//    console.log('result1', result1);
//    readTx(session, query2, params2).then((result2)=>{
//       if(!result2){
//          session.close();
//          return res.status(200).json({error: 'Result is Undefined !'});
//       }
//       session.close();
//       console.log('result2');
//       console.log(result2);
//       const singleRecord = result2.records[0];
//       const createdNodeId = singleRecord.get(0);
//       res.status(200).json({data:result2});
//    },(error)=>{
//       console.log("========================== CHECK 2 ERROR ==============");
//       console.log(error);
//       session.close();
//       res.status(200).json({error:error});
//    });
// },(error)=>{
//    console.log("========================== CHECK 1 ERROR ==============");
//    console.log(error);
//    session.close();
//    res.status(200).json({error:error});
// });



});

app.listen(port);
console.log('API server started on: localhost:' + port);
