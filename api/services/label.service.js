let labels = require('../models/labels.model');
let util = require('./utils.service');

module.exports = {

  isPropertyLabel: (label)=>{
    return new Promise((resolve, reject)=>{
      let list = [];
      labels.label_list.filter(x => {
        if(Object.keys(x) == 'Property'){
          list.push(x[Object.keys(x)]);
        }
      })
      let bool  = list.includes(label);
      bool ? resolve() : reject({err: 'label not found'})
    })
  },

  getPropertyLabel: ()=>{
    return new Promise((resolve, reject)=>{
      let list = [];
      labels
      .label_list.filter(x => {
          if(Object.keys(x) == 'Property'){
            list.push(x[Object.keys(x)]);
          }
        })
      resolve(list);
    })
  },

  get_recallable_label_list: (label)=>{
    return util.ObjInArrToKeyValInObj(labels.recallable_label_list)[label];
  },
  // ObjInArrToKeyValInObj: (arr)=>{
  //   let keyval = {};
  //   arr.map(x => {
  //     keyval[Object.keys(x)] = x[Object.keys(x)];
  //   });
  //   return keyval;
  // },

  // get_all_main_label: ()=>{
  //   let brut = [];
  //   labels.label_list.map( x => {
  //     brut.push(Object.keys(x)[0]);
  //   });
  //   return Array.from(new Set(brut));
  // },
  //
  // get_all_sub_label: ()=>{
  //   let brut = [];
  //   labels.label_list.map( x => {
  //     brut.push(x[Object.keys(x)[0]]);
  //   });
  //   return Array.from(new Set(brut));
  // },

  // check_main_label: (label)=>{
  //   return self.get_all_main_label().includes(label) ? true : false
  // },


  // get_sub_label: (label)=>{
  //   if(!self.check_main_label(label) ){
  //     return 'Undefined';
  //   }else{
  //     let list = [];
  //     labels.label_list.map( x => {
  //       if(Object.keys(x)[0] == label){
  //         list.push(x[Object.keys(x)[0]]);
  //       };
  //     });
  //     return list;
  //   };
  // },





};
