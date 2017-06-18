'use-strict';
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "futur$"), {maxTransactionRetryTime: 30000});
var session = driver.session();
var path = require('path');


exports.recall = (req, res)=>{
   console.log(req.headers.courseid);
   // Check if data are conform
   if (!req.headers.courseid) return res.status(400).json({error: "request error courseId"});
   if (!req.headers.questid) return res.status(400).json({error: "request error questId"});

   session.run(
      //  " MATCH (account) WHERE id(account) = toInteger($accountId)"
       "match (course:Course)-[*]->(quest:Field) where id(course) = toInteger($courseId) AND id(quest) = toInteger($questId)"
      +" match (rule:Rule)-[:Rule]->(quest)-[:Correspond]-(answer:Field)"
      +" return {courseId: id(course), courseName: course.name} AS course"
      +", {questId:id(quest), questValue: quest.value} AS quest"
      +", {answerId: id(answer), answerValue:answer.value} AS answer"
      +", {ruleId: id(rule), ruleContent: rule.content} AS rule"
       , {"courseId": req.headers.courseid, "questId":req.headers.questid}
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
