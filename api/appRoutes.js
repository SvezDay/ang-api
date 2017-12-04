"use-strict";
const express = require('express');
const apoc = require('apoc');
const neo4j = require('neo4j-driver').v1;
const version = require('../package.json').version;

const user = require('./controllers/user.controller');
const admin = require('./controllers/admin.controller');
const container = require('./controllers/container.controller');
const note = require('./controllers/note.controller');
const todo = require('./controllers/todo.controller');

// const multer = require('multer');
// const upload = multer()

module.exports = ()=>{
   let routes = express.Router();
   routes
   // ADMIN
   // USER
      .get('/user_profile', user.user_profile)
      .put('/user_update_properties', user.update_properties)
      .get('/user_download_all', user.download_all)
      // .post('/user_upload_data', upload.any(), user.upload_data)
      // .post('/user_upload_data', user.upload_data)
      // .post('/user_upload_data', upload.any(), (req, res, next)=>{
      //   console.log('req.body', req.files)
      //   console.log('files', Object.keys(req))
      //   res.status(200).json({mes: 'ok'})
      // })

   // NOTES
      .post('/create_empty_note', note.create_empty_note)
      .get('/note_get_label', note.get_label)
      .get('/get_all_note', note.get_all_note)
      .get('/get_note_detail/:id', note.get_note_detail)
      .post('/note_update', note.update)
      .post('/note_add_property', note.add_property)
      .delete('/delete_property/:container_id/:property_id', note.delete_property)
      .post('/note_drop_property', note.drop_property)

    // CONTAINER & ARBORESCENCE
      .post('/container_get_sub_container', container.get_sub_container)
      .post('/change_container_path', container.change_container_path)
      .delete('/delete_container/:id', container.delete_container)

    // TODOS
      .get('/todo_list', todo.list)
      .post('/todo_create_task', todo.create_task)
      .delete('/todo_delete_task/:id', todo.delete_task)
      .post('/todo_update_task', todo.update_task)
      //
      .post('/todo_task_for_today', todo.task_for_today) // todo to today
      .post('/todo_task_for_later', todo.task_for_later) // today to todo
      //
      .post('/todo_close_task', todo.close_task)
      .post('/todo_reopen_task', todo.reopen_task)



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
