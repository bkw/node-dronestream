/*jshint browser:true */
/*global Avc:true, YUVWebGLCanvas: true, Size: true */
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
        var lumaSize = width * height,
            chromaSize = lumaSize >> 2;
        webGLCanvas.YTexture.fill(buffer.subarray(0, lumaSize));
        webGLCanvas.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
        webGLCanvas.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
        webGLCanvas.drawScene();
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
            window.document.location.port
        );
        socket.binaryType = 'arraybuffer';
        socket.onmessage = handleNalUnits;
    };

    window.NodecopterStream = NS;

}(window, document, undefined));
