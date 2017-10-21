'use-strict';


const driver = require('./config/driver');
const tokenGen = require('./api/services/token.service');
const labser = require('./api/services/label.service');

module.exports = (req, res, next)=>{
  let session = driver.session();

  let str = 'hello';
  let num = 2;
  let q = "match (n:Account) return n";

  labser.isPropertyLabel('Undefined')
  .then( ()=>{
    res.status(200).json({mess: 'ok'})
  })
  .catch(err => {
    res.status(400).json({err:err})
  })

  



};
