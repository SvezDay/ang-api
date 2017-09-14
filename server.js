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

app.listen(port);
console.log('API server started on: localhost:' + port);


const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;
// const secret = require('./config/tokenSecret').secret;

let parser = require('./api/services/parser');
let tokenGen = require('./api/services/token').generate;
let schema = require('./api/models/schema');
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

const schemas = require('./api/models/schema');


app.post('/test', function(req, res){
  let user_id = 181;
  let _ = {id: 255, schema: 'DefProExpMeExSo', value: 'Test creation from server.js'};

  let today = new Date().getTime();
  let session = driver.session();
  let q_1 = q1_1 = q1_2 = q_2 = '';
  let course = {};


  schemas.getSchemaObj(_.schema)
  .then( schema =>{
//First part create the node
    q_1_1 = `
      match (a:Account) where id(a) = ${user_id}
      create (c:Container:Course{value:'${_.value}', schema:'${_.schema}'})
    `;
//Second part create the relationships
    q_1_2 = `create (a)-[:Linked]->(c)`;
    for (let x of schema) {
      q_1_1 += ` create (p${x}:Property:${x}{value:''})`;
      q_1_2 += `-[:Linked]->(p${x})`
    };
    q_1 = `${q_1_1} ${q_1_2} return {id:id(c), value:c.value}`;
    q_2 = `
      match (a:Account)-[]->(b:Board_Activity) where id(a)= $user_id
      set b.course_wait_recall = b.course_wait_recall + $course_id
      return b
    `;
    return;
  })
  .then(()=>{
    return session.readTransaction(tx => tx.run(q_1, {}))
  })
  // .then( data => {
  //   return parser.dataMapper(data);
  // })
  .then( data => {
    return data.records.map( x => {
      let f = x._fields[0];
      if(f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity
      };
      return f
    });
  })
  .then( data => {
    course.id = data[0].id;
    course.value = data[0].value
    return session.readTransaction(tx => tx.run(q_2, {user_id:user_id, course_id:course.id}))
  })
  .then( data => {res.json({data: data})})
  // .then( (data) => {
  //   console.log(data)
  //   res.status(200).json({
  //     token:tokenGen(user_id),
  //     id: course.id,
  //     value: course.value
  //   });
  // })
  // .catch( error =>{
  //   console.log(error);
  //   res.status(404).json({message:"ERROR on /api/create_course"});
  // });

});

let cleanId = (obj)=>{
    if( obj.identity ){
      obj.id = obj.identity.low;
      delete obj.identity;
    }else if(obj.id && obj.id.low){
      obj.id = obj.id.low;
    };
  return obj;
};

let  dataMapper = (data)=>{
  return new Promise((resolve, reject)=>{
    if (data.records.length > 1){
      // resolve(data.records.map(x => {
      //   // if(x._fields[0].identity){
      //   //   x._fields[0].id = x._fields[0].identity.low;
      //   //   delete x._fields[0]['identity']
      //   // };
      //   // return x._fields[0];
      //   return cleanId(x._fields[0]);
      // }));
      resolve(data.records.map(x => {
        console.log('check 1')
        if(!Array.isArray(x)){   // it's an object with key/value
          if(x._fields[0].id && x.id._fields[0].low || x._fields[0].identity){
            x._fields[0] = cleanId(x);
          }else{
            console.log('==================')
            let u = Object.keys(x._fields[0])[0];
            console.log(u)
            let t = x._fields[0][u];
            console.log(t.labels)
            if(typeof Object.keys(x._fields[0])[0] == 'string'){
              console.log('check')
              console.log(Object.keys(x._fields[0])[0])
              x[Object.keys(x._fields[0])[0]] = cleanId(x._fields[0][Object.keys(x._fields[0])[0]]);
              delete x._fields[0][u];
            }
            console.log(typeof Object.keys(x._fields[0])[0])
            // x._fields[0][Object.keys(x._fields[0])].map( y => {
            //   y = cleanId(y);
            // });
          };
        }else{ // it's an array - list
          x[Object.keys(x)[0]].map( y => {
            y = cleanId(y);
          });
        };
        return x;
      }));
    }else if (data.records[0]._fields[0].length >= 1) {
      console.log('check 2')
      resolve(data.records[0]._fields[0].map(x => {
        return cleanId(x);
      }));
    }else if (data.records[0]._fields.length >= 1) {
        console.log('check 3')
      resolve(data.records[0]._fields.map(x => {
        if(!Array.isArray(x)){   // it's an object with key/value
          if(x.id && x.id.low || x.identity){
            x = cleanId(x);
          }else{
            x[Object.keys(x)[0]].map( y => {
              y = cleanId(y);
            });
          };
        }else{ // it's an array - list
          x[Object.keys(x)[0]].map( y => {
            y = cleanId(y);
          });
        };
        // return x;
      }));
    }else {
      console.log('init check')
      return "Error";
      // res.status(400).json({message: 'on the parser service'});
    };
  });
};
// A single obj
// let query = "match (a:Account) return a limit 1";

// Multiple records with 1 array of 1 object in fields for each

// let query = "match (c:Course) match (d:Definition) return {courseList: c, definition:d}";
// let query = "match (c:Course) match (d:Definition) return c as courseList";
// let query = "match (c:Course) match (d:Definition) return c as courseList, d as definition";
// let query = "match (c:Course) return {courseList: collect(c)}";
// let query = "match (c:Course) return collect(c)";
// let query = "match (c:Course) match (d:Definition) return {courseList: collect(c)}, collect(d)";
// let query = "match (c:Course) match (d:Definition) return {message:'hello'}";


app.post('/myTest', (req, res, next)=>{
  let session = driver.session();
  session.readTransaction(tx => tx.run(query))
  .then(data=>{
    return dataMapper(data);
  })
  .then(data =>{
    let course = {id: 270, label: 'Course'};
    // data[0].courseList.push(course);
    res.json({response: data})
  })
  .catch(error => {
    console.log(error)
    res.json({error:error})
  });
});
