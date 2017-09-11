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

const schemaObj = require('./api/models/schema');


app.post('/test', function(req, res){
  let user_id = 181;
  let session = driver.session();
  let _ = req.body;
  let today = new Date().getTime();
  let recallList = [];
  let recallTarget = schema.labelRecallableTargetList();

  let query1 = `
  match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)
    where id(a)=${user_id} and id(c)=${_.id}
    with a, c,
    	extract( p in  collect(pp) |
      	{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}
      ) as newList
    return newList
  `;
  let query2First = `
  match (a:Account) where id(a)=${user_id}
  `;
  let query2Last = ``;
  // For each property of the schema found, the second iteration allow to
  // select the property whose match for create the list of the recallable relations
  let mapper = (nodeList)=>{
    // console.log('==============================================================')
    // console.log('==============================================================')
    console.log('==============================================================')
    console.log(nodeList)
    nodeList.map( p => {

      recallTarget[`${p.label}`].map( l => {
        // console.log('==============================================================')
        // console.log('l', l);
        if(nodeList.includes(`${l}`)){
          // console.log('check')
          query2One += ` create (r${p.id}${l.id}:Recallable_Memeory:c${_.id}{
            level:1, nextDate: ${today}, startNode: ${p.id}, endNode: ${l.id}
          })`;
          query2last += `create (a)-[:Linked]->(r${p.id}${l.id})`;
        };
      });
    });
  };

  session.readTransaction(tx=>tx.run(query1))
  .then( data => { return parser.dataMapper(data); })
  .then( data => {
    recallList = mapper(data);
    // console.log(recallList);
    return;
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

app.post('/me', function(req, res){
  let user_id = 181;
  let session = driver.session();

  let query1 = `
  match (a:Course) return collect(a)
  `;

  session.readTransaction(tx=>tx.run(query1))
  // .then( data => { return parser.dataMapper(data); })
  .then((data)=>{ res.status(200).json({token:tokenGen(user_id), data:data})})
  .catch( error => {
    console.log(error);
      res.status(403).json({
        error:error,
        message: 'ERROR on game toggle_out_from_recallable'
    });
  });

});
