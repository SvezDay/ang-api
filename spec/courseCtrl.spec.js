const request = require('request');
const server = require('../server');
const base_url = 'http://localhost:3200';
const jwt = require('jsonwebtoken');
const secret = require('../config/tokenSecret').secret;

describe('File: Course Controller :: ', ()=>{

   /*
   Using the following userTest
   */
   let user = {
    //  id:181,
     email: 'igor@temor.io',
     password: 'temor'
   };
   let body = {
     value: 'This is a test of course title',
     schema: 'DefProExpMeExSo'
   };
   let token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // expiration in 1 hour
      user_id:user.id
   },secret);
   let tokenFeedBack = '';
   let obj = {};


   describe('Before: Connection user', ()=>{
      // Assume to have the token of User Tester
      let url = base_url + '/authenticate';
      it('Must return a token', (done)=>{
         request.post({url, form:{email:user.email, password:user.password}, token}, (err, resp, body)=>{
            obj = JSON.parse(body);
            user.token=obj.token;
            user.user_id=obj.id;
            expect(typeof obj.token).toBe('string');
            done();
         });
      });
   });
   describe('create Course', ()=>{
      // Assume to have the token of User Tester
      let url = base_url + '/api/create_course';
      it('Must return a token', (done)=>{
         request.post({url, form:{email:user.email, password:user.password}, token}, (err, resp, body)=>{
            obj = JSON.parse(body);
            user.token=obj.token;
            user.user_id=obj.id;
            expect(typeof obj.token).toBe('string');
            done();
         });
      });
   });





   xdescribe('Check the note', ()=>{
      it('Must have create a note reached to the user', ()=>{
         let params = {
            value: "This is the creation test with jasmine-node",
            user_id:user.user_id
         };
         let url = base_url + '/api/create_node';
         let header = {
            'Content-Type': 'application/json',
            'x-access-token': user.token
         };
            console.log(user.token);
         request.post({url, form:params, headers: header}, (err, resp, body)=>{
            console.log('check the note');
            console.log(resp.json());
            expect(body).toBe('object');
         })
      })
   })

   // describe('Create a note', ()=>{
   //    let form = {};
   //    let url = base_url + '/api/createNode';
   //    it('Must return 200 status code', (done)=>{
   //       request.post({url, form:{email:'fox@mulder.io', password:'mulder'}}, (err, resp, body)=>{
   //          expect(resp.statusCode).toBe(200);
   //          done();
   //       });
   //    });
   //    it('Must return 201 status code', (done)=>{
   //       request.post({url, form:{email:'email', password:'password'}}, (err, resp, body)=>{
   //          expect(resp.statusCode).toBe(201);
   //          done();
   //       });
   //    });
   //    it('Must return 201 status code', (done)=>{
   //       request.post({url, form:{email:'fox@mulder.io', password:'password'}}, (err, resp, body)=>{
   //          expect(resp.statusCode).toBe(201);
   //          done();
   //       });
   //    });
   //    it('Must return 400 status code', (done)=>{
   //       request.post({url, form:{key:'value'}}, (err, resp, body)=>{
   //          expect(resp.statusCode).toBe(400);
   //          done();
   //       });
   //    });
   // });



})
