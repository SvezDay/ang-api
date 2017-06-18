'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

// ********************** WARNING  WARNING  WARNING  WARNING  WARNING  WARNING  WARNING  WARNING  ************** The labeling name is free, so it must be secure to avoid sql injection
// UNLESS the choice of fields is already defined  <--
let firstUpperCase = (str)=>{
   let matches = str.match(/([A-z]{1})([A-z]*)/);
   let first = matches[1].toUpperCase();
   return first + matches[2];
   // let first = str.replace(/(\s[A-z]{1})/g, function(match, truc1, truc2, t3, t4){
   //    console.log(match);
   //    console.log(truc1);
   //    console.log(truc2);
   //    console.log(t3);
   //    console.log(t4);
   //    let x = match.replace(/\s/, '');
   //    x = x.toUpperCase()
   //    return x;
   // });
}

exports.add_another_field = (req, res, next)=>{ // accountId, containerId, fieldContent
   var session = driver.session();
   // req.body.label = firstUpperCase(req.body.label);
   session.run(
      "MATCH (container) "
      +  " WHERE container:Container AND id(container) = toInteger($containerId) "
      +  " OR    container:Field     AND id(container) = toInteger($containerId)"
      +  " CREATE (container)-[:Followed_by]->(field:Field)"
      +  " SET field = $fieldContent"
      +  " SET field :" + req.body.label
      +  " RETURN container"
      ,req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
   // res.send(req.body.label)
}
exports.add_definition_to_mecanisme = (req, res, next)=>{ // accountId, containerId, definitionContent, mecanismeContent
   var session = driver.session();
   session.run(
      "MATCH (container:Container) WHERE id(container) = toInteger($containerId)"
      +  " CREATE (container)-[:Followed_by:CalableRectoVerso]->(def:Field:Definition)-[:Followed_by:CalableRectoVerso]->(meca:Field:Mecanisme)<-[:CalableRectoVerso]-(container)"
      +  " SET def = $definitionContent"
      +  " SET meca = $mecanismeContent"
      +  " RETURN container"
      ,req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
exports.add_case_to_solution = (req, res, next)=>{ // accountId, containerId, caseContent, solutionContent
   var session = driver.session();
   session.run(
      "MATCH (container:Container) WHERE id(container) = toInteger($containerId)"
      +  " CREATE (container)-[:Followed_by]->(case:Field:Case)-[:Followed_by:CalableRecto]->(solu:Field:Solution)"
      +  " SET case = $caseContent"
      +  " SET solu = $solutionContent"
      +  " RETURN container"
      ,req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
exports.add_trad_to_trad = (req, res, next)=>{ // accountId, containerId, caseContent, solutionContent
   var session = driver.session();
   session.run(
      "MATCH (container:Container) WHERE id(container) = toInteger($containerId)"
      +  " CREATE (container)-[:Followed_by]->(trad1:Field:Traductor)-[:Followed_by:CalableRectoVerso]->(trad2:Field:Traductor)"
      +  " SET trad1 = $trad1Content"
      +  " SET trad2 = $trad2Content"
      +  " RETURN container"
      ,req.body
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
