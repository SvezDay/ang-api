'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');

module.exports = (req, res, next)=>{
  let session = driver.session();

  let str = 'hello';
  let num = 2;
  let q = `
    match (a:Account)-[l:Linked]->(c:Container)-[be:Has*]->(p:Property)
    where id(a) = 560 and id(c) = 236
    with count(l) as count, c, p
    call apoc.do.when(count <> 0,
      "match (c)-[:Has*{commit:com}]->(p:Property) where c=co return collect(p) as list",
      "", {co:c, com:last(c.commitList)}) yield value
    return value.list`;

  session.readTransaction(tx => tx.run(q))
  .then( data=>{
    res.status(200).json({mess: data.records})
  })
  .catch(err => {
    res.status(400).json({err:err})
  })





};
