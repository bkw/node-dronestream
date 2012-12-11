/*jshint browser:true */
/*global jsfeat:true console:true */
(function (window, document, undefined) {
    'use strict';
    var NodecopterTrack,
        lastTime;

    function schedule (callback, element) {
          var requestAnimationFrame =
              window.requestAnimationFrame        ||
              window.webkitRequestAnimationFrame  ||
              window.mozRequestAnimationFrame     ||
              window.oRequestAnimationFrame       ||
              window.msRequestAnimationFrame      ||
              function(callback, element) {
                  var currTime = new Date().getTime(),
                      timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                      id = window.setTimeout(function() {
                            callback(currTime + timeToCall);
                      }, timeToCall);
                  lastTime = currTime + timeToCall;
                  return id;
              };

          return requestAnimationFrame.call(window, callback, element);
    }


    var relMouseCoords = function (event) {
        var totalOffsetX = 0,
            totalOffsetY = 0,
            canvasX = 0,
            canvasY = 0,
            currentElement = this;

        do {
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        } while (currentElement = currentElement.offsetParent);

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        return {x:canvasX, y:canvasY};
    };


    NodecopterTrack = function (copterStream, imgId) {
        var tracker = this;
        this.curr_img_pyr = new jsfeat.pyramid_t(3);
        this.prev_img_pyr = new jsfeat.pyramid_t(3);
        this.point_count  = 0;
        this.point_status = new Uint8Array(1);
        this.prev_xy      = new Float32Array(2);
        this.curr_xy      = new Float32Array(2);
        this.copterStream = copterStream;
        this.canvas       = copterStream.getCanvas();
        this.rgbaData     = new Uint8Array(
            this.canvas.width * this.canvas.height * 4
        ); // RGBA
        this.crosshairs   = document.querySelector(imgId);

        this.curr_img_pyr.allocate(
            this.canvas.width, this.canvas.height, jsfeat.U8_t | jsfeat.C1_t
        );
        this.prev_img_pyr.allocate(
            this.canvas.width, this.canvas.height, jsfeat.U8_t | jsfeat.C1_t
        );

        this.canvas.addEventListener('click', function(event) {
            tracker.canvasClickHandler(event);
        }, false);
        HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
        // this.canvas.prototype.relMouseCoords = relMouseCoords;

        this.update();
    };

    NodecopterTrack.prototype.update = function () {
        var _pt_xy, _pyr,
            tracker = this;

        schedule(function () {
            tracker.update();
        });

        if (! this.point_count) {
            this.crosshairs.style.display = 'none';
            return;
        }

        _pt_xy = this.prev_xy;
        _pyr = this.prev_img_pyr;

        this.prev_xy = this.curr_xy;
        this.curr_xy = _pt_xy;

        this.prev_img_pyr = this.curr_img_pyr;
        this.curr_img_pyr = _pyr; // reuse old pyramid data structure

        this.copterStream.getImageData(this.rgbaData);
        jsfeat.imgproc.grayscale(
            this.rgbaData,
            this.curr_img_pyr.data[0].data
        );

        // optional: enhance contrast:
        jsfeat.imgproc.equalize_histogram(
            this.curr_img_pyr.data[0].data,
            this.curr_img_pyr.data[0].data
        );

        this.curr_img_pyr.build(this.curr_img_pyr.data[0], true);

        jsfeat.optical_flow_lk.track(
            this.prev_img_pyr,
            this.curr_img_pyr,
            this.prev_xy,
            this.curr_xy,
            1,
            50,            // win_size
            30,            // max_iterations
            this.point_status,
            0.01,          // epsilon,
            0.001          // min_eigen
        );

        if (this.point_status[0] == 1) {
            this.crosshairs.style.left = (this.curr_xy[0] - 83) + 'px';
            this.crosshairs.style.top = (
                this.canvas.height - 83 - this.curr_xy[1]
            ) + 'px';
            this.crosshairs.style.display = 'block';
        } else {
            this.point_count = 0;
            console.log('lost target');
        }
    };

    NodecopterTrack.prototype.canvasClickHandler = function (e) {
        var coords = this.canvas.relMouseCoords(e);
        if (
            (coords.x > 0) &&
            (coords.y > 0) &&
            (coords.x < this.canvas.width) &&
            (coords.y < this.canvas.height)
        ) {
            this.curr_xy[0] = coords.x;
            this.curr_xy[1] = this.canvas.height - coords.y;
            this.point_count = 1;
        }
        console.log('Click:', coords);
    };

    window.NodecopterTrack = NodecopterTrack;

}(window, document, undefined));
