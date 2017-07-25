'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.getAll = (req, res, next)=>{ // accountId, content{title}
   let session = driver.session();
   session.run(
      'MATCH (a:Account) RETURN a'
   )
   .then((data)=>{
      res.status(200).json({data:data.records[0]._fields});
   })
   .catch((error)=>{
      res.status(400).json({error:error, message:'no access to all user list'});
   });
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
   // Check the data in body
   if(req.body.first && req.body.last && req.body.email && req.body.password) {
      return res.status(401).json({message: "Parameters missing"});
   }
   var session = driver.session();
   // Check if first + last [+ middle] already exists

   // Check if email already exists
   session.run(
         "MATCH (a:Account{email:$email})"
      +  " CALL apoc.do.when("
      +    " COUNT(a)=1,"
      +    " 'MATCH (e:Error) WHERE id(e)=170 RETURN e.name as data',"
      +    " 'CREATE (n:Account"
      +       " {email:$email, first:$first, last:$last, password:$password}) "
      +    " RETURN {id:id(n), properties:properties(n)} as data'"
      +  " )"
      +  " RETURN data"
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
