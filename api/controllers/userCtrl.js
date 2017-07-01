'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.getAll = (req, res, next)=>{ // accountId, content{title}
   res.status(200);
}
exports.getOne = (req, res, next)=>{ // accountId, content{title}
   res.status(200);
}
exports.update = (req, res, next)=>{ // accountId, content{title}
   res.status(200);
}
exports.delete = (req, res, next)=>{ // accountId, content{title}
   res.status(200);
}
exports.create = (req, res, next)=>{ // accountId, content{title}
   var session = driver.session();
   // Check the data in body
   // then check if first + last already exists
   // or if email already exists

   // if(!req.body.user_info && !req.body.user_info.auth_type) res.status(401).send('error auth');

   session.run(
      "CREATE (account:Account{"
      + " first:$first, last:$last, email:$email, password:$password"
      + "})"
      +  " RETURN account"
      ,{first: req.body.first, last: req.body.last, email:req.body.email, password:req.body.password}
   )
   .then((data)=>{
      res.status(200).json(data.records[0]._fields[0].properties);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
