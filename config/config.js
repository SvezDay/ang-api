"use-strict";
const auth_google = require('./auth_google');

exports.CONFIG = {
   auth_google: auth_google
}

exports.back = {
  host: "127.0.0.1",
  post: 7474,
  neousr: "neo4J",
  neopwd:"futur$"
}
exports.app = {
  whiteList: ["http://localhost:4200", "https://ang-app.herokuapp.com"]
}
