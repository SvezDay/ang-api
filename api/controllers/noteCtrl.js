'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;
let tokenGen = require('../services/token').generate;

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.create_note = (req, res, next)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = 181;
  let _ = {
    title_value: "Undefined",
    content_value:"The logic of ensemblisime is the rule to follow",
    content_label: "Undefined"
  };


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Note:Container{commitList: [${today}] })
     create (t:Property:Title {value:'${_.title_value}'})
     create (u:Property:${_.content_label}{value:'${_.content_value}'})
     create (a)-[:Linked]->(n)-[:Has{commit:${today}}]->(t)-[:Has{commit:${today}}]->(u)
     return {note_id: id(n), title_id:id(t), first_property_id: id(u)}
  `;


  session.readTransaction(tx => tx.run(query))
  .then( data => {
    let f = data.records[0]._fields[0];
    let l = Object.keys(f);
    l.map(x => {
      f[x].low ? f[x] = f[x].low : null
    });
    return f;
  })
  .then( data =>{
    res.status(200).json({
      token: tokenGen(user_id),
      data: data.records
    });
  })
  .catch( error => {
    console.log(error);
     res.status(404).json({error: error, message:'error basic error'});
  });

};

module.exports.get_all_note = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let query = `
         match (a:Account)-[:Linked]->(n:Note:Container)-[l:Linked{commitNbr:last(n.commitList)}]->(x)
         where id(a)= ${user_id}
         return case
            when count(n) >= 1 then {note_id: id(n), content:x.value}
            else {}
         end

      `;
      driver.session()
      .run(query)
      .then((data)=>{

         let token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
            user_id:user_id
         },secret);

         if(data.records[0]){
            let f = data.records;
            let list = [];
            for (var i = 0; i < f.length; i++) {
               list.push({
                  note_id:f[i]._fields[0].note_id.low,
                  content:f[i]._fields[0].content
               });
            }
            res.status(200).json({
               token:token,
               list: list
            });
         }else {
            res.status(200).json({
               token:token,
               list: {}
            });
         }
      })
      .catch((error)=>{
         console.log(error);
         res.status(404).json({error: error, message:'error basic error'});
      });
   }else {
      res.status(401).json({message: 'Error token params'});
   }

}

module.exports.get_note_detail = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.params;
      let query = `
      match (a:Account)-[l1:Linked]->(n:Note:Container)-[l:Linked*{commitNbr:last(n.commitList)}]->(x:Property)
      where id(a)= ${user_id} and id(n) = ${_.id}
      with l1, x
      return
      case
         when count(l1)>=1 then collect(x)
         else {data:{message: 'No access user'}}
      end
      `;
         //se call apoc.path.spanningTree(n, 'Linked>') yield path
      driver.session()
      .run(query)
      .then((data)=>{
         console.log(data);
         if(data.records && data.records[0]){
            // let d = data.records;
            // let detail = [];
            let d = data.records[0]._fields[0];
            let it = 0;
            let mapped = d.map(x=>{
               it++;
               return {
                  node_id: x.identity.low,
                  value:x.properties.value,
                  labels:x.labels,
                  order:it
               };
            });

            let token = jwt.sign({
               exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
               user_id:user_id
            },secret);
            res.status(200).json({
               token:token,
               // detail: detail
               detail:mapped
            });
         }else {
            res.status(403).json({message: 'No access user'});
         }
      })
      .catch((error)=>{
         res.status(404).json({error: error, message:'error basic error'});
      });
   }else {
      res.status(401).json({message: 'Error token params'});
   }

}

module.exports.update_property = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.body;
      let date = new Date().getTime();
      const session = driver.session();
      const readA = `
         match (a:Account)-[l:Linked]->(n:Note)
         where id(a) = ${user_id} and id(n) = ${_.note_id}
         return count(l)
      `;
      const readB = `
         match (n:Note)
         where id(n) = ${_.note_id}
         match (n)-[l:Linked*{commitNbr:last(n.commitList)}]->(p:Property)
         set n.commitList = n.commitList + ${date}
         return extract(x in collect(p)| id(x))
      `;
      const readC = `
         create (new:Property:Undefined{value:"${_.value}"})
         return id(new)
      `;

      session
      .readTransaction(tx => tx.run(readA, {}))
      .then(result => {
         if(result.records[0].get(0).low == 1){

            session
            .readTransaction(tx => tx.run(readB, {}))
            .then(result2 => {
               let data2 = result2.records[0].get(0).map(x=>{
                  return x.low;
               });

               session
               .readTransaction(tx => tx.run(readC, {}))
               .then((result3) => {
                  let newOne = result3.records[0].get(0).low;
                  console.log(result3.records[0].get(0).low)
                  let readD1 = `match (note) where id(note) = ${_.note_id}`;
                  let readD2 = ` create (note)`;
                  let order = 1;
                  data2.forEach(x => {
                     console.log(x);
                     if(x == _.excluded_id){
                        readD1 = readD1 + ` match (x${newOne}) where id(x${newOne}) = ${newOne}`;
                        readD2 = readD2 + `-[l${newOne}:Linked{commitNbr:${date}, orderNbr:${order}}]->(x${newOne})`;
                     }else {
                        readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
                        readD2 = readD2 + `-[l${x}:Linked{commitNbr:${date}, orderNbr:${order}}]->(x${x})`;
                     }
                     order++;
                  });
                  const readD = readD1 + readD2;
                  console.log(readD);

                  session
                  .readTransaction(tx => tx.run(readD, {}))
                  .then(() => {
                     let token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
                        user_id:user_id
                     },secret);
                     console.log('finish');
                     res.status(200).json({
                        token:token,
                        message:'finish'
                     });
                  })
                  .catch(function (error) {
                     console.log("========================== CHECK 4 ERROR ==============");
                    console.log(error);
                    res.status(200).json({error:error});
                  });

               })
               .catch(function (error) {
                  console.log("========================== CHECK 3 ERROR ==============");
                 console.log(error);
                 res.status(200).json({error:error});
               });
            })
            .catch(function (error) {
               console.log("========================== CHECK 2 ERROR ==============");
              console.log(error);
              res.status(200).json({error:error});
            });
         }else {
            console.log('no access user');
            session.close();
            res.status(200).json({error:"No access user"});
         }
      })
      .catch(function (error) {
         console.log("========================== CHECK 1 ERROR ==============");
        console.log(error);
        res.status(200).json({error:error});
      });
   }
}

module.exports.add_property = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.body;
      let date = new Date().getTime();
      const session = driver.session();
      const readA = `
         match (a:Account)-[l:Linked]->(n:Note)
         where id(a) = ${user_id} and id(n) = ${_.note_id}
         return count(l)
      `;
      const readB = `
         match (n:Note)
         where id(n) = ${_.note_id}
         match (n)-[l:Linked*{commitNbr:last(n.commitList)}]->(p:Property)
         set n.commitList = n.commitList + ${date}
         return extract(x in collect(p)| id(x))
      `;
      const readC = `
         create (new:Property:Undefined{value:"${_.value}"})
         return id(new)
      `;

      session
      .readTransaction(tx => tx.run(readA, {}))
      .then(result => {
         if(result.records[0].get(0).low == 1){

            session
            .readTransaction(tx => tx.run(readB, {}))
            .then(result2 => {
               let data2 = result2.records[0].get(0).map(x=>{
                  return x.low;
               });

               session
               .readTransaction(tx => tx.run(readC, {}))
               .then((result3) => {
                  let newOne = result3.records[0].get(0).low;
                  console.log(result3.records[0].get(0).low)
                  let readD1 = `
                  match (note) where id(note) = ${_.note_id}
                  match (newOne) where id(newOne) = ${newOne}
                  `;
                  let readD2 =
                  ` create (note)-[lnewOne:Linked{commitNbr:${date}, orderNbr:1}]->(newOne)`;
                  let order = 2;
                  data2.forEach(x => {
                     readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
                     readD2 = readD2 + `-[l${x}:Linked{commitNbr:${date}, orderNbr:${order}}]->(x${x})`;
                     order++;
                  });
                  const readD = readD1 + readD2;
                  console.log(readD);

                  session
                  .readTransaction(tx => tx.run(readD, {}))
                  .then(() => {
                     let token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
                        user_id:user_id
                     },secret);
                     res.status(200).json({
                        token:token,
                        message:'finish'
                     });
                  })
                  .catch(function (error) {
                     console.log("========================== CHECK 4 ERROR ==============");
                    console.log(error);
                    res.status(200).json({error:error});
                  });

               })
               .catch(function (error) {
                  console.log("========================== CHECK 3 ERROR ==============");
                 console.log(error);
                 res.status(200).json({error:error});
               });
            })
            .catch(function (error) {
               console.log("========================== CHECK 2 ERROR ==============");
              console.log(error);
              res.status(200).json({error:error});
            });
         }else {
            console.log('no access user');
            session.close();
            res.status(200).json({error:"No access user"});
         }
      })
      .catch(function (error) {
         console.log("========================== CHECK 1 ERROR ==============");
        console.log(error);
        res.status(200).json({error:error});
      });
   }
}
module.exports.delete_property = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.params;
      console.log('=================================================');
      console.log(_);
      let date = new Date().getTime();
      const session = driver.session();
      const readA = `
         match (a:Account)-[l:Linked]->(n:Note)
         where id(a) = ${user_id} and id(n) = ${_.note_id}
         return count(l)
      `;
      const readB = `
         match (n:Note)
         where id(n) = ${_.note_id}
         match (n)-[l:Linked*{commitNbr:last(n.commitList)}]->(p:Property)
         set n.commitList = n.commitList + ${date}
         return extract(x in collect(p)| id(x))
      `;

      session
      .readTransaction(tx => tx.run(readA, {}))
      .then(result => {
         if(result.records[0].get(0).low == 1){

            session
            .readTransaction(tx => tx.run(readB, {}))
            .then(result2 => {
               let data2 = result2.records[0].get(0).map(x=>{
                  return x.low;
               });

               let readD1 = `
               match (note) where id(note) = ${_.note_id}
               `;
               let readD2 =
               ` create (note)`;

               data2.forEach(x => {
                  if(x != _.property_id){
                     readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
                     readD2 = readD2 + `-[l${x}:Linked{commitNbr:${date}}]->(x${x})`;
                  }
               });
               const readD = readD1 + readD2;
               console.log(readD);

               session
               .readTransaction(tx => tx.run(readD, {}))
               .then(() => {
                  let token = jwt.sign({
                     exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
                     user_id:user_id
                  },secret);
                  res.status(200).json({
                     token:token,
                     message:'finish'
                  });
               })
               .catch(function (error) {
                  console.log("========================== CHECK 4 ERROR ==============");
                 console.log(error);
                 res.status(200).json({error:error});
               });

            })
            .catch(function (error) {
               console.log("========================== CHECK 2 ERROR ==============");
              console.log(error);
              res.status(200).json({error:error});
            });
         }else {
            console.log('no access user');
            session.close();
            res.status(200).json({error:"No access user"});
         }
      })
      .catch(function (error) {
         console.log("========================== CHECK 1 ERROR ==============");
        console.log(error);
        res.status(200).json({error:error});
      });
   }
}

module.exports.drop_property = (req, res, next)=>{
   if(req.decoded && req.decoded.user_id){
      let user_id = req.decoded.user_id;
      let _ = req.body;
      let date = new Date().getTime();
      const session = driver.session();
      const readA = `
         match (a:Account)-[l:Linked]->(n:Note)
         where id(a) = ${user_id} and id(n) = ${_.note_id}
         return count(l)
      `;
      const readB = `
         match (n:Note)
         where id(n) = ${_.note_id}
         match (n)-[l:Linked*{commitNbr:last(n.commitList)}]->(p:Property)
         set n.commitList = n.commitList + ${date}
         return extract(x in collect(p)| id(x))
      `;

      session
      .readTransaction(tx => tx.run(readA, {}))
      .then(result => {
         if(result.records[0].get(0).low == 1){

            session
            .readTransaction(tx => tx.run(readB, {}))
            .then(result2 => {
               let data2 = result2.records[0].get(0).map(x=>{
                  return x.low;
               });

               let readD = readD1 = readD2 = "";
               let toDrop = 0;

               transaction = ()=>{
                  session
                  .readTransaction(tx => tx.run(readD, {}))
                  .then(() => {
                     let token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
                        user_id:user_id
                     },secret);
                     console.log('finish');
                     res.status(200).json({
                        token:token,
                        message:'finish'
                     });
                  })
                  .catch(function (error) {
                     console.log("========================== CHECK 4 ERROR ==============");
                    console.log(error);
                    res.status(200).json({error:error});
                  });
               }
               dropUp = ()=>{
                  return new Promise((resolve, reject)=>{
                     // init the query
                     readD2 = ` create`;
                     //So invere order of the list to a drop Up
                     data2.reverse();
                     // Reverse the sens of the request
                     for(let x of data2){
                        if(x == _.property_id){
                           toDrop = _.property_id;
                        }else if(toDrop){
                           readD1 = readD1 +
                              ` match (x${x}) where id(x${x}) = ${x}
                               match (x${toDrop}) where id(x${toDrop}) = ${toDrop}`;
                           readD2 = readD2 +
                              `(x${x})<-[l${x}:Linked{commitNbr:${date}}]-
                              (x${toDrop})<-[l${toDrop}:Linked{commitNbr:${date}}]-`;
                           toDrop = 0;
                        }else{
                           readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
                           readD2 = readD2 + `(x${x})<-[l${x}:Linked{commitNbr:${date}}]-`;
                        };
                     };
                     readD1 = readD1 + ` match (note) where id(note) = ${_.note_id}`;
                     readD2 = readD2 + `(note)`;
                     readD = readD1 + readD2;
                     resolve(readD);
                  })
               }
               dropDown = ()=>{
                  return new Promise((resolve, reject)=>{
                     readD1 = `match (note) where id(note) = ${_.note_id}`;
                     readD2 = ` create (note)`;
                     for(let x of data2){
                        if(x == _.property_id){
                           console.log('CHECK 1');
                           toDrop = _.property_id;
                        }else if(toDrop){
                           console.log('CHECK 2');
                           readD1 = readD1 +
                              ` match (x${x}) where id(x${x}) = ${x}
                              match (x${toDrop}) where id(x${toDrop}) = ${toDrop}`;
                           readD2 = readD2 +
                              `-[l${x}:Linked{commitNbr:${date}}]->(x${x})
                              -[l${toDrop}:Linked{commitNbr:${date}}]->(x${toDrop})`;
                           toDrop = 0;
                        }else{
                           console.log('CHECK 3');
                           readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
                           readD2 = readD2 + `-[l${x}:Linked{commitNbr:${date}}]->(x${x})`;
                        }
                     };
                     readD = readD1 + readD2;
                     resolve(readD);
                  })
               }

               if(_.drop=='up'){
                  dropUp().then( readD =>{
                     transaction(readD);
                  })
               }else{
                  dropDown().then( readD => {
                     transaction(readD);
                  })
               }


            })
            .catch(function (error) {
               console.log("========================== CHECK 2 ERROR ==============");
              console.log(error);
              res.status(200).json({error:error});
            });
         }else {
            console.log('no access user');
            session.close();
            res.status(200).json({error:"No access user"});
         }
      })
      .catch(function (error) {
         console.log("========================== CHECK 1 ERROR ==============");
        console.log(error);
        res.status(200).json({error:error});
      });
   }
}
