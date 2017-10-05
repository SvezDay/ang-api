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
let tokenGen = require('./api/services/token.service');
let schema = require('./api/models/schema');
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));
// const Integer = require('neo4j-driver/src/v1/integer.js');
const schemas = require('./api/models/schema');


app.post('/test', (req, res)=>{

  // Till it is difficult to extract the date time, the commit will be the last one by default
  let user_id = 443;
  let _ = {
    id: 485
  }
  let commit = req.body.commit || null;
  let session = driver.session();
  let today = new Date().getTime();


  let query = `
    match (a:Account)-[l:Linked*]->(c:Container)-[o*]->(p)
    where id(a) = ${user_id} and id(c) = ${_.id}
    with distinct last(l) as link, o, c, p
    with collect(last(o)) as olist, link, c, p
    foreach(x in olist | delete x )
    delete link, c, p
  `;


  session
  .readTransaction(tx => tx.run(query))
  .then( () => {
    res.status(200).json({message:"deleted!"})
  })
  .catch( error => {
    console.log(error);
    res.status(400).json({error:error});
  });

});
