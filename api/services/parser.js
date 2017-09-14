'use-strict';

let cleanId = (obj)=>{
    if( obj.identity ){
      obj.id = obj.identity.low;
      delete obj.identity;
    }else if(obj.id && obj.id.low){
      obj.id = obj.id.low;
    };
  return obj;
};

module.exports.dataMapper = (data)=>{
  return new Promise((resolve, reject)=>{
    if (data.records.length > 1){
      // resolve(data.records.map(x => {
      //   // if(x._fields[0].identity){
      //   //   x._fields[0].id = x._fields[0].identity.low;
      //   //   delete x._fields[0]['identity']
      //   // };
      //   // return x._fields[0];
      //   return cleanId(x._fields[0]);
      // }));
      resolve(data.records.map(x => {
        console.log('check 1')
        if(!Array.isArray(x)){   // it's an object with key/value
          if(x._fields[0].id && x.id._fields[0].low || x._fields[0].identity){
            x._fields[0] = cleanId(x);
          }else{
            console.log('==================')
            let u = Object.keys(x._fields[0])[0];
            console.log(u)
            let t = x._fields[0][u];
            console.log(t.labels)
            if(typeof Object.keys(x._fields[0])[0] == 'string'){
              console.log('check')
              console.log(Object.keys(x._fields[0])[0])
              x[Object.keys(x._fields[0])[0]] = cleanId(x._fields[0][Object.keys(x._fields[0])[0]]);
              delete x._fields[0][u];
            }
            console.log(typeof Object.keys(x._fields[0])[0])
            // x._fields[0][Object.keys(x._fields[0])].map( y => {
            //   y = cleanId(y);
            // });
          };
        }else{ // it's an array - list
          x[Object.keys(x)[0]].map( y => {
            y = cleanId(y);
          });
        };
        return x;
      }));
    }else if (data.records[0]._fields[0].length >= 1) {
      console.log('check 2')
      resolve(data.records[0]._fields[0].map(x => {
        return cleanId(x);
      }));
    }else if (data.records[0]._fields.length >= 1) {
        console.log('check 3')
      resolve(data.records[0]._fields.map(x => {
        if(!Array.isArray(x)){   // it's an object with key/value
          if(x.id && x.id.low || x.identity){
            x = cleanId(x);
          }else{
            x[Object.keys(x)[0]].map( y => {
              y = cleanId(y);
            });
          };
        }else{ // it's an array - list
          x[Object.keys(x)[0]].map( y => {
            y = cleanId(y);
          });
        };
        // return x;
      }));
    }else {
      console.log('init check')
      return "Error";
      // res.status(400).json({message: 'on the parser service'});
    };
  });
};


module.exports.includer = (obj, key, val)=>{
  let bool = false;
  obj.map( row => {
    row[key] == val ? bool = true : null
  });
  return bool;
};


module.exports.includerReturnId = (obj, key, val)=>{
  let id = null;
  obj.map( row => {
    row[key] == val ? id = row.id : null
  });
  return id;
};
