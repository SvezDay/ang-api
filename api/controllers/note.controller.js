'use-strict';
const driver = require('../../config/driver');
const tokenGen = require('../services/token.service');
const labelService = require('../services/label.service');
const utils = require('../services/utils.service');
const ChkData = require('../services/check-data.service');

const dbService = require('../services/db.service');


const deleteCommit = (tx, container_id, subCommit, commitLength) =>{
  return new Promise(resolve => {
    let q = `
    match (c)-[r:Has*{commit:head(c.commitList)}]->(p:Property)
    where id(c) = ${container_id}
    with c, r, p, c.commitList as firstList, filter(x in c.commitList where x <> head(c.commitList)) as filtered
    foreach(x in r | delete x)
    set c.commitList = filtered
    return collect(p), count(firstList), count(filtered)
    `;
    let q2 = "";
    if(commitLength > subCommit){
      tx.run(q)
      .then( data => {
        let f = data.records[0]._fields[0];
        f.map(x => {
          let i = x.identity.low
          q2 += `
          match (x${i}) where id(x${i})=${i}
          optional match ()-[r1]->(x${i})
          optional match (x${i})-[r2]->()
          call apoc.do.when(r1 is null and r2 is null, 'delete x', '',
          {x:x${i}, r1:r1, r2:r2}) yield value as vx${i}`;
        })
        q2 += " return 'done'";
      })
      .then( () => { return tx.run(q2)})
      .then( () => {
        commitLength--;
        deleteCommit(tx, container_id, subCommit, commitLength)
        .then( ()=> { resolve() });
      })
    }else{ resolve() };
  })
}

module.exports.create_note = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;
  let ps = req.body;

  let params = {
    uid,
    now,
    title: ps.title_value,
    label: ps.content_label,
    value: ps.content_value
  };
  let query = `
     match (a:Account) where id(a) = $uid
     create (n:Container{commitList: [$now], type: 'note'})
     create (t:Property:Title {value:$title})
     create (u:Property:$label{value:$value})
     create (a)-[:Linked]->(n)-[:Has{commit:$now}]->(t)-[:Has{commit:$now}]->(u)
     return {note_id: id(n), title_id:id(t), first_property_id: id(u)}
  `;

  // session.readTransaction(tx => tx.run(query))
  ChkData.str(ps.title_value)
  .then(()=>{ return ChkData.str(ps.content_label) })
  .then(()=>{ return ChkData.str(ps.content_value) })
  .then(()=>{ return tx.run(query, params) })
  .then( data => {
    if(!data.records[0]._fields.length){
      throw {stat: 400, mess: 'not Create'} }
    else{
      return data.records[0]._fields[0] }
  })
  // .then( data => {
  //   // let f = data.records[0]._fields[0];
  //   // let l = Object.keys(f);
  //   // l.map(x => {
  //   //   f[x].low ? f[x] = f[x].low : null
  //   // });
  //   // return f;
  // })
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  .then( data =>{  utils.commit({tx, res, uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.create_empty_note = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let now = new Date().getTime().toString();
  let uid = req.decoded.user_id;

  let params = { uid, now };
  let query = `
     match (a:Account) where id(a) = $uid
     create (n:Container{commitList: [$now], type: 'note'})
     create (t:Property:Title {value:'Undefined'})
     create (u:Property:Undefined {value:''})
     create (a)-[:Linked]->(n)-[:Has{commit:$now}]->(t)-[:Has{commit:$now]->(u)
     return {container_id: id(n), title_id:id(t), first_property_id: id(u)}
  `;

  // session.readTransaction(tx => tx.run(query))
  tx.run(query, params)
  .then( data => { return utils.parseInt(data) })
  .then( data => { return utils.sortLabel(data) })
  // .then( data => {
  //   let f = data.records[0]._fields[0];
  //   let l = Object.keys(f);
  //   l.map(x => {
  //     f[x].low ? f[x] = f[x].low : null
  //   });
  //   return f;
  // })
  // .then( data =>{
  //   res.status(200).json({
  //     token: tokenGen(user_id),
  //     exp:utils.expire(),
  //     data: data
  //   });
  // })
  // .catch( error => {
  //   console.log(error);
  //    res.status(404).json({error: error, message:'error basic error'});
  // });
  .then( data =>{  utils.commit({tx, res, uid, data}) })
  .catch( e => {
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.get_label = (req, res, next)=>{
  let uid = req.decoded.user_id;
  labelService.getPropertyLabel().then( list => {
    res.status(200).json({
      token: tokenGen(uid),
      exp: utils.expire(),
      data: list.filter(x => {return x != 'Title'})
    });
  });
};

module.exports.get_all_note = (req, res, next)=>{
    let uid = req.decoded.user_id;
    let session = driver.session();
    let tx = session.beginTransaction();

    let params = {uid};
    let query = `
    match (a:Account)-[:Linked]->(n:Container{type:'note'})-[l:Has{commit:last(n.commitList)}]->(x:Property)
       where id(a)= $uid
       return case
          when count(n) >= 1 then {note_id: id(n), title:x.value}
          else {}
       end
    `;
    tx.run(query, params)
    .then( data =>{
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
      utils.commit(tx, res, {uid, data});
    })
    .catch( e =>{
      let mess = e.mess || null;
      utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
    });

}

module.exports.get_note_detail = (req, res, next)=>{
    let session = driver.session();
    let tx = session.beginTransaction();
    let uid = req.decoded.user_id;
    let ps = req.params;
    let params = {uid, cont: Number.parseInt(ps.id) };
    let query = `
      match (a:Account)-[l1:Linked*]->(n:Container)-[ly:Has{commit:last(n.commitList)}]->(y:Property:Title)-[lx:Has*{commit:last(n.commitList)}]->(x:Property)
      where id(a)= $uid and id(n) = $cont
      with l1, y, x, n
      return
      case
         when count(l1)>=1 then {container:n, title: y, property:collect(x) }
         else {data:{message: 'No access user'}}
      end
    `;
    ChkData.num(params.cont)
    .then(()=>{ return tx.run(query, params) })
    .then( data => {
      let r = data.records;
      if(r.length && r[0]._fields[0].length){
        return r[0]._fields[0];
      }else if(r.length && r[0]._fields.length){
        return r[0]._fields;
      }else{
        throw {status: 403, mess: 'no user access'}
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
      utils.commit(tx, res, {uid, data});
    })
    .catch( e =>{
      let mess = e.mess || null;
      utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
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
  // ChkData.num(ps.container_id)
  // .then(()=>{ return ChkData.num(ps.id)})
  // .then(()=>{ return ChkData.str(ps.value)})
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

  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let now = new Date().getTime().toString();
  let params = {uid, now, cont:ps.container_id, label: ps.label, value:ps.value}
  // let commit = req.body.commit || null;
  let Q1_data = {};
  let updates;
  let updatedNode;
  let limitCommitLength = 10; // NOTE: Default value, can be modify by profile

  // Check user access and return the properties list of the container
  let Q1 = `
    match (a:Account)-[l:Linked]->(c:Container)
    where id(a) = $uid and id(c) = $cont
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
    match(c:Container) where id(c) = $cont
    set c.commitList =  c.commitList + $now
    create (new:Property:${params.label}{value:$value}) return new
  `;

  // Store the new relationship flow of the new commit
  let Q3 = ``,
      Q3_1 = `match (c) where id(c)= toInteger($cont)`,
      Q3_2 = ` create (c)`;

  // Remove the old commit

  // CHECKING DATA
  ChkData.num(ps.container_id)
  .then(()=>{ return ChkData.num(ps.id)})
  .then(()=>{ return ChkData.str(ps.value)})
  .then(()=>{ return labelService.isPropertyLabel(ps.label)})
  .then(()=>{ return tx.run(Q1, params) })
  .then( data => {
    if(data.records.length && data.records[0]._fields.length){
      Q1_data = data.records[0]._fields[0];
    }else {
      throw {status: 403, mess: 'no feedbaack data of Q1'}
    };
  })
  .then( () =>{
    let first = Q1_data.last.lastlist[0].labels.filter(x => { return x != 'Property'})
    if(first[0] != 'Title' ){
      lastlist.reverse();
    }
  })
  .then(()=>{
    return tx.run(Q2, params) })
  .then( data => {
    updates = data.records[0]._fields[0];
    // Iterate the properties list to create the 3rd query
    Q1_data.last.lastlist.map(x => {
      // replace by the last update value
      let i = x.identity.low;
      let u = updates.identity.low;
      // Crash if update label with a second title // Only one is accepted
      if(i == ps.id && ps.label == 'Title' &&
          x.labels.filter(y => {return y != 'Property'})[0] != 'Title'){
        let ff = x.labels.filter(y => {return y != 'Property'})[0]
        return crash(tx, res, 400, 'Cannot update label to Title');
      }else if( i == ps.id){
        Q3_1 += ` match (x${u}) where id(x${u})=${u}`;
        Q3_2 += `-[:Has{commit:$now}]->(x${u})`;
      }else{
        Q3_1 += ` match (x${i}) where id(x${i})=${i}`;
        Q3_2 += `-[:Has{commit:$now}]->(x${i})`;
      };
      Q3_3 = ` return x${u}`
    });
  })
  .then( () => {
    return tx.run(Q3_1+Q3_2+Q3_3, params) })
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
  })
  .then( () => {
    // NOTE: The adding of 1 to commitLength is for the current update
    return deleteCommit(tx, ps.container_id, Q1_data.subCommit.low,
                                          Q1_data.last.commitLength.low + 1);
  })
  .then( () => {
    utils.commit(tx, res, {uid, data:updatedNode});
  })
  .catch( e =>{
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.add_property = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the last one by default
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let now = new Date().getTime().toString();

  let params = {uid, now, cont:ps.container_id}
  let Q1 = `
     match (a:Account)-[l:Linked]->(c:Container)
     where id(a) = $uid and id(c) = $cont
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
    where id(c)= $cont`;
  let Q2_2 =
    ` set c.commitList = c.commitList + $now
    create (new:Property:Undefined{value:''})
    create (c)-[:Has{commit:$now}]->(t)-[:Has{commit:$now}]->(new)`;
  let Q2_3 = ` return new`;
  ChkData.num(ps.container_id)
  .then(() => { return tx.run(Q1, params) })
  .then( data => {
    if(data.records.length && data.records[0]._fields[0].list.length){
      return data.records[0]._fields[0].list;
    }else{
      throw {mess: 'no list'}
    }
  })
  .then( data => {
    data.map(x => {
      let i = x.identity.low;
      Q2_1 += ` match (x${i}) where id(x${i}) = ${i}`;
      Q2_2 += `-[:Has{commit:$now}]->(x${i})`
    });
  })
  .then(() => {
    // return new Promise((resolve, reject)=>{
    //   console.log(Q2_1+Q2_2+Q2_3)
    //   console.log('params', params)

      return tx.run(Q2_1+Q2_2+Q2_3, params)
    // })
  })
  .then( data => {
    console.log('check', data.records[0]._fields)
    let f = data.records[0]._fields[0];
    return {
      id: f.identity.low,
      value: '',
      label: f.labels.filter(p => { return p != 'Property'})[0]
    };
  })
  .then( data => {
    utils.commit(tx, res, {uid, data});
  })
  .catch( e =>{
    let mess = "error on add property " + e.mess;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.delete_property = (req, res, next)=>{
  // Till it is difficult to extract the date time, the commit will be the
  // last one by default

  // This method doesn't delete any node, but create relationship with new
  // commit without the property to delete

  let uid = req.decoded.user_id;
  let session = driver.session();
  let tx = session.beginTransaction();
  let ps = req.params
  let now = new Date().getTime().toString();
  let commit = ps.commit || null;
  let params = {uid, now, cont:ps.container_id}
  // this query check the user access and return the list of
  let Q1 = `
    match (a:Account)-[l:Linked*]->(c:Container)
    where id(a) = $uid and id(c) = $cont
    with count(l) as count, c, last(c.commitList) as com
    call apoc.do.when(count <> 0,
    "match(c)-[:Has*{commit:com}]->(p) where c = co return collect(p) as list"
    ,"",{co:c, com:com}) yield value
    return value
  `;

  let Q2_1 = ` match(c) where id(c) = $cont`;
  let Q2_2 = ` create (c)`;
  let Q2_3 = ` set c.commitList = c.commitList + $now`;

  tx.run(Q1, params)
  .then( data => {
    return data.records[0]._fields[0].list;
  })
  .then( data => {
    // preparation of Q2
    data.map(p => {
      let i = p.identity.low;
      if(p.labels.filter(l=>{ return l != 'Property'})[0] == 'Title'){
        Q2_1 += ` match (t:Title) where id(t)=${i}`;
        Q2_2 += `-[:Has{commit:$now}]->(t)`;
      }else if(i != ps.property_id){
        Q2_1 += ` match (x${i}:Property) where id(x${i})=${i}`;
        Q2_2 += `-[:Has{commit:$now}]->(x${i})`;
      }
    });
  })
  .then( data => { return tx.run(Q2_1+Q2_2+Q2_3, params) })
  .then( data => {
    utils.commit(tx, res, {uid, data});
  })
  .catch( e =>{
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.drop_property = (req, res, next)=>{
  // Since it ain't possible to parse the commit, it'll be the last by default
    let uid = req.decoded.user_id;
    let session = driver.session();
    let tx = session.beginTransaction();
    let ps = req.body;
    let now = new Date().getTime().toString();
    let params = {uid, now, cont:ps.container_id}
    let last_com = Number;

    let Q1 = `
       match (a:Account)-[l:Linked]->(n:Container)
       where id(a) = $uid and id(n) = $cont
       return count(l)
    `;

    let Q2 = `
       match (n:Container)-[l:Has*{commit:last(n.commitList)}]->(p:Property)
       where id(n) = $cont
       return collect(p)
    `;

    let Q3_1 = `
      match (n:Container) where id(n) = $cont
    `;
    let Q3_2 = ` create (n)`;
    let Q3_3 = ` set n.commitList = n.commitList + $now`;

    ChkData.num(ps.container_id)
    .then(()=>{ return ChkData.num(ps.property_id) })
    .then(()=>{
      if(ps.direction == 'up' || ps.direction == 'down'){
        return;
      }else{
        throw {status: 400, mess: "Wrong type of the 'direction' variable"}
      }
    })
    .then(()=>{ return tx.run(Q1, params) })
    .then( data => {
      // Check the user access to the container
      if(data.records[0].get(0).low) {
        return;
      }else{
        throw {status: 400, err: "no acces user"}
      };
    })
    // Get the property list
    .then( () => { return tx.run(Q2, params) })
    .then( data => {
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
      Q3_2 += `-[:Has{commit:$now}]->(x${i})`;
      return f;
    })
    .then( f => {
      // Check the limit up and down
      if (ps.direction == 'up' && f[0].identity.low == ps.property_id){
        throw {status: 400, mess: "Unauthorized query"}
      }else if(ps.direction == 'down' && f.reverse()[0].identity.low == ps.property_id){
        throw {status: 400, mess: "Unauthorized query"}
      };
      // Because the previous conditionnal has not just check the reverse,
      // but modified it todrop, so we reverse again
      if(ps.direction == 'down'){
        f.reverse();
      };
      return f;
    })
    .then( f => {
      // Finalisation of the query
      let todrop;
      let previous;
      f.map( x => {
        let i = x.identity.low;
        if(i == ps.property_id && ps.direction == 'down'){
          todrop = i;
        }else if(i == ps.property_id && ps.direction == 'up'){
          Q3_1 += `
          match (x${i}:Property) where id(x${i}) = ${i}
          match (x${previous}:Property) where id(x${previous}) = ${previous}`;
          Q3_2 += `-[:Has{commit:$now}]->(x${i})-[:Has{commit:$now}]->(x${previous})`;
          previous = 0;
        }else if(previous){
          Q3_1 += ` match (x${previous}:Property) where id(x${previous}) = ${previous}`;
          Q3_2 += `-[:Has{commit:$now}]->(x${previous})`;
          previous = i;
        }else if(todrop){
          Q3_1 += `
          match (x${i}:Property) where id(x${i}) = ${i}
          match (x${todrop}:Property) where id(x${todrop}) = ${todrop}`;
          Q3_2 += `-[:Has{commit:$now}]->(x${i})-[:Has{commit:$now}]->(x${todrop})`;
          todrop = 0;
        }else if(ps.direction == 'down'){
          Q3_1 += ` match (x${i}:Property) where id(x${i}) = ${i}`;
          Q3_2 += `-[:Has{commit:$now}]->(x${i})`;
        }else if(ps.direction == 'up'){
          previous = i;
        };
      });
      if(ps.direction == 'up' && previous){
        Q3_1 += ` match (x${previous}:Property) where id(x${previous}) = ${previous}`;
        Q3_2 += `-[:Has{commit:$now}]->(x${previous})`;
      };
      return;
    })
    .then( () =>{ return tx.run(Q3_1+Q3_2+Q3_3, params) })
    .then( () => {
      utils.commit(tx, res, {uid});
    })
    .catch( e =>{
      let mess = e.mess || null;
      utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
    });
}
