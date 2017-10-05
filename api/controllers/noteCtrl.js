'use-strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

const secret = require('../../config/tokenSecret').secret;

let tokenGen = require('../services/token.service');
let labels_service = require('../services/labels.service');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports.create_note = (req, res, next)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = req.decoded.user_id;
  let _ = req.body;


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Container{commitList: [${today}], type: 'note'})
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
      data: data
    });
  })
  .catch( error => {
    console.log(error);
     res.status(404).json({error: error, message:'error basic error'});
  });
};

module.exports.create_empty_note = (req, res, next)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = req.decoded.user_id;
  // let _ = req.body;


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Container{commitList: [${today}], type: 'note'})
     create (t:Property:Title {value:'Undefined'})
     create (u:Property:Undefined {value:''})
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
      data: data
    });
  })
  .catch( error => {
    console.log(error);
     res.status(404).json({error: error, message:'error basic error'});
  });
};

module.exports.get_label = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let u = labels_service.get_sub_label('Property');
  console.log(u)
  res.status(200).json({
    token: tokenGen(user_id),
    data: u
  });
  // let session = driver.session();
  // let query = `
  //
  // `;
  //
  //
  // session.readTransaction(tx => tx.run(query))
  // .then( data => {
  //   return data;
  // })
  // .then( data => {
  //   res.status(200).json({
  //     token: tokenGen(user_id),
  //     data: data
  //   });
  // })
  // .catch( error => {
  //   res.status(400).json({
  //     message: 'Error on note_get_label',
  //     error : error
  //   });
  // });
};

module.exports.get_all_note = (req, res, next)=>{
    let user_id = req.decoded.user_id;
    let session = driver.session();
    let query = `
    match (a:Account)-[:Linked]->(n:Container{type:'note'})-[l:Has{commit:last(n.commitList)}]->(x:Property)
       where id(a)= ${user_id}
       return case
          when count(n) >= 1 then {note_id: id(n), title:x.value}
          else {}
       end
    `;
    session.readTransaction(tx => tx.run(query))
    .then((data)=>{
       if(data.records[0]){
          let f = data.records;
          let list = [];
          for (var i = 0; i < f.length; i++) {
             list.push({
                note_id:f[i]._fields[0].note_id.low,
                title:f[i]._fields[0].title
             });
          };
          return list;
       }else {
          return {};
       };
    })
    .then( data => {
      res.status(200).json({
         token:tokenGen(user_id),
         list: data
      });
    })
    .catch((error)=>{
       console.log(error);
       res.status(400).json({error: error, message:'error basic error'});
    });

}

module.exports.get_note_detail = (req, res, next)=>{
    let session = driver.session();
    let user_id = req.decoded.user_id;
    let _ = req.params;
    let query = `
      match (a:Account)-[l1:Linked]->(n:Container)-[ly:Has{commit:last(n.commitList)}]->(y:Property:Title)-[lx:Has*{commit:last(n.commitList)}]->(x:Property)
      where id(a)= ${user_id} and id(n) = ${_.id}
      with l1, y, x, n
      return
      case
         when count(l1)>=1 then {container:n, title: y, property:collect(x) }
         else {data:{message: 'No access user'}}
      end
    `;
    session.readTransaction(tx=>tx.run(query))
    .then((data)=>{
      let f = data.records[0]._fields[0];
      return {
        detail: f.property.map(x=>{
           return {
              id: x.identity.low,
              value:x.properties.value,
              labels:x.labels.filter( p => { return p != 'Property' })[0]
           };
        }),
        container: {
          id: f.container.identity.low,
          // NEED commit list on the correct format date
        },
        title: {
          id: f.title.identity.low,
          value: f.title.properties.value,
          labels:f.title.labels.filter( p => { return p != 'Property' })[0]
        }
      };
    })
    .then( data => {
      // console.log(data.title)
        res.status(200).json({
           token:tokenGen(user_id),
           data:data
        });
    })
    .catch((error)=>{
       res.status(400).json({error: error, message:'error basic error'});
    });
};

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

module.exports.update_value = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default

  let session = driver.session();
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let today = new Date().getTime();

  let commit = req.body.commit || null;
  let properties = [];
  let update;
  let Q3 = ``,
      Q3_1 = `match (c) where id(c)=${_.container_id}`,
      Q3_2 = ` create (c)`;

  let Q1 = `
    match (a:Account)-[l:Linked]->(c:Container)-[be:Has*]->(p:Property)
    where id(a) = ${user_id} and id(c) = ${_.container_id}
    with count(l) as count, c, p
    call apoc.do.when(count <> 0,
      "match (c)-[:Has*{commit:com}]->(p:Property) where c=co return collect(p) as list",
      "", {co:c, com:last(c.commitList)}) yield value
    return value.list
  `;

  let Q2 = `
    match(c:Container) where id(c) = ${_.container_id}
    set c.commitList =  c.commitList + ${today}
    create (new:Property:${_.labels}{value:'${_.value}'}) return new
  `;
  session.readTransaction(tx=>tx.run(Q1))
  .then((data)=>{
      if(data.records.length){
        return data.records[0]._fields[0];
      }else {
        res.status(403).json({message: 'no access'})
      };
  })
  .then( data =>{
    // save the properties for next
    properties = data;
    // Create the update and return it
    return session.readTransaction(tx=>tx.run(Q2))
  })
  .then( data => {
    update = data.records[0]._fields[0];
    // Iterate the properties list to create the 3rd query
    properties.map(x => {
      // replace by the last update value
      let i = x.identity.low;
      let u = update.identity.low;
      if( i == _.id){
        Q3_1 += ` match (x${u}) where id(x${u})=${u}`;
        Q3_2 += `-[:Has{commit:${today}}]->(x${u})`;
      }else{
        Q3_1 += ` match (x${i}) where id(x${i})=${i}`;
        Q3_2 += `-[:Has{commit:${today}}]->(x${i})`;
      };
    });
    return;
  })
  .then( () => {
    Q3 = Q3_1 + Q3_2;
    return session.readTransaction(tx=>tx.run(Q3))
  })
  .then( () => {
    res.status(200).json({
       token:tokenGen(user_id),
      //  list: data,
       now: today

    });
  })
  .catch((error)=>{
     console.log(error);
     res.status(400).json({error: error, message:'error basic error'});
  });
};

module.exports.add_property = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default
  let session = driver.session();
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let today = new Date().getTime();


  let Q1 = `
     match (a:Account)-[l:Linked]->(c:Container)
     where id(a) = ${user_id} and id(c) = ${_.container_id}
     with count(l) as count, c
     call apoc.do.when(
        count <> 0,
        "match (c:Container)-[:Has{commit:com}]->(t:Title)"+
        "-[:Has*{commit:com}]->(p:Property) where c=co return collect(p) as list",
        "", {com:last(c.commitList), co:c}
     ) yield value
     return value
  `;
  let Q2_1 =
    `match (c:Container)-[:Has{commit:last(c.commitList)}]->(t:Title)
    where id(c)= ${_.container_id}`;
  let Q2_2 =
    ` set c.commitList = c.commitList + ${today}
    create (new:Property:Undefined{value:''})
    create (c)-[:Has{commit:${today}}]->(t)-[:Has{commit:${today}}]->(new)`;
  let Q2_3 = ` return new`;

  session.readTransaction(tx => tx.run(Q1))
  .then( data => {
    return data.records[0]._fields[0].list;
  })
  .then( data => {
    data.map(x => {
      let i = x.identity.low;
      Q2_1 += ` match (x${i}) where id(x${i}) = ${i}`;
      Q2_2 += `-[:Has{commit:${today}}]->(x${i})`
    });
    return session.readTransaction(tx=>tx.run(Q2_1+Q2_2+Q2_3));
  })
  .then( data => {
    let f = data.records[0]._fields[0];
    return {
      id: f.identity.low,
      value: '',
      labels: f.labels.filter(p => { return p != 'Property'})[0]
    };
  })
  .then( data => {
     res.status(200).json({
        token:tokenGen(user_id),
        data:data
     });
  })
  .catch(function (error) {
    console.log(error);
    res.status(400).json({error:error});
  });
};

module.exports.delete_container = (req, res, next)=>{
  let user_id = req.decoded.user_id;
  let _ = req.params;
  let session = driver.session();


  let query = `
    match (a:Account)-[l:Linked*]->(c:Container)-[o*]->(p)
    where id(a) = ${user_id} and id(c) = ${_.id}
    with distinct last(l) as link, o, c, p
    with collect(last(o)) as olist, link, c, p
    foreach(x in olist | delete x )
    delete link, c, p
  `;


  session
  .readTransaction(tx => tx.run(query))
  .then( () => {
    res.status(200).json({message:"deleted!"})
  })
  .catch( error => {
    console.log(error);
    res.status(400).json({error:error});
  });
};

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
};

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
