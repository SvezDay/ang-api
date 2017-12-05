'use-strict';
let driver = require('../../config/driver');
let tokenGen = require('../services/token.service');
let labelService = require('../services/label.service');
let utils = require('../services/utils.service');
const ChkData = require('../services/check-data.service');

module.exports.get_sub_container = (req, res, next)=>{
  let session = driver.session();
  let uid = req.decoded.user_id;
  let ps = req.body;

  let params = {uid, cont:ps.container_id};
  let Q1 = `match (a:Acc)`;
  let Q2 = ``;
  let Q3 = `-[:Linked]->(last:Cont)`;
  let Q4 = ` where id(a) = $uid`;
  let Q5 = ``;
  let Q6 = ``;
  let Q7 = ``;

  if(ps.container_id){
    Q2 += `-[l:Linked*]->(c:Cont)`;
    Q5 += ` and id(c)= $cont`;
    Q7 += ` with last, count(l) as count
    return case when count <> 0 then collect(last) else {} end `;
  }else{
    Q6 += ` return collect(last)`;
  };

  let Q8 = ``;
  let Q9 = ` return `;
  // This tx return the list of the container
  let p1 = session.readTransaction(tx=>tx.run(Q1+Q2+Q3+Q4+Q5+Q6+Q7, params))
  let p2 = p1.then( data => {
    if(data.records.length == 0){
      return false;
    }else{
      return data.records[0]._fields[0];
    };
  })

  p2.then( data => {
    if( data == false){
      return res.status(204).json({message:'empty'});
    }else{
      p2.then( data => {
        let t = 0;
        data.map(x => {
          t != 0 ? Q9 += " , " : null
          let i = x.identity.low;
          Q8 += ` match(c${i}:Cont)-[:Has{commit:last(c${i}.commitList)}]->(ct${i}:Title)
          where id(c${i}) = ${i}`;
          Q9 += `
          {container_id: id(c${i}), title_id:id(ct${i}), value:ct${i}.value}`;
          t++;
        })
      })
      .then( ()=> {
        // This tx return the title properties of each containers founds
        return session.readTransaction(tx=>tx.run(Q8+Q9))
      })
      .then( data => {
        if(!data.records[0]) {
          throw {
            status: 400, err: "container get sub container err on Q8 et Q9"}
        }

        return data.records[0]._fields.map(x => {
          x.container_id = x.container_id.low;
          x.title_id = x.title_id.low;
          return x;
        });
      })
      .then( data => {
        let params = {
          token:tokenGen(uid),
          exp: utils.expire(),
          data: data
        };
        res.status(200).json(params);
      })
      .catch( e =>{
        console.log('error', e)
        res.status(400).json({err:e})
      });

    }
  })


};
module.exports.get_sub_container_no_recallable = (req, res, next)=>{
  let session = driver.session();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let params = {uid, cid:ps.container_id};

  let queryFirst = `
    match (a:Acc)-[:Linked]->(rs:Recall)
    where id(a) = 71
    with collect(distinct rs.cid) as list
    return list
  `;
  let Q1 = `match (a:Acc)`;
  let Q2 = ``;
  let Q3 = `-[:Linked]->(last:Cont)`;
  let Q4 = ` where id(a) = $uid`;
  let Q5 = ``;
  let Q6 = ``;
  let Q7 = ``;

  if(ps.container_id){
    Q2 += `-[l:Linked*]->(c:Cont)`;
    Q5 += ` and id(c)= $cid`;
    Q7 += ` with last, count(l) as count
    return case when count <> 0 then collect(last) else {} end `;
  }else{
    Q6 += ` return collect(last)`;
  };

  let Q8 = ``;
  let Q9 = ` return `;
  session.readTransaction(tx=>tx.run(queryFirst, params))
  .then( data => { recallList = data.records[0]._fields[0]})
  // This tx return the list of the container
  let p1 = session.readTransaction(tx=>tx.run(Q1+Q2+Q3+Q4+Q5+Q6+Q7, params))
  let p2 = p1.then( data => {
    if(data.records.length == 0){
      return false;
    }else{
      return data.records[0]._fields[0];
    };
  })

  p2.then( data => {
    if( data == false){
      return res.status(204).json({message:'empty'});
    }else{
      p2.then( data => {
        let t = 0;
        data.map(x => {
          t != 0 ? Q9 += " , " : null
          let i = x.identity.low;
          Q8 += ` match(c${i}:Cont)-[:Has{commit:last(c${i}.commitList)}]->(ct${i}:Title)
          where id(c${i}) = ${i}`;
          Q9 += `
          {container_id: id(c${i}), title_id:id(ct${i}), value:ct${i}.value}`;
          t++;
        })
      })
      .then( ()=> {
        // This tx return the title properties of each containers founds
        return session.readTransaction(tx=>tx.run(Q8+Q9))
      })
      .then( data => {
        if(!data.records[0]) {
          throw {
            status: 400, err: "container get sub container err on Q8 et Q9"}
        }

        return data.records[0]._fields.map(x => {
          x.container_id = x.container_id.low;
          x.title_id = x.title_id.low;
          return x;
        });
      })
      .then( data => {
        let params = {
          token:tokenGen(uid),
          exp: utils.expire(),
          data: data
        };
        res.status(200).json(params);
      })
      .catch( e =>{
        console.log('error', e)
        res.status(400).json({err:e})
      });

    }
  })


};

module.exports.change_container_path = (req, res, next)=>{
  let session = driver.session();
  let tx = session.beginTransaction();
  let uid = req.decoded.user_id;
  let ps = req.body;
  let ctm = ps.container_to_move;
  let cth = ps.container_to_host;
  let params = {uid, ctm:ps.container_to_move, cth:ps.container_to_host};
  let Q = "";
  let Q1 = `
  match(ctm:Cont)<-[lm:Linked*]-(a:Acc)-[lh:Linked*]->(cth:Cont)
  where id(a)=$uid and id(ctm) = $ctm and id(cth)=$cth
  with count(lm) as countm, count(lh) as counth, ctm, lm, cth
  call apoc.do.when(countm <> 0 and counth <> 0,
    " match (ctm) where ctm = ctmp"
    +" match (cth) where cth = cthp"
    +" match ()-[lm]->() where lm = lmp"
    +" create (cth)-[:Linked]->(ctm)"
    +" delete lm"
    +" return 'done!'",
    "return 'error on the query'", {ctmp:ctm, lmp:last(lm), cthp:cth}) yield value
    return value
  `;
  // The same query if the host container is the account
  let Q2 = `
  match(ctm:Cont)<-[lm:Linked*]-(a:Acc)
  where id(a)=$uid and id(ctm) = $ctm
  with count(lm) as countm, ctm, lm, a
  call apoc.do.when(countm <> 0,
    " match (ctm:Cont) where ctm = ctmp"
    +" match (a:Acc) where a = ap"
    +" match ()-[lm:Linked]->() where lm = lmp"
    +" create (cth)-[:Linked]->(ctm)"
    +" delete lm"
    +" return 'done!'",
    "return 'error on the query'", {ctmp:ctm, lmp:last(lm), ap:a}) yield value
    return value
  `;

  // Conditional if the host container is the account
  cth == user_id ? Q = Q2 : Q = Q1

  tx.run(Q, params)
  .then(data=>{
    return data.records[0]._fields;
  })
  .then( data => {
    utils.commit(tx, res, {uid, data});
  })
  .catch( e =>{
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
};

module.exports.delete_container = (req, res, next)=>{
  let uid = req.decoded.user_id;
  let session = driver.session();
  let tx = session.beginTransaction();
  let ps = req.params;

  let params = {uid, cont_id:ps.id}
  let query = `
    optional match (a:Acc)-[l:Linked*]->(c:Cont) where id(c)=$cont_id and id(a)=$uid
    with count(l) as count, last(l) as link, c
    call apoc.do.when(
      count >= 1,
      "call apoc.path.subgraphAll(c, {relationshipFilter:'Has', filterStartNode: true, limit:-1})"
      +" yield nodes, relationships"
      +" delete link"
      +" foreach(x in relationships | delete x)"
      +" foreach(x in nodes | delete x)"
      +" return true",
      "return false", {c:c, link:link}) yield value
    return value
  `;

  ChkData.num(Number(ps.id))
  .then( () =>{ return tx.run(query, params) })
  .then( data => {
    // Check if user access
    if(data.records[0] && data.records[0]._fields[0].false == false){
      throw {status: 400, mess: "no access user"}
    }
  })
  .then( () => {
    utils.commit(tx, res, {uid});
  })
  .catch( e =>{
    let mess = e.mess || null;
    utils.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
  });
}
