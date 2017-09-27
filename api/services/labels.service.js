let labels = require('../models/labels.model');
let util = require('./utility.service');

let self = {

  get_all_main_label: ()=>{
    let brut = [];
    labels.label_list.map( x => {
      brut.push(Object.keys(x)[0]);
    });
    return Array.from(new Set(brut));
  },

  get_all_sub_label: ()=>{
    let brut = [];
    labels.label_list.map( x => {
      brut.push(x[Object.keys(x)[0]]);
    });
    return Array.from(new Set(brut));
  },

  check_main_label: (label)=>{
    return self.get_all_main_label().includes(label) ? true : false
  },

  get_sub_label: (label)=>{
    if(!self.check_main_label(label) ){
      return 'Undefined';
    }else{
      let list = [];
      labels.label_list.map( x => {
        if(Object.keys(x)[0] == label){
          list.push(x[Object.keys(x)[0]]);
        };
      });
      return list;
    };
  },

  get_recallable_label_list: (label)=>{
    return util.ObjInArrToKeyValInObj(labels.recallable_label_list)[label];
  }



};

module.exports = self;