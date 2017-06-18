// Refs: github/sgmeyer/auth0-node-jwks-rs256

let express = require('express');
let bodyParser = require('body-parser');

// let jwtCheck = require('./middleware/JwtCheck').jwtCheck;
let jwksrsa = require('jwks-rsa');
let jwtAuthz = require('express-jwt-authz');
let jwt = require('express-jwt');
let cors = require('cors');

let app = express();
let port = process.env.PORT || 3200;

// let api = require('./api');
// let scopeCheck = require('./middleware/scopeCheck');
let appRoutes = require('./api/appRoutes');
let AUTH_CONFIG = require('./api/config/auth');

// let jwtCheck = jwt({
//     secret: jwks.expressJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: "https://svezday.eu.auth0.com/.well-known/jwks.json"
//     }),
//     audience: 'https://ang-rest-graph-server.herokuapp.com',
//     issuer: "https://svezday.eu.auth0.com/",
//     algorithms: ['RS256']
// });


// app.use(jwtCheck);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next)=>{
   // res.header("Access-Control-Allow-Origin", "http://localhost:4200");
   res.header("Access-Control-Allow-Origin", "https://ang-rest-graph-web.herokuapp.com", "http://localhost:4200");
   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token");
   next();
});

// return error message for unauthorized requests
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({message:'Missing or invalid token'});
  }
});

// Add cors protection

// Add the bodyParser limits

// Add the error module

// Add the scope checking
// app.use('/api', jwtCheck, scopeCheck, api());

app.use(cors());

// let authCheck = jwt({
//    secret: new Buffer(AUTH_CONFIG.secret, 'base64'),
//    audience: AUTH_CONFIG.clientID
// });

// let authCheck = jwt({
//    secret: AUTH_CONFIG.secret,
//    audience: AUTH_CONFIG.clientID
// });
// app.use('/api', authCheck, appRoutes());
// app.get('/api/course_list', authCheck, (req, res)=>{
//    res.status(200).json({data:[{name: "maths"}]});
// });

const checkJwt = jwt({
   aud: 'http://localhost:3200/',
   secret: jwksrsa.expressJwtSecret({
     cache: true,
     rateLimit: true,
     jwksRequestsPerMinute: 5,
     jwksUri: "https://svezday.eu.auth0.com/.well-known/jwks.json"
   }),
   issuer: "https://svezday.eu.auth0.com/",
   algorithms: ['RS256']
});

// const checkScopes = jwtAuthz(['read:course']);

// app.get('/api/course_list', checkJwt, (req, res)=>{
//    res.status(200).json({data: [{name: 'maths'}]});
// });

app.use('/api', checkJwt, appRoutes());


app.listen(port);


console.log('todo list RESTful API server started on: localhost:' + port);
