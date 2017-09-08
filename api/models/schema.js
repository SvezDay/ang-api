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
const label = [
  {course: []}
];

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
