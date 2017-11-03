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

    // let tx = session.beginTransaction();

    // let match = (datas)=>{
    //   tx.run(query2_1 + query2_2 + query2_3)
    //   .subscribe({
    //     onNext: function () {
    //     },
    //     onCompleted: function () {
    //       if(false){
    //         crash(res, tx, 400, "no user access");
    //       }else{
    //         commit(res, tx, 200)
    //       }
    //     },
    //     onError: function (error) {
    //       console.log('error', error);
    //       crash(res, tx, 400, "Error on the match", error);
    //     }
    //   });
    // }
    //
    // let create = ()=>{
    //   tx.run(`
    //     create (t:Testing{name:${now}})
    //     create (u:Testing{name:${now}}) return u, t
    //     `)
    //   .subscribe({
    //     onNext: function (record) {
    //       record._fields.map(x => {
    //         let i = x.identity.low
    //         query2_1 += ` match (t${i}:Testing) where id(t${i}) = ${i} `;
    //         query2_2 += `-[:TestHas]->(t${i})`;
    //       })
    //       console.log('query2', query2_1 + query2_2)
    //     },
    //     onCompleted: function () {
    //       match(store)
    //     },
    //     onError: function (error) {
    //       console.log('error', error);
    //       crash(res, tx, 400, "Error on the create", error);
    //     }
    //   });
    // }

    // create();

    tx.run(`
      match (a:Account)-[l:Linked]->(c:Container)
          where id(a) = 560 and id(c) = 309
          with count(l) as count, c, a.subscription_commit_length as subCommit
          call apoc.do.when(count <> 0,
          	" match (c:Container)-[:Has*{commit:last(c.commitList)}]->(plast:Property)"
         		+" match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)"
       	  	+" return collect(distinct plast) as lastlist, last(c.commitList) as lastCommit,"
         		+"  size(c.commitList) as commitLength",
         		"", {c:c, last:last(c.commitList), head:head(c.commitList)}) yield value as v1
          call apoc.do.when(v1.commitLength > subCommit,
          	"match (c:Container)-[:Has*{commit:head(c.commitList)}]->(phead:Property)"
              +"return collect(distinct phead) as headlist,  head(c.commitList) as headcommit",
          	"return [] as headlist, 0 as headcommit",
              {c:c, v1:v1, subCommit:subCommit}) yield value as v2
          return {last:v1, head:v2};
      `)
      // return v1 as last, v2 as head;
    .then( data => {
      let f = data.records[0]._fields[0].head.headcommit;
      return f
    })
    .then( data => {
      if(false){
        throw {mess:'Crash the function'}
      }else{
        commit(res, tx, 200, data)
      }
    })
    .catch( err => {
      console.log(err);
      crash(res, tx, err.status || 400, err.mess, err.err || err)
    });


};
