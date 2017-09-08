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
const secret = require('./config/tokenSecret').secret;
let parser = require('./api/services/parser');
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

const schemaObj = require('./api/models/schema');


app.post('/test', function(req, res){
  let user_id = 181;
  let _ = {
    value: 'Test of course creation',
    schema: 'DefProExpMeExSo'
  };
  let today = new Date().getTime();
  let session = driver.session();
  let q_1 = q1_1 = q1_2 = q_2 = '';


  schemaObj.getSchemaObj(_.schema)
  .then( schema =>{
//First part create the node
    q_1_1 = `
      match (a:Account) where id(a) = ${user_id}
      create (n:Container:Course{value:'${_.value}', schema:'${_.schema}'})
    `;
//Second part create the relationships
    q_1_2 = `create (a)-[:Linked]->(n)`;
    for (let x of schema) {
      q_1_1 += ` create (p${x}:Property:${x}{value:''})`;
      q_1_2 += `-[:Linked]->(p${x})`
    };
    q_1 = `${q_1_1} ${q_1_2} return {id:id(n), value:n.value}`;
    return;
  }).then(()=>{
    return session.readTransaction(tx => tx.run(q_1, {}))
  }).then( data => {
// return parser.dataMapper(data);
    return parser.dataMapper(data);;
  }).then( data => {
    let token = jwt.sign({
       exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
       user_id:user_id
    },secret);
    res.status(200).json({
      token:token,
      id: data.id.low,
      value: data.value
    });
  }).catch(()=>{
    res.status(404).json({message:"ERROR on /api/create_course"});
  });

});
