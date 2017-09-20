'use-strict';
// const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
let tokenGen = require('../services/token').generate;
let parser = require('../services/parser');
let schema = require('../models/schema');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.course_wait_recall = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let query = `
    match (a:Account)-[]->(b:Board_Activity)
    where id(a) = ${user_id}
    with b, b.course_wait_recall as list, count(b.course_wait_recall) as nb
    call apoc.do.when(
      nb >= 1,
      "match (c:Container) where id(c) in list
       return {id:id(c), value:c.value, schema: c.schema, label:labels(c)}",
      "return {message: 'No course wait for !'}",
    {list:list, nb:nb}) yield value
    return value
  `;
  session
  .readTransaction(tx => tx.run(query, {}))
  // .then( data => { return parser.dataMapper(data); })
  .then( data => {
    return data.records.map(x => {
      f = x._fields[0][Object.keys(x._fields[0])];
      if( f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity;
      };
      return f;
    });
  })
  .then( data => {
    res.status(200).json({
      token: tokenGen(user_id),
      data: data
    });
  })
  .catch( error => {
    console.log(error);
    res.status(400).json({message: 'Error on the /api/course_wait_recall'})
  });
};


module.exports.course_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  query1 = `
  match (a:Account)-[l]->(m:Recall_Memory)
  where id(a)=181
  with m, extract(x in collect(m) |
  filter(y in labels(m) where y <> 'Recall_Memory')
) as pre_list
  return collect( distinct head(head(pre_list)) )as list
  `;

  session.readTransaction(tx=>tx.run(query1))
  .then( data => {
    let parse = data.records[0]._fields[0];
    return parse.map( x => {
      return Number(x.match(/([0-9]{1,})/g)[0]);
    });
  })
  .then( data => {
    console.log(data);
    query2 = `
    match (c:Course) where id(c) in [${data}]
    return {id: id(c), value: c.value, schema: c.schema, label: labels(c)}
    `;
    return session.readTransaction(tx => tx.run(query2));
  })
  .then( data => {
    return data.records.map( x => {
      let f = x._fields[0];
      if( f.id && f.id.low){
        f.id = f.id.low;
      }else if (f.identity) {
        f.id = f.identity.low;
        delete f.identity;
      }
      return f;
    });
  })
  .then( data =>{ res.status(200).json({data:data}); })
  .catch( error => {
    console.log(error);
    res.status(400).json({
      message: 'Error on the /game_course_recallable',
      error: error
    });
  });
};


module.exports.game_timer = (req, res, next)=>{
    let user_id = req.decoded.user_id;
    let session = driver.session();
    let today = new Date().getTime();

    let queryOne =`
       match (a:Account)-[:Linked]->(r:Recall_Memory)
       where id(a) = ${user_id} and r.nextDate <= ${today}
       with count(r)as num
       call apoc.do.when(
          num>=1,
          "match (a:Account)-[:Linked]->(r:Recall_Memory)
              where id(a) = $user_id and r.nextDate <= $today
              with head(collect(r)) as re
              match (x) where id(x)= re.startNode
              match (y) where id(y)= re.endNode
              return {startNode: x, endNode:y, recall_id:id(re)} as true ",
          "return {message: 'No more question'} as false",
          {user_id: ${user_id}, today: ${today} }
       ) yield value
      return value
    `;

    let miniMap = (labels)=>{
      let l = ['Container', 'Property'];
      labels.map(x => {
        l.indexOf(x) >= 0 ? labels.splice(labels.indexOf(x), 1) : null
      });
      return labels;
    };

    session.readTransaction(tx => tx.run(queryOne, {}))
    .then( data => {
      // let f = data.records[0]._fields[0];
      let d;
      if(d = data.records[0]._fields[0].true){
        d.recall_id = d.recall_id.low;
        d.startNode.id = d.startNode.identity.low;
        delete d.startNode.identity;
        d.endNode.id = d.endNode.identity.low;
        delete d.endNode.identity;
        d.startNode.labels = miniMap(d.startNode.labels);
        d.endNode.labels = miniMap(d.endNode.labels);
      }else{
        d = data.records[0]._fields[0].false
      };
      return d;
    })
    .then( data => {
      console.log(data)
        if (data.message){
          console.log('data.message', data.message)
          res.status(204).json({message: 'No more content'});
        }else {
          console.log('toto ben')
          res.status(200).json({
            token: tokenGen(user_id),
            data:data
          });
        }
    })
    .catch((error)=>{
      console.log(error)
       res.status(404).json({error: error, message:'error basic error'});
    });

};


module.exports.get_all_course = (req, res, next)=>{
  res.status(200).json({message:"come from server"});
};


module.exports.new_result = (req, res, next)=>{
  // console.log(req)
  res.status(200).json({message:'test of new_result is done', data: req.body});
};


module.exports.toggle_out_from_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.body[0];
  let session = driver.session();

  let query = `
    match(a:Account)-[l]->(m:c${_.id})
    where id(a) = ${user_id}
    delete l, m
  `;
  let query2 = `
    match (a:Account)-[]->(b:Board_Activity)
    where id(a)=${user_id}
    set b.course_wait_recall = b.course_wait_recall + ${_.id}
  `;


  session.readTransaction(tx => tx.run(query))
  .then( ()=>{
    return session.readTransaction(tx=>tx.run(query2));
  })
  .then(()=>{
    res.status(200).json({message:'Done !', token: tokenGen(user_id)})})
  .catch( error => {
    console.log(error);
    res.status(400).json({
      message: 'Error on the /game_toggle_out_from_recallable',
      error:error
    });
  });
};
module.exports.toggle_in_to_recallable = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let _ = req.body[0];
  console.log('==============================================================')
  console.log(_)
  let today = new Date().getTime();
  let recallList = [];
  let recallTarget = schema.labelRecallableTargetList();
  let query1 = query2 = query2First = query2Last = query3 = '';
  // For each property of the schema found, the second iteration allow to
  // select the property whose match for create the list of the recallable relations
  let mapper = (nodeList)=>{
    let endNode;
    nodeList.map( p => {
      recallTarget[`${p.label}`].map( l => {
        if(endNode = parser.includerReturnId(nodeList, 'label', l)){
          query2First += ` create (r${p.id}${endNode}:Recall_Memory:c${_.id}{
            level:1, nextDate: ${today}, startNode: ${p.id}, endNode: ${endNode}
          })`;
          query2Last += ` create (a)-[:Linked]->(r${p.id}${endNode})`;
        };
      });
    });
    query2 = query2First + query2Last;
  };


  // query1 = `
  // match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)
  //   where id(a)=${user_id} and id(c)=${_.id}
  //   with a, c,
  //   	extract( p in  collect(pp) |
  //     	{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}
  //     ) as newList
  //   return newList
  // `;
  query1 = `
  match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)
    where id(a)=${user_id} and id(c)=${_.id}
    with a, c, collect(pp) as totallist
      with a, c, totallist, filter( p in totallist where size(p.value)>=1 ) as cleanlist
    	with a, c, cleanlist, extract( p in  cleanlist |
      	{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}
      ) as newList
    return newList
  `;
  query2First = `match (a:Account) where id(a)=${user_id}`;
  query2Last = ``;
  query3 = `
  match (a:Account)-[]->(b:Board_Activity)
  where id(a)=${user_id}
  set b.course_wait_recall = filter(x in b.course_wait_recall where x <> ${_.id})
  `;


  session.readTransaction(tx=>tx.run(query1))
  .then( data => { return parser.dataMapper(data); })
  .then( data => {
    data.push({
      "label": "Course",
      "id": _.id
    });
    mapper(data);
    return data;
  })
  .then(data => { return session.readTransaction(tx=>tx.run(query2)); })
  .then( () => {
    return session.readTransaction(tx=>tx.run(query3));
  })
  .then(()=>{ res.status(200).json({token:tokenGen(user_id), message:'Done !'})})
  .catch( error => {
    console.log(error);
      res.status(403).json({
        error:error,
        message: 'ERROR on game toggle_out_from_recallable'
    });
  });

};


module.exports.answering = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let session = driver.session();
  let _ = req.body[0];
  let today = new Date().getTime();
  let tomorrow = today + 1000 + 60 + 60 + 24;

  console.log("req.body",_)

  let query =`
    match (a:Account)-[:Linked]->(r:Recall_Memory)
    where id(a)=${user_id} and id(r)= ${_.recall_id}
  `;
  if(_.bool){ // if bool is "TRUE"
  console.log('check bool is true')
  console.log(_.bool)
    query += `
      set r.nextDate = ${today} + (r.level * 1000 * 60 * 60 * 24)
      set r.level = r.level * 2
     `
  }else{ // else it's "FALSE"
  console.log('check bool is false')
  console.log(_.bool)
    query += `
    set r.nextDate = ${tomorrow}
    set r.level = 1
    `;
  };

  session.readTransaction(tx => tx.run(query))
  .then( () => {
    res.status(200).json({
      token: tokenGen(user_id)
    });
  })
  .catch((error)=>{
    console.log(error)
     res.status(404).json({error: error, message:'error basic error'});
  });
};
