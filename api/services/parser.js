'use-strict';

module.exports.dataMapper = (data)=>{
  return new Promise((resolve, reject)=>{
      // Object with multiple records (and obviously 1 fields for each)
      if (data.records.length > 1){
console.log('data.records.length', data.records.length);
console.log('check multiple record')
        resolve(data.records.map(x => {
          // console.log(x)
          if(x._fields[0].identity){
            // remove property identity to be replace by id
            x._fields[0].id = x._fields[0].identity.low;
            delete x._fields[0]['identity']
          };
          return x._fields[0];
        }));
        // Object with 1 records and multiple fields
      }else if (data.records[0]._fields[0].length >= 1) {
        console.log('data.records[0]._fields.length', data.records[0]._fields.length);
        console.log('multiple field')
        resolve(data.records[0]._fields[0].map(x => {
          // console.log(x);s
          if( x['identity'] ){
            x.id = x['identity'].low;
            delete x['identity']
          };
          return x;
        }));
      }else if (data.records[0]._fields.length = 1) {
console.log('data.records[0]._fields.length', data.records[0]._fields.length);
console.log('check last of the last')
        resolve(data.records[0]._fields.map(x => {
          if( x['identity'] ){
            x.id = x['identity'].low;
            delete x['identity']
          };
          return x;
        }));
      }else {
        res.status(400).json({message: 'on the parser service'});
      };
  });
};
