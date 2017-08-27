"use-strict";
let express = require('express');
let apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;

let version = require('../package.json').version;

// let person = require('./controllers/personCtrl.js');
// let user = require('./controllers/userCtrl.js');
// let node = require('./controllers/nodeCtrl.js');
// let relationship = require('./controllers/relationshipCtrl.js');
// let container = require('./controllers/containerCtrl.js');
// let learningSchema = require('./controllers/learningSchemaCtrl.js');
// let course = require('./controllers/learnings/coursesCtrl.js');
let note = require('./controllers/noteCtrl.js');

const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL || "bolt://localhost:7687";
const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER || "neo4j";
const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD || "futur$";

const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

module.exports = ()=>{
   let routes = express.Router();
   routes
   // NOTES
      .post('/create_note', note.create_note)
      .get('/get_all_note', note.get_all_note)
      .get('/get_note_detail/:id', note.get_note_detail)
      .post('/update_property', note.update_property)
      .post('/add_property', note.add_property)
      .delete('/delete_property/:note_id/:property_id', note.delete_property)
      .post('/drop_property', note.drop_property)

//    .get('/users', user.getAll)
//    .get('/users/:id', user.getOne)
//    // .post('/users', user.create)
//    .put('/users', user.update)
//    .delete('/users/:id', user.delete)
// // test
//    .get('/course_list', course.course_list)
//    .post('/add_course', course.add_course)
// // Person
//    .post('/person_check', person.person_check)
// // ARBORESCENCE - Nodes
//    .put('/update_node_content', node.update_node_content)  // accountId, containerId, {new_content}
//    .put('/update_node_label', node.update_node_label)  // accountId, containerId, oldLabel, newLabel
// // ARBORESCENCE - Relationships
//    .put('/modify_relationship', relationship.modify_relationship)  // accountId, relationId, removeType, setType
// // ARBORESCENCE - Containers
//    .post('/add_first_branch', container.add_first_branch)  // accountId, title
//    .post('/add_new_branch', container.add_new_branch)  // accountId, title
//
//    .put('/add_parent', container.add_parent)  // accountId, parentContainerId, title
//    .put('/add_child', container.add_child)  // accountId, childContainerId, title
//    .put('/move_to_new_branch',container.move_to_new_branch) // accountId, containerId, newParentContent
//    .put('/move_to_existing_branch',container.move_to_existing_branch) // accountId, containerId, parentId, nextParentId
//
//    .delete('/delete_last_container', container.delete_last_container) // accoutId, containerId
//    .delete('/delete_middle_container', container.delete_middle_container) // accoutId, containerId
//
//    .get('/detail_container', container.detail_container)
//    .get('/arborescence_by_main_container', container.arborescence_by_main_container)
//
// /*    list_arborescence_container      */
// /*    detail_container                 */
//
// /*    add_relation_extra_container     */
// /*    delete_relation_extra_container  */
//
// // ARBORESCENCE - Learning schemas
//    .post('/add_another_field', learningSchema.add_another_field)
//    .post('/add_definition_to_mecanisme', learningSchema.add_definition_to_mecanisme)
//    .post('/add_case_to_solution', learningSchema.add_case_to_solution)
//    .post('/add_trad_to_trad', learningSchema.add_trad_to_trad)
//
// // Default route
//    .get('/', (req, res) => {
//       res.status(200).json({ version });
//    })
   ;

   return routes;
};
