'use-strict';
let driver = require('../../config/driver');
let tokenGen = require('../services/token.service');
let labels_service = require('../services/labels.service');

module.exports.get_sub_container = (req, res, next)=>{
  let session = driver.session();
  let user_id = req.decoded.user_id;
  let _ = req.body;


  let Q1 = `match (a:Account)`;
  let Q2 = ``;
  let Q3 = `-[:Linked]->(last:Container)`;
  let Q4 = ` where id(a) = ${user_id}`;
  let Q5 = ``;
  let Q6 = ``;
  let Q7 = ``;

  if(_.container_id){
    Q2 += `-[l:Linked*]->(c:Container)`;
    Q5 += ` and id(c)= ${_.container_id}`;
    Q7 += ` with last, count(l) as count
    return case when count <> 0 then collect(last) else {} end `;
  }else{
    Q6 += ` return collect(last)`;
  };

  let Q8 = ``;
  let Q9 = ` return `;

  // This tx return the list of the container
  let p1 = session.readTransaction(tx=>tx.run(Q1+Q2+Q3+Q4+Q5+Q6+Q7))
  let p2 = p1.then( data => {
    if(data.records.length == 0){
      console.log('======================= 1')
      return false;
    }else{
      console.log('======================= 2')
      return data.records[0]._fields[0];
    };
  })

  p2.then(data =>{
    if( data == false){
      return res.status(204).json({message:'empty'});
    }else{
      p2.then(data=>{
        console.log('CONTINUE')
        let t = 0;
        data.map(x => {
          t != 0 ? Q9 += " , " : null
          let i = x.identity.low;
          Q8 += ` match(c${i}:Container)-[:Has{commit:last(c${i}.commitList)}]->(ct${i}:Title)
          where id(c${i}) = ${i}`;
          Q9 += `
          {container_id: id(c${i}), title_id:id(ct${i}), value:ct${i}.value}`;
          t++;
        })
      })
      .then( ()=> {
        // console.log(Q8+Q9)
        // This tx return the title properties of each containers founds
        return session.readTransaction(tx=>tx.run(Q8+Q9))
      })
      .then( data => {
        return data.records[0]._fields.map(x => {
          x.container_id = x.container_id.low;
          x.title_id = x.title_id.low;
          return x;
        });
      })
      .then(data => {
        console.log('======================= data')
        console.log(data)
        res.status(200).json({
          token: tokenGen(user_id),
          data:data
        });
      })
      .catch(err => {
        console.log(err);
        res.status(400).json({err:err});
      });

    }
  })


};


module.exports.change_container_path = (req, res, next)=>{
  let session = driver.session();
  let user_id = req.decoded.user_id;
  let ctm = req.body.container_to_move;
  let cth = req.body.container_to_host;
  let Q = "";

  let Q1 = `
  match(ctm:Container)<-[lm:Linked*]-(a:Account)-[lh:Linked*]->(cth:Container)
  where id(a)=${user_id} and id(ctm) = ${ctm} and id(cth)=${cth}
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
  match(ctm:Container)<-[lm:Linked*]-(a:Account)
  where id(a)=${user_id} and id(ctm) = ${ctm}
  with count(lm) as countm, ctm, lm, a
  call apoc.do.when(countm <> 0,
    " match (ctm:Container) where ctm = ctmp"
    +" match (a:Account) where a = ap"
    +" match ()-[lm:Linked]->() where lm = lmp"
    +" create (cth)-[:Linked]->(ctm)"
    +" delete lm"
    +" return 'done!'",
    "return 'error on the query'", {ctmp:ctm, lmp:last(lm), ap:a}) yield value
    return value
  `;

  // Conditional if the host container is the account
  cth == user_id ? Q = Q2 : Q = Q1

  session.readTransaction(tx=>tx.run(Q))
  .then(data=>{
    return data.records[0]._fields;
  })
  .then(data => {
    res.status(200).json({data:data});
  })
  .catch(err => {
    console.log(err)
    res.status(400).json({err:err});
  })
};
