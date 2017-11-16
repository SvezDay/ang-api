'use-strict';
const tokenGen = require('./token.service');
const self = {

  ObjInArrToKeyValInObj: (arr)=>{
    let keyval = {};
    arr.map(x => {
      keyval[Object.keys(x)] = x[Object.keys(x)];
    });
    return keyval;
  },

  keyValInObjToObjInArr: (keyval)=>{
    let array = [];
    let keys = Object.keys(keyval);
    keys.map(x => {
      array.push({[x]: keyval[x]});
    });
    return array;
  },

  str: (data)=>{
    return new Promise((resolve, reject)=>{
      typeof data != 'string' ? reject({err: 'is not a string'}) : resolve()
    })
  },
  num: (data)=>{
    return new Promise((resolve, reject)=>{
      typeof data != 'number' ? reject({err: 'is not a number'}) : resolve()
    })
  },
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
  crash: (transaction, response,  status, message, error)=>{
    console.log(message)
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
          exp: self.expire(),
          data: data
        })
      },
      onError: (error) => {
        console.log('error', error);
        self.crash(transaction, response, 400, "Error on the commit", error);
      }
    });
  },
  sortLabel: (obj)=>{
    return new Promise((resolve)=>{
      if(obj.labels){
        obj.labels = obj.labels.filter(x => {return x != 'Property'})[0];
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
