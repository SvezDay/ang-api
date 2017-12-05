'use-strict';
const tokenGen = require('./token.service');
const self = {
  // crash: (transaction, response,  status, message, error)=>{
  crash: (tx, res, p)=>{
    // p => {tx: transaction, res: response,  stat: status, mess: message, err: error}
    console.log('ERROR MESSAGE: ', p.mess)
    console.log('ERROR: ',p.err)
    tx.rollback();
    res.status(p.stat || 400).json({mess: p.mess, error: p.err})
  },
  // commit: (transaction, response, status, user, data)=>{
  commit: (tx, res, p)=>{
    // p => {tx: transaction, res: response, stat: status, uid: userId, data: data}
    tx.commit()
    .subscribe({
      onCompleted: () => {
        // this transaction is now committed
        let params = {
          token:tokenGen(p.uid),
          exp: self.expire(),
          data: p.data || null
        };
        // status != 204 ? ( params.data = data ) : null
        res.status(p.stat || 200).json(params);
      },
      onError: (e) => {
        // self.crash(transaction, response, 400, "Error on the commit", e);
        let mess = 'commit fail';
        self.crash(tx, res, {stat: e.status || null , mess, err: e.err || e})
      }
    });
  },

  ObjInArrToKeyValInObj: (arr)=>{
    let keyval = {};
    arr.map(x => {
      keyval[Object.keys(x)] = x[Object.keys(x)];
    });
    return keyval;
  },

  // keyValInObjToObjInArr: (keyval)=>{
  //   let array = [];
  //   let keys = Object.keys(keyval);
  //   keys.map(x => {
  //     array.push({[x]: keyval[x]});
  //   });
  //   return array;
  // },
  expire: ()=>{
    return new Date().getTime() + (1000 * 60 * 30);
  },
  parseInt: (obj)=>{
    return new Promise((resolve)=>{
      let promises = [];
      for( let k in obj){
        if(obj instanceof Array){
          obj.map(x=>{  promises.push( self.parseInt(x) )  });
        }else if(obj[k] instanceof Array && typeof obj[k][0] == 'object'){
          promises.push( self.parseInt(obj[k]) );
        }else if(typeof obj[k] == 'object' && obj[k].hasOwnProperty("low")){
          promises.push(Promise.resolve(obj[k] = obj[k].low) )
        }else if(typeof obj[k] == 'object'){
          promises.push( self.parseInt(obj[k]) );
        }
      }
      Promise.all(promises).then(()=>{
        resolve(obj);
      })
    })
  },
  sortLabel: (obj)=>{
    return new Promise((resolve)=>{
      if(obj.labels){
        obj.labels = obj.labels.filter(x => {return x != 'Prop'})[0];
      }else{
        for( let v in obj){
          if(typeof obj[v] == 'object'){
            self.sortLabel(obj[v]).then(res => {
              obj[v] = res;
              resolve()})
          }
        }
      }
      resolve(obj);
    })
  }


};

module.exports = self;
