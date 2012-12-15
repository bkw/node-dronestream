/*
 * Sets up a real stream + attaches it to a server
 */
module.exports.attach = function droneStream(server) {
  var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({server: server})
    , sockets = []
    , Parser = require('./PaVEParser')
    , arDrone = require('ar-drone')
    ;

  function init() {
      var tcpVideoStream = new arDrone.Client.PngStream.TcpVideoStream({timeout: 4000})
        , p = new Parser();

      console.log("Connecting to stream");

      tcpVideoStream.connect(function () {
          tcpVideoStream.pipe(p);
      });

      tcpVideoStream.on("error", function(err) {
        console.log("There was an error: %s", err.message);
        tcpVideoStream.end();
        tcpVideoStream.emit("end");
        init();
      });

      p.on('data', function (data) {
        sockets.forEach(function(socket) {
          socket.send(data, {binary: true});
        });
      });
  }
  init();

  wss.on('connection', function (socket) {
    sockets.push(socket);

    socket.on("close", function() {
      console.log("Closing socket");
      sockets = sockets.filter(function(el) {
        return el !== socket;
      });
    });
  });
};
