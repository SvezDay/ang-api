module.exports = (object, staker)=>{

  let field = [];

  let recoverField = (obj, stack)=>{
    return new Promise((resolve, reject)=>{
      let promiseList = [];
      for (var v in obj) {
        if(obj[v] instanceof Array && typeof obj[v][0] != 'object'){
          Promise.resolve(field.push(stack+'.'+v))
        }else if(obj[v] instanceof Array){
          obj[v].map(x=>{
            promiseList.push(recoverField(x, stack+'.'+v))
          })
        }else if(typeof obj[v] == 'object' && obj instanceof Array){
          promiseList.push(recoverField(obj[v], stack))
        }else if(typeof obj[v] == 'object'){
          promiseList.push(recoverField(obj[v], stack+'.'+v))
        }else{
          Promise.resolve(field.push(stack+'.'+v))
        }
      }
      Promise.all(promiseList).then(()=>{resolve()});
    })
  }

  recoverField(object, staker || 'node')
  .then(() => {
    return field.filter((item, pos, self) => {
      return self.indexOf(item)==pos;
    })
  })
  .then(fieldList => {
      // console.log('resul', fieldList)
      return fieldList;
  })
}
