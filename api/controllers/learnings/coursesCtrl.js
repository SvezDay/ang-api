'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;
// var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "futur$"), {maxTransactionRetryTime: 30000});
// var session = driver.session();

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.course_list = (req, res)=>{
   var session = driver.session();
   session.run(
      "MATCH (courses:Course)"
      +" WITH COLLECT(courses) AS courseList"
      // +" WITH EXTRACT(crs IN courseList |{ name:crs.name, id:id(crs) }) AS extractList"
      +" RETURN {courseList: courseList}"
      ,{}
   )
   .then((data)=>{
         // return data.records[0]._fields[0].courseList;
      let result = [];
      for (let item of data.records[0]._fields[0].courseList){
         result.push({name:item.properties.name, id:item.identity.low});
      }
      return result;
   })
   .then((data)=>{
      res.status(200).json({data: data});
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });

}
exports.add_course = (req, res)=>{
   var session = driver.session();
   // if (!req.body.accountId) return res.status(400).json({error: "request error accountId"});
   // if (!req.body.courseName) return res.status(400).json({error: "request error course name"});

   session.run(
      //  " MATCH (account) WHERE id(account) = toInteger($accountId)" +
       // create a maincontainer as Course bind to the account and its title
       " CREATE (course:MainContainer:Course{name:$name})" +
       " RETURN course"
       , {name: req.body.name}
   )
   .then((data)=>{
      return data;
   })
   .then((data)=>{
      // session.close();
      // driver.close();
      res.status(200).json({data: data});
   })
   .catch((error)=>{
      console.log(error);
      // session.close();
      // driver.close();
      res.status(400).json({error: error});
   });
}
