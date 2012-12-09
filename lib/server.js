/*
 * Drone Stream listen:
 * Takes a) a port number or b) a server object (node http or express, etc);
 */
module.exports.dist = __dirname + '../dist';

module.exports.listen = function listen(server) {
  if(typeof server == "number") {
    var port = server;
    server = require("http").createServer();
    server.listen(port);
  } 

  return require("./stream").attach(server);
};
