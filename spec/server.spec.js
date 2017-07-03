// 'use-strict';
// const express = require('express');
// const jasmine = require('jasmine-node');
const request = require('request');

const server = require('../server');

const base_url = 'http://localhost:3200';

describe('API server', ()=>{

   describe('FreeRoute:: /authenticate', ()=>{
      it('Must return 400 status code', (done)=>{
         request.post({url:base_url + '/authenticate', form:{key:'value'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(400);
            done();
         });
      });
      it('Must return 201 status code', (done)=>{
         request.post({url:base_url + '/authenticate', form:{email:'email', password:'password'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(201);
            done();
         });
      });
      it('Must return 201 status code', (done)=>{
         request.post({url:base_url + '/authenticate', form:{email:'fox@mulder.io', password:'password'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(201);
            done();
         });
      });
      it('Must return 200 status code', (done)=>{
         request.post({url:base_url + '/authenticate', form:{email:'fox@mulder.io', password:'mulder'}}, (err, resp, body)=>{
            expect(resp.statusCode).toBe(200);
            done();
         });
      });
   })

})
