const request = require('request');
const server = require('../server');
const base_url = 'http://localhost:3200';
const jwt = require('jsonwebtoken');
const secret = require('../config/tokenSecret').secret;

xdescribe('API server', ()=>{
   let userToken;

   describe('FreeRoute:: /authenticate', ()=>{
      let form = {};
      let url = base_url + '/authenticate';
      it('Must return 200 status code', (done)=>{
         request.post({url, form:{email:'fox@mulder.io', password:'mulder'}}, (err, resp, body)=>{
            console.log(resp.statusCode);
            expect(resp.statusCode).toBe(200);
            done();
         });
      });

      it('Must return a token', (done)=>{
         request.post({url, form:{email:'fox@mulder.io', password:'mulder'}}, (err, resp, body)=>{
            let obj = JSON.parse(body);
            userToken=obj.token;
            expect(typeof obj.token).toBe('string');
            done();
         });
      });


      // it('Must return a valid token', (done)=>{
      //    request.post({url, form:{email:'fox@mulder.io', password:'mulder'}}, (err, resp, body)=>{
      //       let verified;
      //       let cb = (err, decoded)=>{
      //
      //          if(err) {
      //             console.log('token ERROR 1');
      //             console.log(err);
      //             console.log('false');
      //             verified = false;
      //          }
      //          console.log('true');
      //          verified =true;
      //          next();
      //       };
      //       let obj = JSON.parse(body);
      //       jwt.verify(obj.token, secret, cb);
      //       console.log(verified);
      //       expect(verified).toBe(true);
      //       done();
      //    });
      // });
      it('Must return 201 status code', (done)=>{
         request.post({url, form:{email:'email', password:'password'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(201);
            done();
         });
      });
      it('Must return 201 status code', (done)=>{
         request.post({url, form:{email:'fox@mulder.io', password:'password'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(201);
            done();
         });
      });
      it('Must return 400 status code', (done)=>{
         request.post({url, form:{key:'value'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(400);
            done();
         });
      });
   });

   describe('FreeRoute:: /register', ()=>{
      let form = {};
      let url = base_url + '/register';
      it('Must return 401 status code', (done)=>{
         form = {
            first:'leo',
            last:'dicaprio',
            email:'leo@dicaprio.io',
            tobe: 401,
            notbe: null
         }
         request.post({url, form}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(form.tobe || form.notbe);
            done();
         });
      });
      it('Must return 401 status code', (done)=>{
         form = {
            first:'',
            last:'',
            email:'leo@dicaprio.io',
            tobe: 401,
            notbe: null
         }
         request.post({url, form}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(form.tobe || form.notbe);
            done();
         });
      });

   });

})
