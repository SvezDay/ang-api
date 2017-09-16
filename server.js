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
// import {toNumber} from 'neo4j-driver/src/v1/integer.js'
// let toNumber = neo4j.integer;
app.post('/testing', (req, res)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = 181;
  let _ = {id: 293};
  let recallList = [];
  let recallTarget = schema.labelRecallableTargetList();
  let query1 = query2 = query2First = query2Last = query3 = '';
  // For each property of the schema found, the second iteration allow to
  // select the property whose match for create the list of the recallable relations
  let mapper = (nodeList)=>{
    let endNode;
    nodeList.map( p => {
      recallTarget[`${p.label}`].map( l => {
        if(endNode = parser.includerReturnId(nodeList, 'label', l)){
          query2First += ` create (r${p.id}${endNode}:Recall_Memory:c${_.id}{
            level:1, nextDate: ${today}, startNode: ${p.id}, endNode: ${endNode}
          })`;
          query2Last += ` create (a)-[:Linked]->(r${p.id}${endNode})`;
        };
      });
    });
    query2 = query2First + query2Last;
  };


  query1 = `
  match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)
    where id(a)=${user_id} and id(c)=${_.id}
    with a, c, collect(pp) as totallist
      filter( p in totallist where size(p.value)>=1 ) as cleanlist
    	extract( p in  cleanlist |
      	{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}
      ) as newList
    return newList
  `;
  query2First = `match (a:Account) where id(a)=${user_id}`;
  query2Last = ``;
  query3 = `
  match (a:Account)-[]->(b:Board_Activity)
  where id(a)=${user_id}
  set b.course_wait_recall = filter(x in b.course_wait_recall where x <> ${_.id})
  `;


  session.readTransaction(tx=>tx.run(query1))
  .then( data => { return parser.dataMapper(data); })
  .then( data => {
    data.push({
      "label": "Course",
      "id": _.id
    });
    mapper(data);
    return data;
  })
  .then(data => { return session.readTransaction(tx=>tx.run(query2)); })
  .then( () => {
    return session.readTransaction(tx=>tx.run(query3));
  })
  .then(()=>{ res.status(200).json({token:tokenGen(user_id), message:'Done !'})})
  .catch( error => {
    console.log(error);
      res.status(403).json({
        error:error,
        message: 'ERROR on game toggle_out_from_recallable'
    });
  });
});

app.post('/test', function(req, res){
  let user_id = 181;
  let _ = {id: 255, schema: 'DefProExpMeExSo', value: 'Test creation from server.js'};

  let session = driver.session();
  let today = new Date().getTime();

  let queryOne =`
     match (a:Account)-[:Linked]->(r:Recall_Memory)
     where id(a) = ${user_id} and r.nextDate <= ${today}
     with count(r)as num
     call apoc.do.when(
        num>=1,
        "match (a:Account)-[:Linked]->(r:Recall_Memory)
            where id(a) = $user_id and r.nextDate <= $today
            with head(collect(r)) as re
            match (x) where id(x)= re.startNode
            match (y) where id(y)= re.endNode
            return {startNode: x, endNode:y} ",
        "return {message: 'No more question'}",
        {user_id: ${user_id}, today: ${today} }
     ) yield value
    return value
  `;

  session.readTransaction(tx => tx.run(queryOne, {}))
  .then( data => {
    let f = data.records[0]._fields[0];
    let u = f[Object.keys(f)[0]];
    u.startNode.id = u.startNode.identity.low;
    delete u.startNode.identity;
    u.endNode.id = u.endNode.identity.low;
    delete u.endNode.identity;
    return u;
  })
  .then( data => {
      if (data.message){
        res.status(400).json({message: data.message});
      }else {
        // let token = jwt.sign({
        //   exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
        //   user_id:user_id
        // },secret);
        res.status(200).json({
          token: tokenGen(user_id),
          data:data
        });
      }
  })
  .catch((error)=>{
    console.log(error)
     res.status(404).json({error: error, message:'error basic error'});
  });

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
