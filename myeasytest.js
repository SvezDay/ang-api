'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');


module.exports = (req, res, next)=>{

    // Till it is difficult to extract the date time, the commit will be the
    // last one by default

    // This method doesn't delete any node, but create relationship with new
    // commit without the property to delete

    let user_id = 443;
    let _ = {
      container_id: 503,
      property_id: 521
    }
    let commit = req.body.commit || null;
    let session = driver.session();
    let now = new Date().getTime();

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

    let Q2_1 = `
      match(c) where id(c) = ${_.container_id}
    `;
    let Q2_2 = `
      create (c)`;

    session.readTransaction(tx => tx.run(Q1))
    .then( data => {
      return data.records[0]._fields[0].list;
    })
    .then( data => {
      // prepare Q2
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
          Q2_1 += ` match (x:Property) where id(x${i})=${i}`;
          Q2_2 += `-[:Has{commit:${now}}]->(x${i})`;
        }
      });
    })
    // .then( data => {
    //   return session.readTransaction(tx=>tx.run(Q2_1+Q2_2));
    // })
    .then( () => {
      res.status(200).json({message: Q2_1+Q2_2})
    })
    .catch( error => {
      console.log(error);
      res.status(400).json({error:error});
    });



};
