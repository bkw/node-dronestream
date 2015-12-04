/*jshint browser:true */
/*global Avc:true, YUVWebGLCanvas: true, Size: true, requestAnimationFrame:true */

/* requestAnimationFrame polyfill: */
(function (window) {
    'use strict';
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for (x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[
            vendors[x] + 'RequestAnimationFrame'
        ];
        window.cancelAnimationFrame = window[
            vendors[x] + 'CancelAnimationFrame'
        ] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeToCall;
            return window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}(window));


/* NodeCopterStream: */
(function (window, document, undefined) {
    'use strict';
    var NS;
    var socket;
    var avc;
    var webGLCanvases = [];
    var webGLCanvas;
    var width;
    var height;
    var callbackOnce = null;

    function setupAvc() {
        avc = new Avc();
        avc.configure({
            filter: 'original',
            filterHorLuma: 'optimized',
            filterVerLumaEdge: 'optimized',
            getBoundaryStrengthsA: 'optimized'
        });
        avc.onPictureDecoded = handleDecodedFrame;
    }

    function handleNalUnits(message) {
        avc.decode(new Uint8Array(message.data));
    }

    function handleDecodedFrame(buffer, bufWidth, bufHeight) {
        var callback;

        requestAnimationFrame(function () {
            var lumaSize = bufWidth * bufHeight,
                chromaSize = lumaSize >> 2;

            for(var i = 0; i < webGLCanvases.length; i++)
            {   
                webGLCanvases[i].YTexture.fill(buffer.subarray(0, lumaSize));
                webGLCanvases[i].UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
                webGLCanvases[i].VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
                webGLCanvases[i].drawScene();
            }
        });

        // call callback with Y portion (grayscale image)
        if (null !== callbackOnce && width) {
            callback = callbackOnce;
            callbackOnce = null;
            // decoded buffer size may be larger,
            // so use subarray with actual dimensions
            callback(buffer.subarray(0, width * height));
        }
    }

    function setupCanvas(div) {
        var canvas = document.createElement('canvas');

        width = div.attributes.width ? div.attributes.width.value : "640";
        height = div.attributes.height ? div.attributes.height.value : "360";

        canvas.width = width;
        canvas.height = height;
        canvas.style.backgroundColor = "#333333";
        div.appendChild(canvas);

        webGLCanvases.push(new YUVWebGLCanvas(canvas, new Size(width, height)));
    }


    NS = function (div, options, div2) {
        var hostname, port;
        options = options || {};
        hostname = options.hostname || window.document.location.hostname;
        port = options.port || window.document.location.port;

        setupCanvas(div);
        if(div2){
            //If we've got a second div, set that up as well.
            setupCanvas(div2);
        }
        setupAvc();

        socket = new WebSocket(
             'ws://' + hostname + ':' + port + '/dronestream'
        );
        socket.binaryType = 'arraybuffer';
        socket.onmessage = handleNalUnits;
    };

    // enqueue callback oto be called with next (black&white) frame
    NS.prototype.onNextFrame = function (callback) {
        callbackOnce = callback;
    };

    window.NodecopterStream = NS;

}(window, document, undefined));
