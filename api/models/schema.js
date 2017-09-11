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
