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
var neo4j = require('neo4j-driver').v1;
const secret = require('./config/tokenSecret').secret;
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

app.post('/test', function(req, res){
   let _ = req.body;
   let query = `
   match (a:Account)-[l1:Linked]->(n:Note:Container)-[:Linked*]->(x)
   where id(a)= 183 and id(n) = 186
   with collect(x) as xs, a, l1, n, x
   return
   case
      when count(l1)=1 then xs
      else {data:{message: 'No access user'}}
      end
   `;
      //se call apoc.path.spanningTree(n, 'Linked>') yield path
   driver.session()
   .run(query)
   .then((data)=>{
      if(data.records[0]){
         let d = data.records;
         let detail = [];
         for (var i = 0; i < d.length; i++) {
            let check = true;
            let j = 0;
            while (check) {
               if(d[i]._fields[0][0].labels[j] != 'Property'){
                  d[i]._fields[0][0].labels = d[i]._fields[0][0].labels[j];
                  check = false;
               }else {
                  j++;
               }
            }
            detail.push({
               node_id:d[i]._fields[0][0].identity.low,
               content:d[i]._fields[0][0].properties.value,
               labels:d[i]._fields[0][0].labels
            });
         }

         let token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // expiration in 1 hour
         },secret);

         res.status(200).json({
            token:token,
            detail: detail
         });
      }else {
         res.status(201).json({message: 'No access user'});
      }
   })
   .catch((error)=>{
      console.log(error);
      res.status(401).json({error: error, message:'error basic error'});
   });

});

app.listen(port);
console.log('API server started on: localhost:' + port);
