const request = require('request');
const parser = require('../api/services/parser');

const neo4j = require('neo4j-driver').v1;
const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

let session = driver.session();
let transaction;
let query;
let bool;

// const _1_objORec = {
//       "records": [],
//         "summary": {
//             "statement": {
//                 "text": "\n  match (a:Account) return a\n  ",
//                 "parameters": {}
//             },
//             "statementType": "r",
//             "counters": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "updateStatistics": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "plan": false,
//             "profile": false,
//             "notifications": [],
//             "server": {
//                 "address": "localhost:7687",
//                 "version": "Neo4j/3.1.3"
//             },
//             "resultConsumedAfter": {
//                 "low": 0,
//                 "high": 0
//             },
//             "resultAvailableAfter": {
//                 "low": 8,
//                 "high": 0
//             }
//         }
// };
// const _2_obj1Rec1Fiel = {
//       "records": [
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 181,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Account"
//                         ],
//                         "properties": {
//                             "password": "temor",
//                             "middle": "undefined",
//                             "last": "temor",
//                             "email": "igor@temor.io",
//                             "first": "igor"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             }
//         ],
//         "summary": {
//             "statement": {
//                 "text": "\n  match (a:Account) return a\n  ",
//                 "parameters": {}
//             },
//             "statementType": "r",
//             "counters": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "updateStatistics": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "plan": false,
//             "profile": false,
//             "notifications": [],
//             "server": {
//                 "address": "localhost:7687",
//                 "version": "Neo4j/3.1.3"
//             },
//             "resultConsumedAfter": {
//                 "low": 0,
//                 "high": 0
//             },
//             "resultAvailableAfter": {
//                 "low": 8,
//                 "high": 0
//             }
//         }
// };
// const _3_obj1RecMultFiel = {
//         "records": [
//             {
//                 "keys": [
//                     "collect(a)"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     [
//                         {
//                             "identity": {
//                                 "low": 243,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "PriMeFoExRe",
//                                 "value": "Math Inter"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 257,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "DefProExpMeExSo",
//                                 "value": "undefined"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 270,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "DefProExpMeExSo",
//                                 "value": "Create this new couse"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 280,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "DefProExpMeExSo",
//                                 "value": "Test of course creation"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 286,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "DefProExpMeExSo",
//                                 "value": "Test of course creation"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 293,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "DefProExpMeExSo",
//                                 "value": "Test of course creation"
//                             }
//                         },
//                         {
//                             "identity": {
//                                 "low": 325,
//                                 "high": 0
//                             },
//                             "labels": [
//                                 "Course",
//                                 "Container"
//                             ],
//                             "properties": {
//                                 "schema": "SheMEPRo",
//                                 "v": "Test for recall rel"
//                             }
//                         }
//                     ]
//                 ],
//                 "_fieldLookup": {
//                     "collect(a)": 0
//                 }
//             }
//         ],
//         "summary": {
//             "statement": {
//                 "text": "\n  match (a:Course) return collect(a)\n  ",
//                 "parameters": {}
//             },
//             "statementType": "r",
//             "counters": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "updateStatistics": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "plan": false,
//             "profile": false,
//             "notifications": [],
//             "server": {
//                 "address": "localhost:7687",
//                 "version": "Neo4j/3.1.3"
//             },
//             "resultConsumedAfter": {
//                 "low": 1,
//                 "high": 0
//             },
//             "resultAvailableAfter": {
//                 "low": 12,
//                 "high": 0
//             }
//         }
//       };
// const _4_objMultRec1Fiel = {
//         "records": [
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 243,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "PriMeFoExRe",
//                             "value": "Math Inter"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 257,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "undefined"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 270,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "Create this new couse"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 280,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "Test of course creation"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 286,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "Test of course creation"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 293,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "Test of course creation"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             },
//             {
//                 "keys": [
//                     "a"
//                 ],
//                 "length": 1,
//                 "_fields": [
//                     {
//                         "identity": {
//                             "low": 325,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "SheMEPRo",
//                             "v": "Test for recall rel"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "a": 0
//                 }
//             }
//         ],
//         "summary": {
//             "statement": {
//                 "text": "\n  match (a:Course) return a\n  ",
//                 "parameters": {}
//             },
//             "statementType": "r",
//             "counters": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "updateStatistics": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "plan": false,
//             "profile": false,
//             "notifications": [],
//             "server": {
//                 "address": "localhost:7687",
//                 "version": "Neo4j/3.1.3"
//             },
//             "resultConsumedAfter": {
//                 "low": 0,
//                 "high": 0
//             },
//             "resultAvailableAfter": {
//                 "low": 7,
//                 "high": 0
//             }
//         }
//     };
// const _5_obj1RecMultFielPlus = {
//   "records": [
//             {
//                 "keys": [
//                     "newList",
//                     "c"
//                 ],
//                 "length": 2,
//                 "_fields": [
//                     [
//                         {
//                             "label": "Definition",
//                             "id": {
//                                 "low": 273,
//                                 "high": 0
//                             }
//                         },
//                         {
//                             "label": "Property_Theorem",
//                             "id": {
//                                 "low": 276,
//                                 "high": 0
//                             }
//                         },
//                         {
//                             "label": "Method",
//                             "id": {
//                                 "low": 277,
//                                 "high": 0
//                             }
//                         },
//                         {
//                             "label": "Example",
//                             "id": {
//                                 "low": 278,
//                                 "high": 0
//                             }
//                         },
//                         {
//                             "label": "Solution",
//                             "id": {
//                                 "low": 279,
//                                 "high": 0
//                             }
//                         }
//                     ],
//                     {
//                         "identity": {
//                             "low": 270,
//                             "high": 0
//                         },
//                         "labels": [
//                             "Course",
//                             "Container"
//                         ],
//                         "properties": {
//                             "schema": "DefProExpMeExSo",
//                             "value": "Create this new couse"
//                         }
//                     }
//                 ],
//                 "_fieldLookup": {
//                     "newList": 0,
//                     "c": 1
//                 }
//             }
//         ],
//         "summary": {
//             "statement": {
//                 "text": "\n  match (a)-[:Linked*]->(c:Course)-[ll:Linked*]->(pp:Property)\n    where id(a)=181 and id(c)=270\n    with a, c,\n    \textract( p in  collect(pp) |\n      \t{label: filter(l in labels(p) where l <> 'Property')[0], id:id(p)}\n      ) as newList\n    return newList, c\n  ",
//                 "parameters": {}
//             },
//             "statementType": "r",
//             "counters": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "updateStatistics": {
//                 "_stats": {
//                     "nodesCreated": 0,
//                     "nodesDeleted": 0,
//                     "relationshipsCreated": 0,
//                     "relationshipsDeleted": 0,
//                     "propertiesSet": 0,
//                     "labelsAdded": 0,
//                     "labelsRemoved": 0,
//                     "indexesAdded": 0,
//                     "indexesRemoved": 0,
//                     "constraintsAdded": 0,
//                     "constraintsRemoved": 0
//                 }
//             },
//             "plan": false,
//             "profile": false,
//             "notifications": [],
//             "server": {
//                 "address": "localhost:7687",
//                 "version": "Neo4j/3.1.3"
//             },
//             "resultConsumedAfter": {
//                 "low": 0,
//                 "high": 0
//             },
//             "resultAvailableAfter": {
//                 "low": 73,
//                 "high": 0
//             }
//         }
//       };

xdescribe('Test of the Parser service', ()=>{

  describe(' - Before: test the objects returned', ()=>{
    describe('Test with a obj with 0 records _1_', ()=>{
      it('Must return true', (done)=>{
        expect(_1_objORec.records.length).toBe(0);
        done();
      });
    });

    describe('Test with a obj with 1 records and 1 fields _2_', ()=>{
      it('Must return true', (done)=>{
        expect(_2_obj1Rec1Fiel.records.length).toBe(1);
        done();
      });
      it('Must return true', (done)=>{
        expect(_2_obj1Rec1Fiel.records[0]._fields.length).toBe(1);
        done();
      });
    });

    describe('Test with a obj with 1 records and multiple fields _3_', ()=>{
      it('Must return true', (done)=>{
        expect(_3_obj1RecMultFiel.records.length).toBe(1);
        done();
      });
      it('Must return true', (done)=>{
        expect(_3_obj1RecMultFiel.records[0]._fields[0].length).not.toBeLessThan(2);
        done();
      });
    });

    describe('Test with a obj with multiple records and 1 fields _4_', ()=>{
      it('Must return true', (done)=>{
        expect(_4_objMultRec1Fiel.records.length).not.toBeLessThan(2);
        done();
      });
      it('Must return true', (done)=>{
        expect(_4_objMultRec1Fiel.records[0]._fields.length).toBe(1);
        done();
      });
    });
  });

  describe(' - Then: Test the parser', ()=>{
    describe('Test with a obj with 0 records _1_', ()=>{
      it('Must return true', (done)=>{
        let newObj = parser.dataMapper(_1_objORec);
        expect(newObj.length).not.toBeLessThan(1);
        done();
      });
    });

    describe('Test with a obj with 1 records and 1 fields _2_', ()=>{
      it('Must return true', (done)=>{
        let newObj = parser.dataMapper(_2_obj1Rec1Fiel);
        expect(newObj.length).not.toBeLessThan(1);
        done();
      });
    });

    describe('Test with a obj with 1 records and multiple fields _3_', ()=>{
      it('Must return true', (done)=>{
        let newObj = parser.dataMapper(_3_obj1RecMultFiel);
        expect(newObj.length).not.toBeLessThan(1);
        done();
      });
    });

    describe('Test with a obj with multiple records and 1 fields _4_', ()=>{
      it('Must return true', (done)=>{
        let newObj = parser.dataMapper(_4_objMultRec1Fiel);
        expect(newObj.length).not.toBeLessThan(1);
        done();
      });
    });
  });

});
//
// transaction = (query)=>{
//   return new Promise((resolve, reject)=>{
//     session = driver.session();
//     session.readTransaction(query)
//     .then(data =>{
//       resolve(parser.dataMapper(data));
//     })
//     .catch(error =>{
//       reject(error);
//     });
//   });
// };

describe('Parser Test ::  ', ()=>{
  describe('Parse a single object', ()=>{
    it('Must return true', (done)=>{
      query = "match (a:Account) return a limit 1";
      session.readTransaction(tx => tx.run(query))
      .then(data =>{
        return parser.dataMapper(data);
      })
      .then( data => {
        bool = true;
        data.map(x => {
          typeof x == Object ? bool = false: null
        });
        return bool;
      })
      .then( bool => {
        expect(bool).toBe(true);
        done();
      });
    });
  });
});
