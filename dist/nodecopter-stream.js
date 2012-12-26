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
    var NS,
        socket,
        avc,
        webGLCanvas;

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

    function handleDecodedFrame(buffer, width, height) {
        requestAnimationFrame(function () {
            var lumaSize = width * height,
            chromaSize = lumaSize >> 2;
            webGLCanvas.YTexture.fill(buffer.subarray(0, lumaSize));
            webGLCanvas.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
            webGLCanvas.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
            webGLCanvas.drawScene();
        });
    }

    function setupCanvas(div) {
        var width = div.attributes.width ? div.attributes.width.value : 640,
            height = div.attributes.height ? div.attributes.height.value : 360,
            canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;
        canvas.style.backgroundColor = "#333333";
        div.appendChild(canvas);

        webGLCanvas = new YUVWebGLCanvas(canvas, new Size(width, height));
    }


    NS = function (div) {
        setupCanvas(div);
        setupAvc();

        socket = new WebSocket(
             'ws://' +
            window.document.location.hostname + ':' +
            window.document.location.port + '/dronestream'
        );
        socket.binaryType = 'arraybuffer';
        socket.onmessage = handleNalUnits;
    };

    window.NodecopterStream = NS;

}(window, document, undefined));
