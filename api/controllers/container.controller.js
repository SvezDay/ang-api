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
  let Q4 = `where id(a) = ${user_id}`;
  let Q5 = ``;
  let Q6 = ``;
  let Q7 = ``;

  if(_.path.length != 0){
    let cont = _.path.pop();
    Q2 += `-[l:Linked*]->(c:Container)`;
    Q5 += ` and id(c)= ${cont}`;
    Q7 += ` with last, count(l) as count
    return case when count <> 0 then collect(last) else {} end `;
  }else{
    Q6 += ` return collect(last)`;
  };

  let Q8 = ``;
  let Q9 = ` return `;
  session.readTransaction(tx=>tx.run(Q1+Q2+Q3+Q4+Q5+Q6+Q7))
  .then( data => {
    return data.records[0]._fields[0];
  })
  .then(data=>{
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
    console.log(Q8+Q9)
    return session.readTransaction(tx=>tx.run(Q8+Q9))
  })
  .then( data => {
    return data;
  })
  .then(data => {
    res.status(200).json({data:data})
  })
  // let Q1 = `match(a:Account)`;
  // let Q2 = `-[:Linked]->(last:Container)`;
  // let Q3 = ` where id(a) = ${user_id}`;
  // let Q4 = `
  //   with count(last) as count, last
  //   return case when count <> 0
  //       then collect(last)
  //       else {message: 'no user access'} end`;
  // let Q5 = ``;
  // let Q6 = `return distinct `;
  //
  // if(_.path.length != 0){
  //   _.path.map(x => {
  //       Q1 += `-[:Linked]->(x${x.id})`;
  //       Q3 += ` and id(x${x.id}) = ${x.id}`;
  //   });
  // };
  //
  // session.readTransaction(tx=>tx.run(Q1+Q2+Q3+Q4))
  // .then(data=>{
  //   console.log('*************************************')
  //   console.log(Q1+Q2+Q3+Q4)
  //   // Check if some sub category found
  //   if(!data.records.length){
  //     return res.status(200).json({message: 'no more category'})
  //   }else{
  //     return data.records[0]._fields[0];
  //   };
  // })
  // .then( data => {
  //   // Prepare the query to get the title value for each container previously
  //   // found
  //   let t = 0;
  //   data.map(x => {
  //     t != 0 ? Q6 += ` , ` : null
  //     let i = x.identity.low;
  //     Q5 += `match(x${i})-[:Has]->(xt${i}:Title) where id(x${i}) = ${i} `;
  //     Q6 += ` {container_id:${i}, title_id:id(xt${i}), value:xt${i}.value}`;
  //     t++;
  //   });
  //   return;
  // })
  // .then(()=>{
  //   console.log('*************************************')
  //   console.log(Q5+Q6)
  //   return session.readTransaction(tx=>tx.run(Q5+Q6))
  // })
  // .then( data => {
  //   // Sorting data
  //   return data.records[0]._fields.map(x => {
  //     x.container_id = x.container_id.low;
  //     x.title_id = x.title_id.low;
  //     return x
  //   });
  // })
  // .then(data=>{
  //   res.status(200).json({data:data});
  // })
  .catch(err => {
    console.log(err);
    res.status(400).json({err:err});
  });


};
