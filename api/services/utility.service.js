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

};
