/* Refs:
------------------------------------------------- Authentication & authorization
https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
https://github.com/auth0/node-jsonwebtoken
https://www.youtube.com/watch?v=fDHihQ5hB5I
------------------------------------------------- Apoc
https://www.npmjs.com/package/apoc
*/


// WARNING VERY IMPORTANT

// Modification on the neo4j file system
// neo4j.config
/*
  #dbms.directories.import=import // was commented
  apoc.import.file.enabled=true   // was added
  apoc.export.file.enabled=true   // was added
*/

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');

const conf = require('./config/config');
const appRoutes = require('./api/appRoutes');
const tokenRoutes = require('./api/tokenRoutes');
const freeRoutes = require('./tokenFreeRoutes');
let myeasytest = require('./myeasytest');

const app = express();
const port = process.env.PORT || 3200;


let allowCrossDomain = (req, res, next)=>{
   res.header("Access-Control-Allow-Origin", "http://localhost:4200", "https://ang-app.herokuapp.com");
   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, x-access-token");
   next();
};

let corsOptions = {
  origin: (origin, callback)=>{
    if(origin == undefined){ callback(null, true) } else
    if(conf.white_list.indexOf(origin) !== -1){
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// return error message for unauthorized requests
let handleError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({message:'Missing or invalid token'});
  }
  // res.status(500).json(err)
};


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.post('/test', myeasytest.test);
app.post('/test', (req, res, next)=>{
  res.send('cehck')
});
// app.post('/test2', myeasytest.test2);
// app.post('/test3', myeasytest.test3);
app.use(allowCrossDomain);
app.use(handleError);

app.use(cors(corsOptions));

// Add cors protection
// Add the bodyParser limits
// Add the error module
// Add the scope checking

app.post('/authenticate', freeRoutes.authenticate);
app.post('/register', freeRoutes.register);

app.use('/api', tokenRoutes, appRoutes());


app.listen(port);
console.log('API server started on: localhost:' + port);
