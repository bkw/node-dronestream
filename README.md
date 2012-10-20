# node-dronestream

Get a realtime live video stream from your
[Parrot AR Drone 2.0](http://ardrone2.parrot.com/) straight to your browser.

## Requirements

You'll needs a decent a decent and current browser and some cpu horsepower.
This code uses web-sockets and the incredibly awesome
[Broadway.js](https://github.com/mbebenita/Broadway) to render the video frames
in your browser using a WebGL canvas.


## How it works

The drone sends a proprietary video feed on 192.168.1.1 port 5555. This is
mostly a h264 baseline video, but adds custom framing. These frames are parsed
and mostly disposed of. The remaining h264 payload is split into NAL units and
sent to the browser via web sockets.

In the browser broadway takes care of the rendering of the WebGL canvas.

## Status

For this release I was exclusively interested in the lowest possible latency.
There is no error handling for the websockets, the connection to the drone or
the video player what-so-ever. This may come eventually, or may not. I think it
is enough to be used as a starting point for your own integration.

## Thanks

- Triple high fives to Felix 'felixge' Geisendörfer for getting the whole
  NodeCopter movement started and being extremely helpful in the process of
  getting this together.

- André 'zoddy' Kussmann for supplying the drone and allowing me to keep
  hacking on it, even when he had to cancel the NodeCopter event for himself.

- Michael Bebenita, Alon Zakai, Andreas Gal and Mathieu 'p01' Henri for the
  magic of Broadway.js

- Johann Phillip Strathausen for being a great team mate at NodeCopter 2012
  Berlin.

- Brian Leroux for being not content with the original solution and for
  cleaning up the predecessor, nodecopter-stream.

