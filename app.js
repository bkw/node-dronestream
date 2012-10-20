'use strict';
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , app = express()
  , server = http.createServer(app)
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: server})
  ;

wss.on('connection', function (socket) {
    var arDrone = require('ar-drone'),
        tcpVideoStream = new arDrone.Client.PngStream.TcpVideoStream({timeout: 4000}),
        Parser = require('./lib/PaVEParser'),
        p = new Parser();

    // TODO: handle client disconnect
    p.on('data', function (data) {
        socket.send(data, {binary: true});
    });

    tcpVideoStream.connect(function () {
        tcpVideoStream.pipe(p);
    });
});


app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade', { pretty: true });
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
    app.locals.pretty = true;
});


app.get('/', routes.index);

if (module.parent) {
    module.exports = server;
} else {
    server.listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });
}
