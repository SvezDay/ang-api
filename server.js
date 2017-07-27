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

// const apoc = require('apoc');
// var neo4j = require('neo4j-driver').v1;
// const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
// const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
// const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
// const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));
//
// app.post('/test', function(req, res){
//    let _ = req.body;
// //    "MATCH (a:Account{email:$email})"
// // +  " CALL apoc.do.when("
// // +    " COUNT(a)=1,"
// // +    " 'MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data',"
// // +    " 'CREATE (n:Account"
// // +       " {email:$email, first:$first, last:$last, password:$password}) "
// // +    " RETURN {id:id(n), properties:properties(n)} as data'"
// // +  " )"
// // +  " RETURN data"
//    let query = `
//       MATCH (a:Account{email:'${_.email}'})
//       WITH COUNT(a) as numb
//       CALL apoc.do.when(
//          numb=1,
//          "MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data",
//          "CREATE (n:Account{email:'${_.email}'}) RETURN {properties:properties(n)} as data"
//       ) YIELD value
//       RETURN value
//
//       `;
//    driver.session()
//    .run(query)
//    .then((data)=>{
//       console.log(data);
//       if(data.records[0]){
//          res.status(200).json(data.records[0]._fields[0]);
//       }else {
//          res.status(401).json({message: 'not found'});
//       }
//    })
//    .catch((error)=>{
//       console.log(error);
//       res.status(400).json({error: error});
//    });
// });

app.listen(port);
console.log('API server started on: localhost:' + port);
