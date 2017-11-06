module.exports = {

  crash: (transaction, response,  status, message, error)=>{
    transaction.rollback();
    response.status(status).json({mess: message, error})
  },
  commit: (transaction, response, status, user, data)=>{
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
        this.crash(transaction, response, 400, "Error on the commit", error);
      }
    });
  },
  deleteCommit: (tx, container_id, subCommit, commitLength) =>{
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

}
