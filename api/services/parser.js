'use-strict';

module.exports.dataMapper = (data)=>{
  return new Promise((resolve, reject)=>{
      if (data.records.length > 1){
        console.log('data.records.length', data.records.length);
        resolve(data.records.map(x => {
          return x._fields[0];
        }));
      }else if (data.records[0]._fields.length = 1) {
        console.log('data.records[0]._fields.length', data.records[0]._fields.length);
        resolve(data.records[0]._fields[0]);
      }else if (data.records[0]._fields.length > 1) {
        console.log('data.records[0]._fields.length', data.records[0]._fields.length);
        resolve(data.records[0]._fields.map(x => {
          return x;
        }));
      }else if (data.records.length = 1) {
        console.log('data.records[0].length', data.records[0]);
        resolve(data.records[0]);
      }else {
        res.status(400).json({message: 'on the tester result of data.records'});
      };
  });
};
