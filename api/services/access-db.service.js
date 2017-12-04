'use strict';

module.exports.user = (uid, tid, tx)=>{
  return new Promise((resolve, reject)=>{
    let query = `
      match (a:Account)-[r:Has|:Linked*]->(t:Task)
      where id(a) = $uid and id(t) = toInteger($tid)
      return count(r)
    `;
    tx.run(query, {uid, tid}).then( data => {
      if(data.records[0]._fields[0].low == 0){
        reject({mess: 'no access user'})
      }else{
        resolve()
      }
    })
  })
}
