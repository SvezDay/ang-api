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


app.post('/test', (req, res)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = 181;
  let _ = {
    title_value: "Undefined",
    content_value:"The logic of ensemblisime is the rule to follow",
    content_label: "Undefined"
  };


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Note:Container{commitList: [${today}] })
     create (t:Property:Title {value:'${_.title_value}'})
     create (u:Property:${_.content_label}{value:'${_.content_value}'})
     create (a)-[:Linked]->(n)-[:Has{commit:${today}}]->(t)-[:Has{commit:${today}}]->(u)
     return {note_id: id(n), title_id:id(t), first_property_id: id(u)}
  `;


  session.readTransaction(tx => tx.run(query))
  .then( data => {
    let f = data.records[0]._fields[0];
    let l = Object.keys(f);
    l.map(x => {
      f[x].low ? f[x] = f[x].low : null
    });
    return f;
  })
  .then( data =>{
    res.status(200).json({
      token: tokenGen(user_id),
      data: data.records
    });
  })
  .catch( error => {
    console.log(error);
     res.status(404).json({error: error, message:'error basic error'});
  });

});
