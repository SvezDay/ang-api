const request = require('request');
const parser = require('../api/services/parser');

const _1_objORec = {
      "records": [],
        "summary": {
            "statement": {
                "text": "\n  match (a:Account) return a\n  ",
                "parameters": {}
            },
            "statementType": "r",
            "counters": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "updateStatistics": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "plan": false,
            "profile": false,
            "notifications": [],
            "server": {
                "address": "localhost:7687",
                "version": "Neo4j/3.1.3"
            },
            "resultConsumedAfter": {
                "low": 0,
                "high": 0
            },
            "resultAvailableAfter": {
                "low": 8,
                "high": 0
            }
        }
};
const _2_obj1Rec1Fiel = {
      "records": [
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 181,
                            "high": 0
                        },
                        "labels": [
                            "Account"
                        ],
                        "properties": {
                            "password": "temor",
                            "middle": "undefined",
                            "last": "temor",
                            "email": "igor@temor.io",
                            "first": "igor"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            }
        ],
        "summary": {
            "statement": {
                "text": "\n  match (a:Account) return a\n  ",
                "parameters": {}
            },
            "statementType": "r",
            "counters": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "updateStatistics": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "plan": false,
            "profile": false,
            "notifications": [],
            "server": {
                "address": "localhost:7687",
                "version": "Neo4j/3.1.3"
            },
            "resultConsumedAfter": {
                "low": 0,
                "high": 0
            },
            "resultAvailableAfter": {
                "low": 8,
                "high": 0
            }
        }
};
const _3_obj1RecMultFiel = {
        "records": [
            {
                "keys": [
                    "collect(a)"
                ],
                "length": 1,
                "_fields": [
                    [
                        {
                            "identity": {
                                "low": 243,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "PriMeFoExRe",
                                "value": "Math Inter"
                            }
                        },
                        {
                            "identity": {
                                "low": 257,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "DefProExpMeExSo",
                                "value": "undefined"
                            }
                        },
                        {
                            "identity": {
                                "low": 270,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "DefProExpMeExSo",
                                "value": "Create this new couse"
                            }
                        },
                        {
                            "identity": {
                                "low": 280,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "DefProExpMeExSo",
                                "value": "Test of course creation"
                            }
                        },
                        {
                            "identity": {
                                "low": 286,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "DefProExpMeExSo",
                                "value": "Test of course creation"
                            }
                        },
                        {
                            "identity": {
                                "low": 293,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "DefProExpMeExSo",
                                "value": "Test of course creation"
                            }
                        },
                        {
                            "identity": {
                                "low": 325,
                                "high": 0
                            },
                            "labels": [
                                "Course",
                                "Container"
                            ],
                            "properties": {
                                "schema": "SheMEPRo",
                                "v": "Test for recall rel"
                            }
                        }
                    ]
                ],
                "_fieldLookup": {
                    "collect(a)": 0
                }
            }
        ],
        "summary": {
            "statement": {
                "text": "\n  match (a:Course) return collect(a)\n  ",
                "parameters": {}
            },
            "statementType": "r",
            "counters": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "updateStatistics": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "plan": false,
            "profile": false,
            "notifications": [],
            "server": {
                "address": "localhost:7687",
                "version": "Neo4j/3.1.3"
            },
            "resultConsumedAfter": {
                "low": 1,
                "high": 0
            },
            "resultAvailableAfter": {
                "low": 12,
                "high": 0
            }
        }
      };
const _4_objMultRec1Fiel = {
        "records": [
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 243,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "PriMeFoExRe",
                            "value": "Math Inter"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 257,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "DefProExpMeExSo",
                            "value": "undefined"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 270,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "DefProExpMeExSo",
                            "value": "Create this new couse"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 280,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "DefProExpMeExSo",
                            "value": "Test of course creation"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 286,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "DefProExpMeExSo",
                            "value": "Test of course creation"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 293,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "DefProExpMeExSo",
                            "value": "Test of course creation"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            },
            {
                "keys": [
                    "a"
                ],
                "length": 1,
                "_fields": [
                    {
                        "identity": {
                            "low": 325,
                            "high": 0
                        },
                        "labels": [
                            "Course",
                            "Container"
                        ],
                        "properties": {
                            "schema": "SheMEPRo",
                            "v": "Test for recall rel"
                        }
                    }
                ],
                "_fieldLookup": {
                    "a": 0
                }
            }
        ],
        "summary": {
            "statement": {
                "text": "\n  match (a:Course) return a\n  ",
                "parameters": {}
            },
            "statementType": "r",
            "counters": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "updateStatistics": {
                "_stats": {
                    "nodesCreated": 0,
                    "nodesDeleted": 0,
                    "relationshipsCreated": 0,
                    "relationshipsDeleted": 0,
                    "propertiesSet": 0,
                    "labelsAdded": 0,
                    "labelsRemoved": 0,
                    "indexesAdded": 0,
                    "indexesRemoved": 0,
                    "constraintsAdded": 0,
                    "constraintsRemoved": 0
                }
            },
            "plan": false,
            "profile": false,
            "notifications": [],
            "server": {
                "address": "localhost:7687",
                "version": "Neo4j/3.1.3"
            },
            "resultConsumedAfter": {
                "low": 0,
                "high": 0
            },
            "resultAvailableAfter": {
                "low": 7,
                "high": 0
            }
        }
    };

describe('Test of the Parser service', ()=>{

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
