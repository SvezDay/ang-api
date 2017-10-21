'use-strict';
module.exports = {

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
  }


};
