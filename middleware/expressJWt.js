module.exports.default = (options) => {

   var secretCallback = options.secret;

   var middleware = (req, res, next) => {
      // https://github.com/sgmeyer/auth0-node-jwks-rs256/blob/master/src/middleware/expressJwt.js#L12-L23
      console.log(req.headers);
      var authHeader = req.headers.authorization;
      if (!req.headers.authorization) {
         throw new Error('token_required', { message: 'No authorization token was found' });
      }
      var parts = authHeader.split(' ');

      if (parts.length != 2) {
         throw new UnauthorizedError('credentials_required', { message: 'No authorization token was found' });
      }

      var scheme = parts[0];
      if(!/^Bearer$/i.test(scheme)) {

         throw new UnauthorizedError('credentials_bad_scheme', { message: 'Format is Authorization: Bearer [token]' });
      }

      var token = parts[1];

      // This could fail.  If it does handle as 401 as the token is invalid.
      var decodedToken = jwt.decode(token, {complete: true});

      // https://github.com/sgmeyer/auth0-node-jwks-rs256/blob/master/src/middleware/expressJwt.js#L30-L58
      if (decodedToken.header.alg !== 'RS256') {
         // we are only supporting RS256 so fail if this happens.
         return cb(null, null);
      }

      var tasks = [
         function getSecret(callback) {
            secretCallback(req, decodedToken.header, decodedToken.payload, callback);
         },
         function verifyToken(secret, callback) {
            jwt.verify(token, secret, options, function(err, decoded) {
               if (err) {
                  callback(new UnauthorizedError('invalid_token', err));
               } else {
                  callback(null, decoded);
               }
            });
         }
      ];

      async.waterfall(tasks, (err, result) => {
         if (err) {
            return next(err);
         }

         set(req, _requestProperty, result);
         next();
      });

   }

   return middleware;
}
