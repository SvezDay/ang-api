'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');
const utils = require('./api/services/utils.service');

const crash = (response, transaction, status, message, error)=>{
  transaction.rollback();
  response.json({status: status, mess: message, error:error})
}

const commit = (response, transaction, status, data)=>{
  console.log('check commit')
  transaction.commit()
  .subscribe({
    onCompleted: () => {
      // this transaction is now committed
      response.status(status).json({data: data})
    },
    onError: (error) => {
      console.log('error', error);
      crash(response, transaction, 400, "Error on the commit", error);
    }
  });
}
module.exports = (req, res, next)=>{

  let tx = driver.session().beginTransaction();
  let user_id = 560;
  let ps = {container_id:309 , label:"Definition" ,value:"hello world", id:313};
  let now = Math.round(new Date().getTime() / 999999999);

  let store = [];
  let query2_1 = "";
  let query2_2 = "create (a:Account)";
  let query2_3 = " ";

  // match (a:Account)-[l:Linked]->(c:Container)
  // where id(a) = 560 and id(c) = 309
  // with count(l) as count, c, a.subscription_commit_length as subCommit
  // call apoc.do.when(count <> 0,
  //   " match (c:Container)-[:Has*{commit:last(c.commitList)}]->(plast:Property)"
  //   +" match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)"
  //   +" return collect(distinct plast) as lastlist, last(c.commitList) as lastCommit,"
  //   +"  size(c.commitList) as commitLength",
  //   "", {c:c, last:last(c.commitList), head:head(c.commitList)}) yield value as v1
  // call apoc.do.when(v1.commitLength > subCommit,
  //   "match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)"
  //     +"return collect(distinct phead) as headlist,  head(c.commitList) as headcommit",
  //   "return [] as headlist, 0 as headcommit",
  //     {c:c, v1:v1, subCommit:subCommit}) yield value as v2
  // return {last:v1, head:v2};

    // create();
    // let Q1_data;
    // tx.run(`
    //   match (a:Account)-[l:Linked]->(c:Container)
    //   where id(a) = 560 and id(c) = 309
    //   with count(l) as count, c, a.subscription_commit_length as subCommit
    //   call apoc.do.when(count <> 0,
      //   	" match (c:Container)-[:Has*{commit:last(c.commitList)}]->(plast:Property)"
   // 	  	+" return collect(distinct plast) as lastlist, last(c.commitList) as lastCommit,"
    //  		+"  size(c.commitList) as commitLength",
    //  		"", {c:c, last:last(c.commitList), head:head(c.commitList)}) yield value
    //   return {last: value, subCommit:subCommit};
    //   `)
    // .then( data => {
    //   console.log(data.records[0]._fields[0])
    //   return Q1_data = data.records[0]._fields[0];
    // })
    // .then( () => {
    //   if( Q1_data.subCommit.low > 10){
    //     tx.run(`
    //       match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)
    //       where id(c) = 309
    //       with count(l) as count, c, a.subscription_commit_length as subCommit
    //       call apoc.do.when(v1.commitLength > subCommit,
    //         "match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)"
    //           +"return collect(distinct phead) as headlist,  head(c.commitList) as headcommit",
    //         "return [] as headlist, 0 as headcommit",
    //           {c:c, v1:v1, subCommit:subCommit}) yield value as v2
    //       return {last:v1, head:v2};
    //       `);
    //   }
    // })
    // let i = 2;
    // let loop = ()=>{
    //   console.log('check cleanCommit')
    //   return new Promise( resolve => {
    //     setTimeout(()=>{
    //        i > 0 ? ( i-- , loop().then(() => resolve() ) ) : resolve()
    //     }, 2000)
    //   })
    // };
    // let deleteCommit = ()=>{
    //   return new Promise( resolve => {
    //     tx.run('match (a:Account) return a')
    //     .then( data => {
    //       console.log(data.records[0]._fields[0])
    //        i > 0 ? ( i-- , deleteCommit().then( data => resolve() ) ) : resolve()
    //     })
    //   })
    // }


    tx.run(`
      match (a:Account)-[l:Linked]->(c:Container)
      where id(a) = ${user_id} and id(c) = ${ps.container_id}
      with count(l) as count, c, a.subscription_commit_length as subCommit
      call apoc.do.when(count <> 0,
          " match (c:Container)-[:Has*{commit:last(c.commitList)}]->(plast:Property)"
        +" return collect(distinct plast) as lastlist, last(c.commitList) as lastCommit,"
        +"  size(c.commitList) as commitLength",
        "", {c:c, last:last(c.commitList), head:head(c.commitList)}) yield value
      return {last: value, subCommit:subCommit};
      `)
    .then( data => {
      // return loop();
      console.log(data.records[0]._fields[0])
      // return deleteCommit()
    })
    .then( () => {
      console.log('check after then')
      commit(res, tx, 200)
    })
    .catch( err => {
      console.log(err);
      crash(res, tx, err.status || 400, err.mess, err.err || err)
    });


};
