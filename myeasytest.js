'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');
const utils = require('./api/services/utils.service');

const crash = (response, transaction, status, message, error)=>{
  transaction.rollback();
  response.json({status: status, mess: message, error:error})
}
const commit = (response, transaction, status, data)=>{
  console.log('check commit')
  transaction.commit()
  .subscribe({
    onCompleted: () => {
      // this transaction is now committed
      response.status(status).json({data: data})
    },
    onError: (error) => {
      console.log('error', error);
      crash(response, transaction, 400, "Error on the commit", error);
    }
  });
}
const noLow = (obj)=>{
  return new Promise((resolve)=>{
    for( let v in obj){
      if(obj[v] instanceof Array){
        noLow(obj[v]).then(res => {
          obj[v] = res;
          resolve();
        })
      }else if(typeof obj[v] == 'object' && obj[v].low){
        obj[v] = obj[v].low;
      }else if(typeof obj[v] == 'object'){
        noLow(obj[v]).then(res => {
          obj[v] = res;
          resolve()})
      }
    }
    resolve(obj);
  })
}

const sortLabel = (obj)=>{
  return new Promise((resolve)=>{
    if(obj.labels){
      obj.labels = obj.labels.filter(x => {return x != 'Property'})[0];
    }else{
      for( let v in obj){
        if(typeof obj[v] == 'object'){
          sortLabel(obj[v]).then(res => {
            obj[v] = res;
            resolve()})
        }
      }
    }
    resolve(obj);
  })
}
const json2csv = require('json2csv');
const fs = require('fs');

module.exports.test = (req, res, next)=>{

  let tx = driver.session().beginTransaction();
  let user_id = 560;
  let ps = {container_id:309 , label:"Definition" ,value:"hello world", id:313};
  let now = new Date().getTime();
  let tomorrow = now + (1000 * 60 * 60 * 24* 180)

  let d =
  {
    "node":{
      "id":234,
      "label":"Container",
      "properties": {
        "type":"note",
        "commitList":["1510139053721", "1510139053721"]
      }
    },

  }
  let q = `create(x:${d.label}`
  q+=`{`
  for (let x in d.properties) {
    if (d.properties.hasOwnProperty(x)) {
      if(typeof d.properties[x] == 'string'){
        q+=`,${x}:'${d.properties[x]}'`
      }else if(d.properties[x] instanceof Array){
        // Before set the query, we must set single quote in string
        let arr = []; d.properties[x].map(y => arr.push("'"+y+"'"));
        q+=`,${x}:[${arr}]`;
      }else if(typeof d.properties[x] == 'object'){
        throw {status: 400, mess: 'invalid object properties'}
      }else{
        q+=`,${x}:${d.properties[x]}`
      }
    }
  }
  q+=`}) return x`
  q = q.replace("{,", "{")
  console.log(q)
  tx.run(q)
  .then( data => {
    // return loop();
    console.log(data.records[0]._fields)
    // return deleteCommit()
    return data.records
  })
  .then( data => {
    console.log('check after then')
    commit(res, tx, 200, data)
  })
  .catch( err => {
    console.log(err);
    crash(res, tx, err.status || 400, err.mess, err.err || err)
  });


};

module.exports.test2 = (req, res, next)=>{

  let user_id = 560;
  let session = driver.session();
  let tx = session.beginTransaction();

  // let q = `
  //   match path=(a:Account)-[l*]->(c:Container)
  //   where id(a)=${user_id}
  //   return path
  // `;

  let q = `
    match (a:Account) where id(a)=${user_id}
    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked'})
    yield nodes, relationships
    return nodes, relationships
  `;


  let nodes = relationships = [];
  tx.run(q)
  .then( data => { return data.records[0]._fields })
  .then( data => { return noLow(data) })
  .then( data => { return sortLabel(data)})
  .then( data => {
    nodes = data[0];
    relationships = data[1];
  })
  // .then( () => {
    // let nodesCsv = json2csv(nodes);
    // console.log(nodesCsv)
    // fs.writeFile('myTest.csv', nodesCsv, 'wx', (err)=>{
    //   console.log(err)
    //   return
    // })
  // })
  .then( () => {
    commit(res, tx, 200, nodes)
  })
  .catch( err => {console.log(err);  crash(res, tx, 400, err)})


};

const recoverField = require('./api/services/recoverField.service')
module.exports.test3 = (req, res, next)=>{

  let user_id = 560;
  let session = driver.session();
  let tx = session.beginTransaction();

  let q = `
    match (a:Account) where id(a)=${user_id}
    call apoc.path.subgraphAll(a, {relationshipFilter:'Linked|Has'})
    yield nodes, relationships return nodes, relationships
  `;
  // yield nodes as node, relationships as rel
  // call apoc.export.cypher.data(
  //     node, rel,
  //     "/tmp/friendships.cypher",
  //     {format:'neo4j-shell',cypherFormat:'updateStructure'})
  //     yield file, source, format, nodes, relationships, properties, time
  // return file

  let nodes = relationships = nodeFields = relationFields = [];
  let nodesCsv;
  tx.run(q)
  // .then( data => { return data.records[0]._fields })
  // .then( data => { return noLow(data) })
  // .then( data => { return sortLabel(data)})
  // .then( data => {
  //   nodes = data[0]
  //   relationships = data[1]
  // })
  // .then( () => {
  //   nodeFields = recoverField(nodes, 'nodes');
  // })
  // .then( () => {
  //   console.log(nodeFields)
  // })
  // .then( () => {
  //   fields = ['identity', 'labels', 'properties'];
  //
  //   nodesCsv = json2csv({nodes, fields});
  //   console.log(nodesCsv)
  //   // fs.writeFile('myTest.csv', nodesCsv, 'wx', (err)=>{
  //   //   console.log(err)
  //   //   return
  //   // })
  // })
  .then( data => {
    commit(res, tx, 200, data)
  })
  // .then( () => {
  //   commit(res, tx, 200, nodeFields)
  // })
  .catch( err => {console.log(err);  crash(res, tx, 400, err)})


};
