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
// const parseInt = (obj)=>{
//   return new Promise((resolve)=>{
//     let promises = [];
//
//     for( let k in obj){
//       if(obj instanceof Array){
//         obj.map(x=>{  promises.push( parseInt(x) )  });
//       }else if(obj[k] instanceof Array && typeof obj[k][0] == 'object'){
//         promises.push( parseInt(obj[k]) );
//       }else if(typeof obj[k] == 'object' && obj[k].hasOwnProperty("low")){
//         promises.push(Promise.resolve(obj[k] = obj[k].low) )
//       }else if(typeof obj[k] == 'object'){
//         promises.push( parseInt(obj[k]) );
//       }
//     }
//     Promise.all(promises).then(()=>{
//       resolve(obj);
//     })
//   })
// }
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

  let session = driver.session()
  let tx = session.beginTransaction();
  let user_id = 0;
  let ps = {container_id:309 , label:"Definition" ,value:"hello world", id:313};
  let now = new Date().getTime();

  let params = {
    "psvalue": ps.value,
    "reqbody": req.body.value
  }
  let query = `
  create (n1:Test{psvalue:'{psvalue}'})
  create (n2:Test{reqbody:{reqbody}})
  return n1, n2
  `
  console.log(q)
  // res.status(200).json({mess:q})

  tx.run(query, params)
  .then( data => {
    console.log(data.records[0]._fields)
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
  .then( data => { return utils.parseInt(data) })
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

  let user_id = 0;
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


  let nodes = relations = nodeFields = relationFields = [];
  let nodesCsv;
  tx.run(q)
  .then( data => { return data.records[0]._fields })
  .then( data => { return utils.parseInt(data) })
  .then( data => { return sortLabel(data)})
  .then( data => {
    function cbe(err){ console.log(err) };
    recoverField(data[0]).then(nf =>{
      fs.writeFile('backupNodes.csv',
      json2csv({ data:data[0], fields: nf}), cbe )
    })
    recoverField(data[1]).then(rf=>{
      fs.writeFile('backupRelations.csv',
      json2csv({ data:data[1], fields:rf}), cbe )
    })
  })
  .then( data => {
    nodes = data[0]
    relations = data[1]
  })
  .then( () => { return recoverField(nodes) })
  .then( data => { nodeFields = data; return;  })
  .then( () => { return recoverField(relations) })
  .then( data => { relationFields = data; return;  })
  .then( () => {
    nodesCsv = json2csv({data:nodes, fields:nodeFields});
    console.log(nodesCsv)
    fs.writeFile('myTest.csv', nodesCsv, (err)=>{
      console.log(err)
      return
    })
  })
  .then( data => {
    commit(res, tx, 200, data)
  })
  .then( () => {
    commit(res, tx, 200, nodeFields)
  })
  .catch( err => {console.log(err);  crash(res, tx, 400, err)})


};
