'use-strict';
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "futur$"), {maxTransactionRetryTime: 30000});
var session = driver.session();
var path = require('path');


exports.add_rule = (req, res)=>{
   // Check if data are conform
   if (!req.body.accountId) return res.status(400).json({error: "request error accountId"});
   if (!req.body.courseId) return res.status(400).json({error: "request error courseId"});
   if (!req.body.english) return res.status(400).json({error: "request error english sentence"});
   if (!req.body.french) return res.status(400).json({error: "request error french sentence"});
   var ruleContent = "";
   if (req.body.ruleContent)
      ruleContent = "SET rule.content = '" + req.body.ruleContent + "'";

   session.run(
       " MATCH (course:Course) WHERE id(course) = toInteger($courseId)" +
       // create a container as Traductor bind to the english and the french nodes
       " CREATE (course)-[:Course]->(rule:Container:Rule)" +
       " CREATE (rule)-[:Rule]->(fr:Field:French{value:$french})" +
       " CREATE (rule)-[:Rule]->(en:Field:English{value:$english})-[c:Correspond]->(fr)" +
       ruleContent +
       " RETURN {rule: id(rule)}"
       , {"courseId": req.body.courseId, "english":req.body.english, "french":req.body.french}
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
exports.update_rule = (req, res)=>{
   // Check if data are conform
   if (!req.body.accountId) return res.status(400).json({error: "request error accountId"});
   if (!req.body.ruleId) return res.status(400).json({error: "request error ruleId"});
   if (!req.body.ruleContent) return res.status(400).json({error: "request error ruleContent"});

   session.run(
       " MATCH (rule:Rule) WHERE id(rule) = toInteger($ruleId)" +
       " SET rule.content = $ruleContent"+
       " RETURN {rule: id(rule), content: rule.content}"
       , {"ruleId": req.body.ruleId, "ruleContent":req.body.ruleContent}
   )
   .then((data)=>{
      return data;
   })
   .then((data)=>{
      res.status(200).json({data: data});
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}

exports.delete_rule = (req, res)=>{
   // Check if data are conform
   if (!req.body.accountId) return res.status(400).json({error: "request error accountId"});
   if (!req.body.ruleId) return res.status(400).json({error: "request error ruleId"});

   session.run(
       " MATCH (course:Course)-[r1:Course]->(rule:Rule)-[r2:Rule]->(f1:Field)-[r3:Correspond]->(f2:Field) WHERE id(rule) = toInteger($ruleId)" +
       " WITH r1, r2, r3, rule, f1, f2" +
       " MATCH (rule)-[r4:Rule]->(f2)"+
       // create a container as Traductor bind to the english and the french nodes
       " DELETE r1, r2, r3, r4, rule, f1, f2"
       ,{"ruleId": req.body.ruleId}
   )
   .then((data)=>{
      return data;
   })
   .then((data)=>{
      res.status(200).json({data: data});
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
exports.update_rule_field = (req, res)=>{
   // Check if data are conform
   if (!req.body.accountId) return res.status(400).json({error: "request error accountId"});
   if (!req.body.fieldId) return res.status(400).json({error: "request error fieldId"});
   if (!req.body.fieldValue) return res.status(400).json({error: "request error fieldValue"});

   session.run(
       " MATCH (field:Field) WHERE id(field) = toInteger($fieldId)"
       +" SET field.value = $fieldValue"
       +" RETURN {fieldId: id(field), value: field.value}"
       ,{"fieldId": req.body.fieldId, "fieldValue":req.body.fieldValue}
   )
   .then((data)=>{
      return data;
   })
   .then((data)=>{
      res.status(200).json({data: data});
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
