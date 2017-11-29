'use-strict';
const tokenGen = require('./token.service');
const self = {
  str: (data)=>{
    return new Promise((resolve, reject)=>{
      !data.length || typeof data != 'string' ?
        reject({err: 'is not a string'}) : resolve()
    })
  },
  num: (data)=>{
    return new Promise((resolve, reject)=>{
      isNaN(data) || typeof data != 'number' ?
        reject({err: 'is not a number'}) : resolve()
    })
  },
  retObjInField1: (data)=>{
    return new Promise((resolve, reject)=>{
      if(data.records.length && data.records[0]._fields.length == 1){
        return data.records[0]._fields[0];
      }else{
        reject({mess:"data doesn't return a single object form ._field[0]"}) }
    })
  },
  retArrInField1: (data)=>{
    return new Promise((resolve, reject)=>{
      if(data.records.length && data.records[0]._fields.length > 1){
        return data.records[0]._fields;
      }else{
        reject({mess:"data doesn't return an list array form ._field[0]"}) }
    })
  },
  retArrInField2: (data)=>{},
  retObjInRec: (data)=>{},
  retArrInRec: (data)=>{}

};

module.exports = self;
