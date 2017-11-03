'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');

const crash = (transaction, response,  status, message, error)=>{
  transaction.rollback();
  response.status(status).json({mess: message, error})
}

const commit = (transaction, response, status, user, data)=>{
  transaction.commit()
  .subscribe({
    onCompleted: () => {
      // this transaction is now committed
      response.status(status).json({
        token:tokenGen(user),
        exp: utils.expire(),
        data: data
      })
    },
    onError: (error) => {
      console.log('error', error);
      crash(transaction, response, 400, "Error on the commit", error);
    }
  });
}

const deleteCommit = (tx, container_id, subCommit, commitLength) =>{
  return new Promise(resolve => {
    let q = `
      match (c)-[r:Has*{commit:head(c.commitList)}]->(p:Property)
      where id(c) = ${container_id}
      set c.commitList = filter(x in c.commitList where x <> head(c.commitList))
      foreach(x in r | delete x)
      return collect(p)
    `;
    let q2 = "";
    if(commitLength > subCommit){
      tx.run(q)
      .then( data => {
        let f = data.records[0]._fields[0];
        // console.log('ffff', f)
        f.map(x => {
          // console.log('xxxxx', x)
          let i = x.identity.low
          q2 += `
          match (x${i}) where id(x${i})=${i}
          optional match ()-[r1]->(x${i})
          optional match (x${i})-[r2]->()
          call apoc.do.when(r1 is null and r2 is null, 'delete x', '',
          {x:x${i}, r1:r1, r2:r2}) yield value as vx${i}`;
        })
        q2 += " return 'done'";
        console.log("q2", q2)
      })
      .then( () => { return tx.run(q2)})
      .then( () => {
        commitLength--;
        deleteCommit(tx, container_id, subCommit, commitLength)
        .then( ()=> resolve() );
      })
    }else{ resolve() };
  })
}

module.exports.create_note = (req, res, next)=>{
  let session = driver.session();
  let today = new Date().getTime();
  let user_id = req.decoded.user_id;
  let ps = req.body;


  let query = `
     match (a:Account) where id(a) = ${user_id}
     create (n:Container{commitList: [${today}], type: 'note'})
     create (t:Property:Title {value:'${ps.title_value}'})
     create (u:Property:${ps.content_label}{value:'${ps.content_value}'})
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
      exp: utils.expire(),
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
      exp:utils.expire(),
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
      exp: utils.expire(),
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
         exp:utils.expire(),
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
    let ps = req.params;
    let query = `
      match (a:Account)-[l1:Linked*]->(n:Container)-[ly:Has{commit:last(n.commitList)}]->(y:Property:Title)-[lx:Has*{commit:last(n.commitList)}]->(x:Property)
      where id(a)= ${user_id} and id(n) = ${ps.id}
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
         exp: utils.expire(),
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

module.exports.update = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default

  // let session = driver.session();
  // let user_id = req.decoded.user_id;
  // let ps = req.body;
  // let now = new Date().getTime();
  //
  // let commit = req.body.commit || null;
  // let properties = [];
  // let updates;
  //
  // let Q1 = `
  //   match (a:Account)-[l:Linked]->(c:Container)
  //   where id(a) = ${user_id} and id(c) = ${ps.container_id}
  //   with count(l) as count, c
  //   call apoc.do.when(count <> 0,
  //     "match (c)-[:Has*{commit:com}]->(p:Property) where c=co return collect(p) as list",
  //     "", {co:c, com:last(c.commitList)}) yield value
  //   return value.list
  // `;
  //
  // let Q2 = `
  //   match(c:Container) where id(c) = ${ps.container_id}
  //   set c.commitList =  c.commitList + ${now}
  //   create (new:Property:${ps.label}{value:'${ps.value}'}) return new
  // `;
  //
  // let Q3 = ``,
  // Q3_1 = `match (c) where id(c)=${ps.container_id}`,
  // Q3_2 = ` create (c)`;
  //
  //
  // // CHECKING DATA
  // utils.num(ps.container_id)
  // .then(()=>{ return utils.num(ps.id)})
  // .then(()=>{ return utils.str(ps.value)})
  // .then(()=>{ return labelService.isPropertyLabel(ps.label)})
  // // Q1 => check user access and return properties list of the container
  // // including the title
  // .then(()=>{
  //   console.log('Q1', Q1)
  //   return session.readTransaction(tx=>tx.run(Q1)) })
  // .then((data)=>{
  //   let r = data.records;
  //   if(r.length && r[0]._fields[0].length){
  //     return r[0]._fields[0];
  //   }else if(r.length && r[0]._fields.length){
  //     return r[0]._fields;
  //   }else {
  //     throw {status: 403, err: 'no user access'}
  //   };
  // })
  // .then( data =>{
  //   console.log(data)
  //   // save the properties for after
  //   properties = data;
  //   let first = properties[0].labels.filter(x => { return x != 'Property'})
  //   console.log('first ===============: ', first)
  //   console.log(properties)
  //   if(first[0] != 'Title' ){
  //     console.log('into the reverse')
  //     properties.reverse();
  //   }
  //   console.log(properties)
  //   // Create the update and return it
  //   console.log('Q2', Q2)
  //   return session.readTransaction(tx=>tx.run(Q2))
  // })
  // .then( data => {
  //   console.log('result of Q2', data.records[0]._fields)
  //   updates = data.records[0]._fields[0];
  //   // Iterate the properties list to create the 3rd query
  //   properties.map(x => {
  //     // replace by the last update value
  //     let i = x.identity.low;
  //     let u = updates.identity.low;
  //     console.log('prepa Q3 =====================')
  //     console.log('i : ', i)
  //     console.log('u : ', u)
  //     if( i == ps.id){
  //       Q3_1 += ` match (x${u}) where id(x${u})=${u}`;
  //       Q3_2 += `-[:Has{commit:${now}}]->(x${u})`;
  //     }else{
  //       Q3_1 += ` match (x${i}) where id(x${i})=${i}`;
  //       Q3_2 += `-[:Has{commit:${now}}]->(x${i})`;
  //     };
  //     Q3_3 = ` return x${u}`
  //   });
  //   return;
  //
  // })
  // .then( () => {
  //   console.log('***************************************')
  //   console.log(Q3_1+Q3_2+Q3_3)
  //   return session.readTransaction(tx=>tx.run(Q3_1+Q3_2+Q3_3))
  // })
  // .then((data)=>{
  //   let r = data.records;
  //   if(r.length && r[0]._fields[0].length){
  //     console.log('result of Q3', r[0]._fields[0])
  //     return r[0]._fields[0];
  //   }else if(r.length && r[0]._fields.length){
  //     console.log('result of Q3', r[0]._fields)
  //     return r[0]._fields;
  //   }else {
  //     throw {status: 403, err: 'no data found'}
  //   };
  // })
  // .then( data => {
  //   console.log('at the end', data)
  //   let f = data[0];
  //   f.id = f.identity.low;
  //   f.label = f.labels.filter(l => { return l != 'Property' })[0];
  //   f.value = f.properties.value;
  //   delete f.identity;
  //   delete f.properties;
  //   delete f.labels;
  //   return f;
  // })
  // .then( data => {
  //   res.status(200).json({
  //      token:tokenGen(user_id),
  //      exp: utils.expire(),
  //      data: data
  //   });
  // })
  // .catch((err)=>{
  //    console.log(err);
  //    let status = err.status || 400;
  //    let e = err.err || err;
  //    res.status(status).json(e);
  // });

  let tx = driver.session().beginTransaction();
  let user_id = req.decoded.user_id;
  let ps = req.body;
  let now = new Date().getTime();

  // let commit = req.body.commit || null;
  let Q1_data = {};
  let updates;
  let updatedNode;
  let limitCommitLength = 10; // NOTE: Default value, can be modify by profile

  // Check user access and return the properties list of the container
  let Q1 = `
    match (a:Account)-[l:Linked]->(c:Container)
    where id(a) = ${user_id} and id(c) = ${ps.container_id}
    with count(l) as count, c, a.subscription_commit_length as subCommit
    call apoc.do.when(count <> 0,
      	" match (c:Container)-[:Has*{commit:last(c.commitList)}]->(plast:Property)"
 	  	+" return collect(distinct plast) as lastlist, last(c.commitList) as lastCommit,"
   		+"  size(c.commitList) as commitLength",
   		"", {c:c, last:last(c.commitList), head:head(c.commitList)}) yield value
    return {last: value, subCommit:subCommit};
  `;

  // Add new commit to the container commit list and create the updater node
  let Q2 = `
    match(c:Container) where id(c) = ${ps.container_id}
    set c.commitList =  c.commitList + ${now}
    create (new:Property:${ps.label}{value:'${ps.value}'}) return new
  `;

  // Store the new relationship flow of the new commit
  let Q3 = ``,
      Q3_1 = `match (c) where id(c)=${ps.container_id}`,
      Q3_2 = ` create (c)`;

  // Remove the old commit


  // CHECKING DATA
  utils.num(ps.container_id)
  .then(()=>{ return utils.num(ps.id)})
  .then(()=>{ return utils.str(ps.value)})
  .then(()=>{ return labelService.isPropertyLabel(ps.label)})
  .then(()=>{ return tx.run(Q1) })
  .then( data => {
    if(data.records.length && data.records[0]._fields.length){
      Q1_data = data.records[0]._fields[0];
    }else {
      // console.log()
      // console.log("Q1", Q1)
      throw {status: 403, mess: 'no feedbaack data of Q1'}
    };
  })
  .then( () =>{
    let first = Q1_data.last.lastlist[0].labels.filter(x => { return x != 'Property'})
    if(first[0] != 'Title' ){
      lastlist.reverse();
    }
  })
  .then(()=>{ return tx.run(Q2) })
  .then( data => {
    updates = data.records[0]._fields[0];
    // Iterate the properties list to create the 3rd query
    Q1_data.last.lastlist.map(x => {
      // replace by the last update value
      let i = x.identity.low;
      let u = updates.identity.low;
      if( i == ps.id){
        Q3_1 += ` match (x${u}) where id(x${u})=${u}`;
        Q3_2 += `-[:Has{commit:${now}}]->(x${u})`;
      }else{
        Q3_1 += ` match (x${i}) where id(x${i})=${i}`;
        Q3_2 += `-[:Has{commit:${now}}]->(x${i})`;
      };
      Q3_3 = ` return x${u}`
    });
    // return;
  })
  .then( () => {
    // console.log('Q3_1+Q3_2+Q3_3', Q3_1+Q3_2+Q3_3)
    return tx.run(Q3_1+Q3_2+Q3_3);
  })
  .then( data => {
    let r = data.records;
    if(r.length && r[0]._fields[0].length){
      return r[0]._fields[0];
    }else if(r.length && r[0]._fields.length){
      return r[0]._fields;
    }else {
      throw {status: 403, mess: 'no data found'}
    };
  })
  .then( data => {
    let f = data[0];
    f.id = f.identity.low;
    f.label = f.labels.filter(l => { return l != 'Property' })[0];
    f.value = f.properties.value;
    delete f.identity;
    delete f.properties;
    delete f.labels;
    updatedNode = f;
  }).then( () => {
    return deleteCommit(tx, ps.container_id, Q1_data.subCommit, Q1_data.last.commitLength);
  })
  // .then( () => {
  //   updatedNode = data;
  //   console.log('Q1_data.last.commitLength', Q1_data.last.commitLength)
  //   console.log('limitCommitLength', limitCommitLength)
  //   if(Q1_data.last.commitLength.low > limitCommitLength){
  //     let Q4 = `call apoc.do.when(true,
  //       "match ()-[r{commit:${Q1_data.head.headcommit}}]->() delete r ", "", {}) yield value `;
  //     Q1_data.head.headlist.map(x => {
  //       Q4 += `
  //       match (x) where id(x)=${x}
  //       optional match ()-[r1]->(x)
  //       optional match (x)-[r2]->()
  //       call apoc.do.when(r1 is null and r2 is null, 'delete x', '', {x:x, r1:r1, r2:r2}) yield value`;
  //     });
  //     Q4 += " return 'done'"
  //     return tx.run(Q4);
  //   };
  // })
  .then( () => {
    commit(tx, res, 200, user_id, updatedNode);
  })
  .catch((err)=>{
    console.log(err);
    crash(tx, res, err.status || 400, err.mess || null, err.err || err)
  });
};

module.exports.add_property = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default
  let session = driver.session();
  let user_id = req.decoded.user_id;
  let ps = req.body;
  let today = new Date().getTime();


  let Q1 = `
     match (a:Account)-[l:Linked]->(c:Container)
     where id(a) = ${user_id} and id(c) = ${ps.container_id}
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
    where id(c)= ${ps.container_id}`;
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
      label: f.labels.filter(p => { return p != 'Property'})[0]
    };
  })
  .then( data => {
     res.status(200).json({
        token:tokenGen(user_id),
        exp:utils.expire(),
        data:data
     });
  })
  .catch(function (error) {
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
  let ps = req.params
  let now = new Date().getTime();
  let commit = ps.commit || null;

  // this query check the user access and return the list of
  let Q1 = `
    match (a:Account)-[l:Linked*]->(c:Container)
    where id(a) = ${user_id} and id(c) = ${ps.container_id}
    with count(l) as count, c, last(c.commitList) as com
    call apoc.do.when(count <> 0,
    "match(c)-[:Has*{commit:com}]->(p) where c = co return collect(p) as list"
    ,"",{co:c, com:com}) yield value
    return value
  `;

  let Q2_1 = ` match(c) where id(c) = ${ps.container_id}`;
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
      }else if(i != ps.property_id){
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
      exp: utils.expire(),
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
    let session = driver.session();
    let ps = req.body;
    let now = new Date().getTime();

    let last_com = Number;

    let Q1 = `
       match (a:Account)-[l:Linked]->(n:Container)
       where id(a) = ${user_id} and id(n) = ${ps.container_id}
       return count(l)
    `;

    let Q2 = `
       match (n:Container)-[l:Has*{commit:last(n.commitList)}]->(p:Property)
       where id(n) = ${ps.container_id}
       return collect(p)
    `;

    let Q3_1 = `
      match (n:Container) where id(n) = ${ps.container_id}
    `;
    let Q3_2 = ` create (n)`;
    let Q3_3 = ` set n.commitList = n.commitList + ${now}`;

    utils.num(ps.container_id).then(()=>{
      return utils.num(ps.property_id)
    })
    .then(()=>{
      if(ps.direction == 'up' || ps.direction == 'down'){
        return;
      }else{
        throw {status: 400, err: "Wrong type of the 'direction' variable"}
      }
    })
    .then(()=>{
      return session.readTransaction(tx => tx.run(Q1))
    })
    .then( data => {
      console.log('============================= CHECK 1')
      // Check the user access to the container
      if(data.records[0].get(0).low) {
        console.log('============================= CHECK 1.1')
        return;
      }else{
        console.log('============================= CHECK 1.2')
        throw {status: 400, err: "no acces user"}
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
      if (ps.direction == 'up' && f[0].identity.low == ps.property_id){
        console.log('============================= CHECK 4.1')
        throw {status: 400, err: "Unauthorized query"}

      }else if(ps.direction == 'down' && f.reverse()[0].identity.low == ps.property_id){
        console.log('============================= CHECK 4.2')
        throw {status: 400, err: "Unauthorized query"}
      };
      // Because the previous conditionnal has not just check the reverse,
      // but modified it todrop, so we reverse again
      if(ps.direction == 'down'){
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
        if(i == ps.property_id && ps.direction == 'down'){
          console.log('============================= CHECK 5.1')
          todrop = i;
        }else if(i == ps.property_id && ps.direction == 'up'){
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
        }else if(ps.direction == 'down'){
          console.log('============================= CHECK 5.5')
          Q3_1 += ` match (x${i}:Property) where id(x${i}) = ${i}`;
          Q3_2 += `-[:Has{commit:${now}}]->(x${i})`;
        }else if(ps.direction == 'up'){
          console.log('============================= CHECK 5.6')
          console.log('conditionnal 6')
          previous = i;
        };
      });
      if(ps.direction == 'up' && previous){
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
    .catch(err => {
      console.log(err);
      let status = err.status || 400;
      let e = err.err || err;
      res.status(status).json(e);
    });
}
