/*
 * Drone Stream listen:
 * Takes a) a port number or b) a server object (node http or express, etc);
 */
var staticDir = "dronestream"
  , check = new RegExp("^/" + staticDir, "i")
  , dist = __dirname + "/../dist"
  ;

module.exports.listen = function listen(server) {
  if(typeof server == "number") {
    var port = server;
    server = require("http").createServer();
    server.listen(port);
  } 

  /*
   * Serving up the static files needed
   */
  var oldHandlers = server.listeners("request").splice(0);

  server.on("request", function(req, res) {
    if(handler(req, res)) {
      return;
    }

    for(var i = 0; i < oldHandlers.length; i++) {
      oldHandlers[i].call(server, req, res);
    }
  });

  function handler(req, res, next) {
    if(!check.test(req.url)) {
      return false;
    }
    var path = dist + req.url.replace(check, "");
    console.log("checking static path: %s", path);
    var read = require('fs').createReadStream(path);
    read.pipe(res);
    read.on("error", function(e) { console.log("Stream error: %s", e.message); });

    return true;
  }
 
  /*
   * Connecting stream + websocket server
   */
  return require("./stream").attach(server);
};
