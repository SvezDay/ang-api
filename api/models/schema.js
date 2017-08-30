'use-strict';

const queryList = {
  PriMeFoExRe:`
  -[:Linked]->(p:Property:Principe{value:''})
    -[:Linked]->(m:Property:Mecanisme{value:''})
    -[:Linked]->(m:Property:Fonction{value:''})
    -[:Linked]->(m:Property:Example{value:''})
    -[:Linked]->(m:Property:Solution{value:''})
    `,
  EnFr:''
};

module.exports.getSchemaQuery = (type)=>{
  return new Promise((resolve, reject)=>{
    for (let key of Object.keys(queryList)) {
      if(key == type){
        resolve(list[key]);
      };
    };
    reject();
  });

};

const objList = {
  DefProExpMeExSo:['Definition', 'Property_Theorem', 'Property_Theoem_Explanation', 'Method', 'Example', 'Solution'],
  MeExSo: ['Method', 'Example', 'Solution'],
  EnFr:['English', 'French'],
  Exp:['Explanation']
};

module.exports.getSchemaObj = (type)=>{
  return new Promise((resolve, reject)=>{
    for (let key of Object.keys(objList)) {
      if(key == type){
        console.log('key ', objList[key]);
        resolve(objList[key]);
      };
    };
    reject();
  });

};

module.exports.getAll = ()=>{
  return new Promise((resolve, reject)=>{
    resolve(objList);
  })
}
