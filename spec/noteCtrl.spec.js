const request = require('request');
const server = require('../server');
const base_url = 'http://localhost:3200';

describe('Note Controller', ()=>{

   /*
   Using the following userTest
   */
   const user = {
      first: 'user',
      last: 'tester',
      email: 'user@tester.io',
      password: 'tester',
      middle: 'Undefined'
   };
   let note = {};

   describe('Before: Connection user', ()=>{
      // Assume to have the token of User Tester
      let url = base_url + '/authenticate';
      it('Must return a token', (done)=>{
         request.post({url, form:{email:user.email, password:user.password}}, (err, resp, body)=>{
            let obj = JSON.parse(body);
            user.token=obj.token;
            user.user_id=obj.user_id;
            expect(typeof obj.token).toBe('string');
            done();
         });
      });
   })

   describe('Check the note', ()=>{
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
