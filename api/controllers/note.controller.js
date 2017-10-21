'use-strict';
let driver = require('../../config/driver');
let tokenGen = require('../services/token.service');
let labelService = require('../services/label.service');
let utils = require('../services/utility.service');


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


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Container{commitList: [${today}], type: 'note'})
     create (t:Property:Title {value:'Undefined'})
     create (u:Property:Undefined {value:''})
     create (a)-[:Linked]->(n)-[:Has{commit:${today}}]->(t)-[:Has{commit:${today}}]->(u)
     return {container_id: id(n), title_id:id(t), first_property_id: id(u)}
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
  labelService.getPropertyLabel().then( list => {
    console.log('list', list)
    res.status(200).json({
      token: tokenGen(user_id),
      exp: new Date().getTime(),
      data: list
    });

  });
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
      match (a:Account)-[l1:Linked*]->(n:Container)-[ly:Has{commit:last(n.commitList)}]->(y:Property:Title)-[lx:Has*{commit:last(n.commitList)}]->(x:Property)
      where id(a)= ${user_id} and id(n) = ${_.id}
      with l1, y, x, n
      return
      case
         when count(l1)>=1 then {container:n, title: y, property:collect(x) }
         else {data:{message: 'No access user'}}
      end
    `;
    session.readTransaction(tx=>tx.run(query))
    .then( data => {
      let r = data.records;
      if(r.length && r[0]._fields[0].length){
        return r[0]._fields[0];
      }else if(r.length && r[0]._fields.length){
        return r[0]._fields;
      }else{
        throw {status: 403, err: 'no user access'}
      }
    })
    .then(data =>{
      return {
        main: data[0].property.map(x=>{
           return {
              id: x.identity.low,
              value:x.properties.value,
              label:x.labels.filter( p => { return p != 'Property' })[0]
           };
        }),
        container: {
          id: data[0].container.identity.low,
          // NEED commit list on the correct format date
        },
        title: {
          id: data[0].title.identity.low,
          value: data[0].title.properties.value,
          label:data[0].title.labels.filter( p => { return p != 'Property' })[0]
        }
      };
    })
    .then( data => {
      res.status(200).json({
         token:tokenGen(user_id),
         exp: new Date().getTime(),
         data:data
      });
    })
    .catch( err =>{
       console.log(err);
       let status = err.status || 400;
       let e = err.err || err;
       res.status(status).json(e);
    });
};

// module.exports.update_property = (req, res, next)=>{
//    if(req.decoded && req.decoded.user_id){
//       let user_id = req.decoded.user_id;
//       let _ = req.body;
//       let date = new Date().getTime();
//       const session = driver.session();
//       const readA = `
//          match (a:Account)-[l:Linked]->(n:Note)
//          where id(a) = ${user_id} and id(n) = ${_.note_id}
//          return count(l)
//       `;
//       const readB = `
//          match (n:Note)
//          where id(n) = ${_.note_id}
//          match (n)-[l:Linked*{commitNbr:last(n.commitList)}]->(p:Property)
//          set n.commitList = n.commitList + ${date}
//          return extract(x in collect(p)| id(x))
//       `;
//       const readC = `
//          create (new:Property:Undefined{value:"${_.value}"})
//          return id(new)
//       `;
//
//       session
//       .readTransaction(tx => tx.run(readA, {}))
//       .then(result => {
//          if(result.records[0].get(0).low == 1){
//
//             session
//             .readTransaction(tx => tx.run(readB, {}))
//             .then(result2 => {
//                let data2 = result2.records[0].get(0).map(x=>{
//                   return x.low;
//                });
//
//                session
//                .readTransaction(tx => tx.run(readC, {}))
//                .then((result3) => {
//                   let newOne = result3.records[0].get(0).low;
//                   console.log(result3.records[0].get(0).low)
//                   let readD1 = `match (note) where id(note) = ${_.note_id}`;
//                   let readD2 = ` create (note)`;
//                   let order = 1;
//                   data2.forEach(x => {
//                      console.log(x);
//                      if(x == _.excluded_id){
//                         readD1 = readD1 + ` match (x${newOne}) where id(x${newOne}) = ${newOne}`;
//                         readD2 = readD2 + `-[l${newOne}:Linked{commitNbr:${date}, orderNbr:${order}}]->(x${newOne})`;
//                      }else {
//                         readD1 = readD1 + ` match (x${x}) where id(x${x}) = ${x}`;
//                         readD2 = readD2 + `-[l${x}:Linked{commitNbr:${date}, orderNbr:${order}}]->(x${x})`;
//                      }
//                      order++;
//                   });
//                   const readD = readD1 + readD2;
//                   console.log(readD);
//
//                   session
//                   .readTransaction(tx => tx.run(readD, {}))
//                   .then(() => {
//                      let token = jwt.sign({
//                         exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
//                         user_id:user_id
//                      },secret);
//                      console.log('finish');
//                      res.status(200).json({
//                         token:token,
//                         message:'finish'
//                      });
//                   })
//                   .catch(function (error) {
//                      console.log("========================== CHECK 4 ERROR ==============");
//                     console.log(error);
//                     res.status(200).json({error:error});
//                   });
//
//                })
//                .catch(function (error) {
//                   console.log("========================== CHECK 3 ERROR ==============");
//                  console.log(error);
//                  res.status(200).json({error:error});
//                });
//             })
//             .catch(function (error) {
//                console.log("========================== CHECK 2 ERROR ==============");
//               console.log(error);
//               res.status(200).json({error:error});
//             });
//          }else {
//             console.log('no access user');
//             session.close();
//             res.status(200).json({error:"No access user"});
//          }
//       })
//       .catch(function (error) {
//          console.log("========================== CHECK 1 ERROR ==============");
//         console.log(error);
//         res.status(200).json({error:error});
//       });
//    }
// }

module.exports.update_value = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default

  let session = driver.session();
  let user_id = req.decoded.user_id;
  let _ = req.body;
  let today = new Date().getTime();

  let commit = req.body.commit || null;
  let properties = [];
  let updates;
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
    create (new:Property:${_.label}{value:'${_.value}'}) return new
  `;


  // CHECKING DATA
  utils.num(_.container_id)
  .then(()=>{ return utils.str(_.value)})
  .then(()=>{ return labelService.isPropertyLabel(_.label)})
  // Q1 => check user access and return properties list of the container
  // including the title
  .then(()=>{
    console.log('Q1', Q1)
    return session.readTransaction(tx=>tx.run(Q1)) })
  .then((data)=>{
    console.log('result of Q1', data.records[0]._fields[0])
    let r = data.records;
    if(r.length && r[0]._fields[0].length){
      return r[0]._fields[0];
    }else if(r.length && r[0]._fields.length){
      return r[0]._fields;
    }else {
      throw {status: 403, err: 'no user access'}
    };
  })
  .then( data =>{
    // save the properties for after
    properties = data;
    // Create the update and return it
    console.log('Q2', Q2)
    return session.readTransaction(tx=>tx.run(Q2))
  })
  .then( data => {
    console.log('result of Q2', data.records[0]._fields)
    updates = data.records[0]._fields[0];
    // Iterate the properties list to create the 3rd query
    properties.map(x => {
      // replace by the last update value
      let i = x.identity.low;
      let u = updates.identity.low;
      if( i == _.id){
        Q3_1 += ` match (x${u}) where id(x${u})=${u}`;
        Q3_2 += `-[:Has{commit:${today}}]->(x${u})`;
      }else{
        Q3_1 += ` match (x${i}) where id(x${i})=${i}`;
        Q3_2 += `-[:Has{commit:${today}}]->(x${i})`;
      };
      Q3_3 = ` return x${u}`
    });
    return;
  })
  .then( () => {
    console.log('***************************************')
    console.log(Q3_1+Q3_2+Q3_3)
    return session.readTransaction(tx=>tx.run(Q3_1+Q3_2+Q3_3))
  })
  .then((data)=>{
    let r = data.records;
    if(r.length && r[0]._fields[0].length){
      console.log('result of Q3', r[0]._fields[0])
      return r[0]._fields[0];
    }else if(r.length && r[0]._fields.length){
      console.log('result of Q3', r[0]._fields)
      return r[0]._fields;
    }else {
      throw {status: 403, err: 'no data found'}
    };
  })
  .then( data => {
    console.log('at the end', data)
    let f = data[0];
    f.id = f.identity.low;
    f.label = f.labels.filter(l => { return l != 'Property' })[0];
    f.value = f.properties.value;
    delete f.identity;
    delete f.properties;
    delete f.labels;
    return f;
  })
  .then( data => {
    res.status(200).json({
       token:tokenGen(user_id),
       exp: new Date().getTime(),
       data: data
    });
  })
  .catch((err)=>{
     console.log(err);
     let status = err.status || 400;
     let e = err.err || err;
     res.status(status).json(e);
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
  // Till it is difficult to extract the date time, the commit will be the
  // last one by default

  // This method doesn't delete any node, but create relationship with new
  // commit without the property to delete

  let user_id = req.decoded.user_id;
  let session = driver.session();
  let _ = req.params
  let now = new Date().getTime();
  let commit = _.commit || null;

  // this query check the user access and return the list of
  let Q1 = `
    match (a:Account)-[l:Linked*]->(c:Container)
    where id(a) = ${user_id} and id(c) = ${_.container_id}
    with count(l) as count, c, last(c.commitList) as com
    call apoc.do.when(count <> 0,
    "match(c)-[:Has*{commit:com}]->(p) where c = co return collect(p) as list"
    ,"",{co:c, com:com}) yield value
    return value
  `;

  let Q2_1 = ` match(c) where id(c) = ${_.container_id}`;
  let Q2_2 = ` create (c)`;
  let Q2_3 = ` set c.commitList = c.commitList + ${now}`;

  session.readTransaction(tx => tx.run(Q1))
  .then( data => {
    return data.records[0]._fields[0].list;
  })
  .then( data => {
    // preparation of Q2
    data.map(p => {
      let i = p.identity.low;
      console.log(p.labels.filter(l=>{
        console.log(l)
        l == l
      }))
      if(p.labels.filter(l=>{ return l != 'Property'})[0] == 'Title'){
        Q2_1 += ` match (t:Title) where id(t)=${i}`;
        Q2_2 += `-[:Has{commit:${now}}]->(t)`;
      }else if(i != _.property_id){
        Q2_1 += ` match (x${i}:Property) where id(x${i})=${i}`;
        Q2_2 += `-[:Has{commit:${now}}]->(x${i})`;
      }
    });
  })
  .then( data => {
    return session.readTransaction(tx=>tx.run(Q2_1+Q2_2+Q2_3));
  })
  .then( () => {
    res.status(200).json({
      token: tokenGen(user_id),
      message: 'deleted !'
    })
  })
  .catch( error => {
    console.log(error);
    res.status(400).json({error:error});
  });
};

module.exports.drop_property = (req, res, next)=>{
  // Since it ain't possible to parse the commit, it'll be the last by default
    let user_id = req.decoded.user_id;
    let _ = req.body;
    let now = new Date().getTime();
    let session = driver.session();

    console.log('//////////////////// ', req.body)

    let last_com = Number;

    let Q1 = `
       match (a:Account)-[l:Linked]->(n:Container)
       where id(a) = ${user_id} and id(n) = ${_.container_id}
       return count(l)
    `;

    let Q2 = `
       match (n:Container)-[l:Has*{commit:last(n.commitList)}]->(p:Property)
       where id(n) = ${_.container_id}
       return collect(p)
    `;

    let Q3_1 = `
      match (n:Container) where id(n) = ${_.container_id}
    `;
    let Q3_2 = ` create (n)`;
    let Q3_3 = ` set n.commitList = n.commitList + ${now}`;

    session.readTransaction(tx => tx.run(Q1))
    .then( data => {
      console.log('============================= CHECK 1')
      // Check the user access to the container
      if(data.records[0].get(0).low) {
        console.log('============================= CHECK 1.1')
        return;
      }else{
        console.log('============================= CHECK 1.2')
        res.status(400).json({message: 'no access user'})
      };
    })
    .then( () => {
      console.log('============================= CHECK 2')
      // Get the property list
      return session.readTransaction(tx=>tx.run(Q2))
    })
    .then( data => {
      console.log('============================= CHECK 3')
      // Add the title to the query
      let f = data.records[0]._fields[0];
      let j = 0;
      let titleIndex;
      f.map(x=>{
        x.labels.filter(x => x != 'Property')[0] == 'Title' ? titleIndex = j : null
        j++;
      });
      let title = f.splice(titleIndex, 1);
      let i = title[0].identity.low;
      Q3_1 += ` match (x${i}:Property) where id(x${i}) = ${i}`;
      Q3_2 += `-[:Has{commit:${now}}]->(x${i})`;
      return f;
    })
    .then( f => {
      console.log('============================= CHECK 4')
      console.log('**************************')
      console.log(req.body)
      console.log('**************************')
      f.map(x => { console.log(x) })

      // Check the limit up and down
      if (_.direction == 'up' && f[0].identity.low == _.property_id){
        console.log('============================= CHECK 4.1')
        res.status(400).json({message: 'Unauthorized query'})
      }else if(_.direction == 'down' && f.reverse()[0].identity.low == _.property_id){
        console.log('============================= CHECK 4.2')
        res.status(400).json({message: 'Unauthorized query'})
      };
      // Because the previous conditionnal has not just check the reverse,
      // but modified it todrop, so we reverse again
      if(_.direction == 'down'){
        console.log('============================= CHECK 4.3')
        f.reverse();
      };
      return f;
    })
    .then( f => {
      console.log('============================= CHECK 5')
      // Finalisation of the query
      let todrop;
      let previous;
      f.map( x => {
        console.log('===========', x)
        let i = x.identity.low;
        if(i == _.property_id && _.direction == 'down'){
          console.log('============================= CHECK 5.1')
          todrop = i;
        }else if(i == _.property_id && _.direction == 'up'){
          console.log('============================= CHECK 5.2')
          Q3_1 += `
          match (x${i}:Property) where id(x${i}) = ${i}
          match (x${previous}:Property) where id(x${previous}) = ${previous}`;
          Q3_2 += `-[:Has{commit:${now}}]->(x${i})-[:Has{commit:${now}}]->(x${previous})`;
          previous = 0;
        }else if(previous){
          console.log('============================= CHECK 5.3')
          Q3_1 += ` match (x${previous}:Property) where id(x${previous}) = ${previous}`;
          Q3_2 += `-[:Has{commit:${now}}]->(x${previous})`;
          previous = i;
        }else if(todrop){
          console.log('============================= CHECK 5.4')
          Q3_1 += `
          match (x${i}:Property) where id(x${i}) = ${i}
          match (x${todrop}:Property) where id(x${todrop}) = ${todrop}`;
          Q3_2 += `-[:Has{commit:${now}}]->(x${i})-[:Has{commit:${now}}]->(x${todrop})`;
          todrop = 0;
        }else if(_.direction == 'down'){
          console.log('============================= CHECK 5.5')
          Q3_1 += ` match (x${i}:Property) where id(x${i}) = ${i}`;
          Q3_2 += `-[:Has{commit:${now}}]->(x${i})`;
        }else if(_.direction == 'up'){
          console.log('============================= CHECK 5.6')
          console.log('conditionnal 6')
          previous = i;
        };
      });
      if(_.direction == 'up' && previous){
        console.log('============================= CHECK 5.7')
        Q3_1 += ` match (x${previous}:Property) where id(x${previous}) = ${previous}`;
        Q3_2 += `-[:Has{commit:${now}}]->(x${previous})`;
      };
      return;
    })
    .then( () =>{
      console.log('============================= CHECK 6')
      return session.readTransaction(tx=>tx.run(Q3_1+Q3_2+Q3_3))
      // return;
    })
    .then( ()=>{
      console.log('============================= CHECK 7')
      console.log('==========================')
      console.log(Q3_1)
      console.log('==========================')
      console.log(Q3_2)
      console.log('==========================')
      console.log(Q3_3)
      res.status(200).json({message: 'Done !'})
    })
    .catch(function (error) {
      console.log(error);
      res.status(400).json({error:error});
    });
}
