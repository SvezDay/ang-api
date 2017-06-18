'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.person_check = (req, res, next)=>{ // accountId, content{title}
   var session = driver.session();
   if(!req.body.user_info && !req.body.user_info.auth_type) res.status(401).send('error auth');

   session.run(
      // "MATCH (account:Account)"
      // +  " WHERE account[$auth_type] = $auth_user_id"
      // +  " RETURN account"
      // ,{auth_type: req.body.user_info.auth_type, auth_user_id: req.body.user_info.auth_user_id}
      "MATCH (account:Account)"
      +  " WHERE account.username = 'Mulder'"
      +  " RETURN account"
   )
   .then((data)=>{
      if(data.records.length == 0){
         console.log('no records');
         console.log(data);
         session.run(
            "CREATE (account:Account:PersoAccount{"
            +  " $auth_type: $auth_user_id"
            +  " , first = $first"
            +  " , last = $last"
            +  " , email = $email})"
            +  " RETURN account"
            ,{
               auth_type: req.body.user_info.auth_type,
               auth_user_id: req.body.user_info.auth_user_id,
               first: req.body.user_info.first,
               last: req.body.user_info.last,
               email: req.body.user_info.email,
            }
         )
         .then((data)=>{
            console.log(data.records[0]._fields[0].properties)
            res.status(200).json(data.records[0]._fields[0].properties);
         })
         .catch((error)=>{
            console.log(error);
            res.status(400).json({error: error});
         });
      }else{
         console.log('one or more records');
         console.log(typeof data.records[0]._fields[0].properties);
         console.log(data.records[0]._fields[0].properties);
      }
      res.status(200).json(data.records[0]._fields[0].properties);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
