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

let conf = require('./config/config');
let appRoutes = require('./api/appRoutes');
let tokenRoutes = require('./api/tokenRoutes');
let freeRoutes = require('./tokenFreeRoutes');
let myeasytest = require('./myeasytest');

let app = express();
let port = process.env.PORT || 3200;

process.env.NEO4J_PROTOCOL="http";
// process.env.NEO4J_HOST=192+"."+168+"."+.0+"."+5
process.env.NEO4J_HOST=conf.back.host;
process.env.NEO4J_PORT=conf.back.port;
process.env.NEO4J_USERNAME=conf.back.neousr;
process.env.NEO4J_PASSWORD=conf.back.neopwd;



let allowCrossDomain = (req, res, next)=>{
   res.header("Access-Control-Allow-Origin", "https://ang-app.herokuapp.com", "http://localhost:4200");
   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, x-access-token");
   next();
};

let corsOptions = {
  origin: (origin, callback)=>{
    if(conf.app.whiteList.indexOf(origin) !== -1){
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
};


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/test', myeasytest);
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
