'use-strict';
const tokenGen = require('./token.service');

const self = {
  str: (data, name="A Param")=>{
    return new Promise((resolve, reject)=>{
      isNaN(name) ? name = "A PARAM" : null
      !data.length || typeof data != 'string' ?
        reject({err: `${name} is not a string: ${data}`}) : resolve()
    })
  },
  num: (data, name="A Param")=>{
    return new Promise((resolve, reject)=>{
      isNaN(data) || typeof data != 'number' ?
        reject({err: `${name} is not a number: ${data}`}) : resolve()
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
