'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));


exports.modify_relationship = (req, res, next)=>{
   // var session = driver.session();
      // let query = "";
      // //    console.log(req.body.removeRelation.length);
      // // res.send('done');
      // if (req.body.removeRelation.length != 0){
      //    query = " REMOVE relation:" + req.body.removeType + " SET rel:" + req.body.setType;
      // }
      // if( req.body.createRelation.length == 0) {
      //    query = " SET rel:" + req.body.setType;
      // }
      // session.run(
      //       "MATCH ()-[rel]-() "
      //    +  " WHERE id(rel) = toInteger($relationId)"
      //    +  query
      //    +  " RETURN rel"
      //    , req.body
      // )
      // .then((data)=>{
      //    res.status(200).json(data);
      // })
      // .catch((error)=>{
      //    console.log(error);
      //    res.status(400).json({error: error});
      // });
   }
