var express = require('express')
  , routes = require('./routes')
  , app = express()
  , server = require("http").createServer(app)
  ;

require("./lib/server").listen(server);
app.get('/', routes.index);
app.listen(3000);

/*
var server = require("http").createServer(function(req, res) {
  console.log("request");
});

require("./lib/server").listen(server);
server.listen(3000);
*/
