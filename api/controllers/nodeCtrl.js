'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.update_node_content = (req, res, next)=>{
   var session = driver.session();
   session.run(
         "MATCH (container) "
      +  " WHERE id(container) = toInteger($containerId)"
      +  " SET container = $newContent"
      +  " RETURN container"
      , req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
exports.update_node_label = (req, res, next)=>{
   var session = driver.session();
   session.run(
         "MATCH (container) "
      +  " WHERE id(container) = toInteger($containerId)"
      +  " REMOVE container:" + req.body.oldLabel
      +  " SET container:"+ req.body.newLabel
      +  " RETURN container"
      , req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
