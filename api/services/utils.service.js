'use-strict';
const tokenGen = require('./token.service');
const self = {
  crash: (tx, res, p)=>{
    console.log('ERROR MESSAGE: ', p.mess)
    console.log('ERROR: ',p.err)
    tx.rollback();
    res.status(p.stat || 400).json({mess: p.mess, error: p.err})
  },
  commit: (tx, res, p)=>{
    tx.commit()
    .subscribe({
      onCompleted: () => {
        // this transaction is now committed
        let params = {
          token:tokenGen(p.uid),
          exp: self.expire(),
          data: p.data || null
        };
        res.status(p.stat || 200).json(params);
      },
      onError: (e) => {
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
  parseInt2: (data)=>{
    return new Promise((resolve, reject)=>{
      // Check if value or array/object
      if(data.hasOwnProperty('low')){
        resolve(data = data.low);
      }else {
        // check if array/object of array/object or value
        let promises = [];
        Object.keys(data).map(x => {
          if(Array.isArray(data[x]) || typeof data[x] == 'object'){
            self.parseInt2(data[x]).then(result => {
              promises.push(Promise.resolve(data[x] = result))
            });
          }else if(typeof data[x] == 'string' || 'number' || 'boolean'){
            promises.push(Promise.resolve(x = data[x]))
          }else{
            reject({mess:'error 1 on the parseInt2'})
          }
        })
        Promise.all(promises).then(()=>{
          resolve(data);
        })
      }
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
  },
  parseResult: (data)=>{
    return new Promise((resolve, reject)=>{
      switch (true) {
        case data.records.length == 0:
          reject({mess: "THE QUERY HAS RETURNED NO VALUE"})
          break;
        case data.records.length > 1:
          resolve(data.records.map(x => { return x._fields}));
          break;
        case data.records[0]._fields.length > 1:
          resolve(data.records[0]._fields);
          break;
        case data.records[0]._fields[0].length > 1:
          resolve(data.records[0]._fields[0]);
          break;
        case data.records[0]._fields[0].length == 1:
          resolve(data.records[0]._fields[0][0]);
          break;
        case data.records[0]._fields[0].length == undefined:
          resolve(data.records[0]._fields[0]);
          break;
        default:
          console.log(data)
          reject({mess: "error on the data parseResult"});

      }
    })
  }


};

module.exports = self;
