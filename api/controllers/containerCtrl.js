'use-strict';
var path = require('path');
var neo4j = require('neo4j-driver').v1;

var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

exports.add_first_branch = (req, res, next)=>{ // accountId, content{title}
   var session = driver.session();
   session.run(
      "MATCH (account:Account) WHERE id(account) = toInteger($accountId)"
      +  " CREATE (account)-[:Has]->(course:Course:MainContainer)"
      +  " CREATE (course)-[:Followed_by]->(container:Container)"
      +  " SET container = $content"
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
exports.add_new_branch = (req, res, next)=>{ // accountId, content{title}
   var session = driver.session();
   session.run(
      "MATCH (account:Account)-[:Has]->(course:Course) WHERE id(account) = toInteger($accountId)"
      +  " CREATE (container:Container)"
      +  " MERGE (course)-[:Followed_by]->(container)"
      +  " SET container = $content"
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
exports.add_parent = (req, res, next)=>{  // accountId, containerId, newParentContent{}
   var session = driver.session();
   session.run(
      "MATCH (currentParent)-[currentRelation:Followed_by]->(container:Container)"
      +  " WHERE id(container) = toInteger($containerId)"
      +  " CREATE (currentParent)-[:Followed_by]->(newParent:Container)-[:Followed_by]->(container)"
      +  " SET newParent = $newParentContent"
      +  " DELETE currentRelation"
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
exports.add_child = (req, res, next)=>{ // accountId, containerId, childContent{}
var session = driver.session();
session.run(
   "MATCH (container:Container) "
   +  " WHERE id(container) = toInteger($containerId)"
   +  " CREATE (container)-[:Followed_by]->(child:Container)"
   +  " SET child = $childContent"
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
exports.move_to_new_branch = (req, res, next)=>{ // accountId, containerId
   var session = driver.session();
   session.run(
      "MATCH (currentParent)-[currentRelation:Followed_by]->(container:Container)"
      +  " WHERE id(container) = toInteger($containerId)"
      +  " MATCH (account:Account)-[:Has]->(course:Course)"
      +  " WHERE id(account) = toInteger($accountId)"
      +  " CREATE (course)-[:Followed_by]->(container)"
      +  " DELETE currentRelation"
      +  " WITH container"
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
exports.move_to_existing_branch = (req, res, next)=>{  // accountId, containerId, newParentId
   var session = driver.session();
   session.run(
      "MATCH (currentParent)-[currentRelation:Followed_by]->(container:Container)"
      +  " WHERE id(container) = toInteger($containerId)"
      +  " MATCH (newParent:Container)"
      +  " WHERE id(newParent) = toInteger($newParentId)"
      +  " CREATE (newParent)-[:Followed_by]->(container)"
      +  " DELETE currentRelation"
      +  " WITH container"
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
exports.delete_last_container = (req, res, next)=>{ // accountId, containerId
   var session = driver.session();
   session.run(
      " MATCH (parent)-[relation1:Followed_by]->(container:Container)"
      +  " WHERE id(container) = toInteger($containerId)"
      +  " DELETE relation1, container"
      , req.body
   )
   .then(()=>{
      res.status(200).send('deleted !');
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}

exports.delete_middle_container = (req, res, next)=>{ // accountId, containerId
   var session = driver.session();
   session.run(
      " MATCH (parent)-[relation1:Followed_by]->(container:Container)-[relation2:Followed_by]->(children:Container)"
      +  " WHERE id(container) = toInteger($containerId)"
      +  " WITH parent, relation1, container, COLLECT(relation2) AS relation2List, COLLECT(children) AS childrenList"
      +  " DELETE relation1"
      +  " WITH parent, container, relation2List, childrenList"
      +  " FOREACH ( rel IN relation2List | DELETE rel )"
      +  " WITH parent, container, childrenList"
      +  " DELETE container"
      +  " WITH parent, childrenList"
      +  " FOREACH( child IN childrenList | CREATE (parent)-[:Followed_by]->(child) )"
      , req.body
   )
   .then(()=>{
      res.status(200).send('deleted !');
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}
exports.detail_container = (req, res, next)=>{ // accountId, containerId
   var session = driver.session();
   console.log(req.headers);
   session.run(
      " MATCH (container:Container)"
      +  " WHERE id(container) = toInteger($containerid)"
      +  " RETURN container"
      , req.headers
   )
   .then((data)=>{
      res.status(200).json(data);
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });
}


// exports.course_list = (req, res)=>{
//    var session = driver.session();
//    session.run(
//       "MATCH (courses:Course)"
//       +" WITH COLLECT(courses) AS courseList"
//       // +" WITH EXTRACT(crs IN courseList |{ name:crs.name, id:id(crs) }) AS extractList"
//       +" RETURN {courseList: courseList}"
//       ,{}
//    )
//    .then((data)=>{
//          // return data.records[0]._fields[0].courseList;
//       let result = [];
//       for (let item of data.records[0]._fields[0].courseList){
//          result.push({name:item.properties.name, id:item.identity.low});
//       }
//       return result;
//    })
//    .then((data)=>{
//       res.status(200).json({data: data});
//    })
//    .catch((error)=>{
//       console.log(error);
//       res.status(400).json({error: error});
//    });
//
// }

// var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://localhost:7474');
exports.arborescence_by_main_container = (req, res, next)=>{ // accountId, containerId
   var session = driver.session();
   // db.cypher({
   //     query: 'MATCH (container:Container) return container.title',
   //     params: {
   //       //   personName: 'Bob'
   //     }
   // }, function(err, results){
   //     var result = results[0];
   //     if (err) {
   //         console.error('Error saving new node to database:', err);
   //         res.status(200).json({data: result})
   //     } else {
   //         console.log('Node saved to database with id:', result['n']['_id']);
   //         res.status(400).json({error: err})
   //     }
   // });

   session.run(
      " MATCH (container:Container)"
      +  " RETURN container.title"
      , req.headers
   )
   .then((data)=>{
      var result = [];

      return result;
   })
   .then((data)=>{
      res.status(200).json({data:data});
   })
   .catch((error)=>{
      console.log(error);
      res.status(400).json({error: error});
   });

   // session.run(
   //
   //    //    " MATCH path=(main:MainContainer)-[r1]->()"
   //    // +  " "
   //    // +  " RETURN path"
   //
   //    //    "match p=(m:MainContainer)-[:Followed_by*]->(c:Container) "
   //    // +  "return p "
   //       "match (m) where id(m) = 190"
   //    +  " match p=(x:Container)-[:Followed_by]->(y:Container) "
   //    +  " where (m)-[:Followed_by*]->(x)"
   //    +  " with collect(p) as path, m"
   //    +  " return path, m"
   //
   //
   //    , req.headers
   // )
   // .then((result)=>{
   //    let results = {main:
   //       {
   //          id: result.records[0]._fields[1].identity.low,
   //             labels: result.records[0]._fields[1].labels,
   //             properties: result.records[0]._fields[1].properties,
   //       },
   //       paths: []
   //    };
   //    result.records[0]._fields[0].forEach(function (record) {
   //          results.paths.push({
   //             start : {
   //                id: record.segments[0].start.identity.low,
   //                labels: record.segments[0].start.labels,
   //                properties: record.segments[0].start.properties
   //             },
   //             end : {
   //                id: record.segments[0].end.identity.low,
   //                labels: record.segments[0].end.labels,
   //                properties: record.segments[0].end.properties
   //             },
   //             relation : {
   //                id: record.segments[0].relationship.identity.low,
   //                types: record.segments[0].relationship.type,
   //                properties: record.segments[0].relationship.properties
   //             }
   //          });
   //     });
   //     return results;
   // })
   // .then((results)=>{
   //    res.status(200).json({result: results});
   // })
   // .catch((error)=>{
   //    console.log(error);
   //    res.status(400).json({error: error});
   // });

}
