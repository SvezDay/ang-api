var expressJwt = require('./expressJWt').default;
var expressJwtSecret = require('../lib/expressJwtSecret').default;

module.exports.jwtCheck = expressJwt({
  secret: expressJwtSecret({
    jwksUri: `https://ang-rest-graph-server.herokuapp.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  // audience: 'https://ang-rest-graph-server.herokuapp.com',
  audience: 'http://localhost:3200',
  issuer: 'https://svezday.eu.auth0.com/',
  algorithms: ['RS256']
});

// app.get('/meta', jwtCheck, api());
