'use-strict';
/*   from x to y    or    (x) -> (y)

          \ to      |course          |Definition      |Property_Theorem   |Method           |Example          |Solution         |
____from__\_________|________________|________________|___________________|_________________|_________________|_________________|
course              |0               |1               |1                  |1                |0                |0                |
Definition          |1               |0               |1                  |1                |0                |0                |
Property_Theorem    |1               |1               |0                  |1                |0                |0                |
Method              |1               |1               |1                  |0                |0                |0                |
Example             |0               |0               |0                  |0                |0                |0                |
Solution            |0               |0               |0                  |0                |1                |0                |

*/
const labelRecallableTargetList = {
  Course: ['Definition', 'Property_Theorem', 'Method'],
  Definition: ['Course', 'Property_Theorem', 'Method'],
  Property_Theorem: ['Course', 'Definition', 'Method'],
  Method: ['Course', 'Definition', 'Property_Theorem'],
  Example: ['Solution'],
  Solution: []
};


const objList = {
  DefProExpMeExSo:['Definition', 'Property_Theorem', 'Method', 'Example', 'Solution'],
  MeExSo: ['Method', 'Example', 'Solution'],
  EnFr:['English', 'French'],
  Exp:['Explanation']
};


const label_list = [
  {"Account": "Personal_account"},
  {"Account": "Business_account"},
  {"Container": "Note"},
  {"Container": "Course"},
  {"Container": "Project"},
  {"Property": "Definition"},
  {"Property": "Property_Theorem"},
  {"Property": "Method"},
  {"Property": "Example"},
  {"Property": "Solution"},
  {"Property": "Explanation"}
];


const primary_model_list = {

};


let get_main_label = ()=>{
  let brut = [];
  label_list.map( x => {
    brut.push(Object.keys(x)[0]);
  });
  return Array.from(new Set(brut));
};


let get_all_sub_label = ()=>{
  let brut = [];
  label_list.map( x => {
    brut.push(x[Object.keys(x)[0]]);
  });
  return Array.from(new Set(brut));
};


let check_main_label = (label)=>{
  return get_main_label().includes(label) ? true : false
};


let get_sub_label = (label)=>{
  if(!check_main_label(label) ){
    return 'Undefined';
  }else{
    let list = [];
    label_list.map( x => {
      if(Object.keys(x)[0] == label){
        list.push(x[Object.keys(x)[0]]);
      };
    });
    return list;
  };
};




module.exports.getSchemaObj = (type)=>{
  return new Promise((resolve, reject)=>{
    for (let key of Object.keys(objList)) {
      if(key == type){
        // console.log('key ', objList[key]);
        resolve(objList[key]);
      };
    };
    reject();
  });
};

module.exports.getAll = ()=>{
  return new Promise((resolve, reject)=>{
    console.log('from the schema.js the getAll function objList: ', objList);
    resolve(objList);
  })
}


module.exports.labelRecallableTargetList = ()=>{
  return labelRecallableTargetList;
};
