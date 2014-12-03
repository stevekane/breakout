(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
"use strict";

function Channel(context, name) {
  var channel = context.createGain();

  var connectPanner = function (src, panner, chan) {
    src.connect(panner);
    panner.connect(chan);
  };

  var basePlay = function (options) {
    if (options === undefined) options = {};
    var shouldLoop = options.loop || false;

    return function (buffer, panner) {
      var src = channel.context.createBufferSource();

      if (panner) connectPanner(src, panner, channel);else src.connect(channel);

      src.loop = shouldLoop;
      src.buffer = buffer;
      src.start(0);
      return src;
    };
  };

  channel.connect(context.destination);

  Object.defineProperty(this, "volume", {
    enumerable: true,
    get: function () {
      return channel.gain.value;
    },
    set: function (value) {
      channel.gain.value = value;
    }
  });

  Object.defineProperty(this, "gain", {
    enumerable: true,
    get: function () {
      return channel;
    }
  });

  this.name = name;
  this.loop = basePlay({ loop: true });
  this.play = basePlay();
}

function AudioSystem(channelNames) {
  var context = new AudioContext();
  var channels = {};
  var i = -1;

  while (channelNames[++i]) {
    channels[channelNames[i]] = new Channel(context, channelNames[i]);
  }
  this.context = context;
  this.channels = channels;
}

module.exports = AudioSystem;

},{}],3:[function(require,module,exports){
"use strict";

var datGui = require("dat-gui");
var _ref = require("./gl-utils");

var clearContext = _ref.clearContext;
var _ref2 = require("./loaders");

var LoadStream = _ref2.LoadStream;
var ImageAsset = _ref2.ImageAsset;
var SoundAsset = _ref2.SoundAsset;
var AudioSystem = require("./audio");

var raf = window.requestAnimationFrame;
var setInterval = window.setInterval;

var audioSystem = new AudioSystem(["main", "bg"]);
var main = audioSystem.channels.main;
var bg = audioSystem.channels.bg;
var canvas = document.createElement("canvas");
var gui = new datGui.GUI();

//perhaps wrap this?
var gl = canvas.getContext("webgl");

var assets = {
  sounds: {
    background: "public/sounds/bgm1.mp3",
    hadouken: "public/sounds/hadouken.mp3"
  }
};

var settings = {
  audio: {
    bgVolume: 0,
    mainVolume: 1
  },
  video: {
    resolution: {
      width: 400,
      height: 600
    },
    bgColor: [100, 0, 0, 1]
  }
};

var testFns = {
  playHadouken: function () {
    return main.play(cache.sounds.hadouken);
  }
};

var loadStream = new LoadStream();
var cache = {
  sounds: {},
  sprites: {}
};

function makeUpdate() {
  return function update() {
    bg.volume = settings.audio.bgVolume;
    main.volume = settings.audio.mainVolume;
  };
}

function makeRender(gl) {
  return function render() {
    gl.canvas.width = settings.video.resolution.width;
    gl.canvas.height = settings.video.resolution.height;

    clearContext(gl, settings.video.bgColor);
    raf(render);
  };
}

var audioTab = gui.addFolder("Audio");
var videoTab = gui.addFolder("Video");
var actionTab = gui.addFolder("Actions");

audioTab.open();
videoTab.open();
actionTab.open();
audioTab.add(settings.audio, "bgVolume", [0, 0.5, 1]);
audioTab.add(settings.audio, "mainVolume", [0, 0.5, 1]);
videoTab.add(settings.video.resolution, "width", 200, 400);
videoTab.add(settings.video.resolution, "height", 400, 600);
videoTab.addColor(settings.video, "bgColor");
actionTab.add(testFns, "playHadouken");

window.gui = gui;
document.body.appendChild(canvas);

function startGame() {
  bg.loop(cache.sounds.background);
  raf(makeRender(gl));
  setInterval(makeUpdate(), 25);
}

loadStream.loadMany([new SoundAsset("background", "public/sounds/bgm1.mp3"), new SoundAsset("hadouken", "public/sounds/hadouken.mp3")]);
loadStream.on("load", function (asset) {
  var key = null;

  if (asset instanceof SoundAsset) key = "sounds";else if (asset instanceof ImageAsset) key = "sprites";
  cache[key][asset.name] = asset.data;
});
loadStream.on("error", function (asset) {
  console.log(asset.name + " failed to load");
});
loadStream.on("done", function () {
  startGame();
});

},{"./audio":2,"./gl-utils":4,"./loaders":5,"dat-gui":"dat-gui"}],4:[function(require,module,exports){
"use strict";

var utils = {};

var clearContext = function (gl, color) {
  var r = color[0] / 255;
  var g = color[1] / 255;
  var b = color[2] / 255;
  var a = color[3];

  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);
};

var updateBuffer = function (gl, program, chunkSize, attrName, data) {
  var attribute = program.attributes[attrName];
  var buffer = program.buffers[attrName];

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0);
  return buffer;
};

//given src and type, compile and return shader
function compile(gl, shaderType, src) {
  var shader = gl.createShader(shaderType);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

//link your program w/ opengl
function link(gl, vs, fs) {
  var program = gl.createProgram();

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

/*
 * We want to create a wrapper for a loaded gl program
 * that includes pointers to all the uniforms and attributes
 * defined for this program.  This makes it more convenient
 * to change these values
 */
var LoadedProgram = function (gl, vSrc, fSrc) {
  var vs = compile(gl, gl.VERTEX_SHADER, vSrc);
  var fs = compile(gl, gl.FRAGMENT_SHADER, fSrc);
  var program = link(gl, vs, fs);
  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var lp = {
    vertex: {
      src: vSrc,
      shader: vs
    },
    fragment: {
      src: fSrc,
      shader: fs
    },
    program: program,
    uniforms: {},
    attributes: {},
    buffers: {}
  };
  var aName;
  var uName;

  for (var i = 0; i < numAttributes; ++i) {
    aName = gl.getActiveAttrib(program, i).name;
    lp.attributes[aName] = gl.getAttribLocation(program, aName);
    lp.buffers[aName] = gl.createBuffer();
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName = gl.getActiveUniform(program, j).name;
    lp.uniforms[uName] = gl.getUniformLocation(program, uName);
  }

  return lp;
};

utils.clearContext = clearContext;
utils.updateBuffer = updateBuffer;
utils.LoadedProgram = LoadedProgram;
module.exports = utils;

},{}],5:[function(require,module,exports){
"use strict";

var _ref = require("events");

var EventEmitter = _ref.EventEmitter;


function Asset(name, path) {
  this.name = name;
  this.path = path;
  this.data = null;
}

function ImageAsset(name, path) {
  Asset.call(this, name, path);
}

function SoundAsset(name, path) {
  Asset.call(this, name, path);
}

function LoadStream() {
  var _this = this;
  var audioCtx = new (AudioContext || webkitAudioContext)();
  var inFlightCount = 0;

  EventEmitter.call(this);

  var emitResult = function (eventName, asset) {
    inFlightCount--;
    _this.emit(eventName, asset);
    if (inFlightCount === 0) _this.emit("done");
  };

  var loadImage = function (asset) {
    asset.data = new Image();

    asset.data.onload = function () {
      return emitResult("load", asset);
    };
    asset.data.onerror = function () {
      return emitResult("error", asset);
    };
    asset.data.src = asset.path;
  };

  var loadSound = function (asset) {
    fetch("arraybuffer", asset.path, function (err, binary) {
      if (err) return this.returnError(asset);

      var decodeSuccess = function (buffer) {
        asset.data = buffer;
        emitResult("load", asset);
      };
      var decodeFailure = function (err) {
        emitResult("error", asset);
      };

      audioCtx.decodeAudioData(binary, decodeSuccess, decodeFailure);
    });
  };

  this.load = function (asset) {
    inFlightCount++;
    if (asset instanceof SoundAsset) loadSound(asset);else if (asset instanceof ImageAsset) loadImage(asset);else throw new Error("invalid asset");
  };

  this.loadMany = function (assets) {
    return assets.forEach(_this.load, _this);
  };
}

LoadStream.prototype = Object.create(EventEmitter.prototype);

function fetch(type, path, cb) {
  var xhr = new XMLHttpRequest();

  xhr.responseType = type;
  xhr.onload = function () {
    return cb(null, xhr.response);
  };
  xhr.onerror = function () {
    return cb(new Error("Could not load " + path));
  };
  xhr.open("GET", path, true);
  xhr.send(null);
}

module.exports.ImageAsset = ImageAsset;
module.exports.SoundAsset = SoundAsset;
module.exports.LoadStream = LoadStream;

},{"events":1}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2F1ZGlvLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvYnJlYWtvdXQuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC11dGlscy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xvYWRlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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RSxFQUFFLEVBQUU7QUFDOUIsTUFBSSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUEsQ0FBQTs7QUFFNUIsS0FBRyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7QUFDdkIsS0FBRyxDQUFDLE1BQU0sR0FBUztXQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQztHQUFBLENBQUE7QUFDL0MsS0FBRyxDQUFDLE9BQU8sR0FBUTtXQUFNLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsQ0FBQztHQUFBLENBQUE7QUFDaEUsS0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQzNCLEtBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDZjs7QUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7QUFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0FBQ3RDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJmdW5jdGlvbiBDaGFubmVsIChjb250ZXh0LCBuYW1lKSB7XG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcbiAgXG4gIGxldCBjb25uZWN0UGFubmVyID0gZnVuY3Rpb24gKHNyYywgcGFubmVyLCBjaGFuKSB7XG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxuICB9XG5cbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcbiAgICBsZXQgc2hvdWxkTG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xuICAgICAgbGV0IHNyYyA9IGNoYW5uZWwuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSBcblxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcbiAgICAgIGVsc2UgICAgICAgIHNyYy5jb25uZWN0KGNoYW5uZWwpXG5cbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXG4gICAgICBzcmMuYnVmZmVyID0gYnVmZmVyXG4gICAgICBzcmMuc3RhcnQoMClcbiAgICAgIHJldHVybiBzcmNcbiAgICB9IFxuICB9XG5cbiAgY2hhbm5lbC5jb25uZWN0KGNvbnRleHQuZGVzdGluYXRpb24pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XG4gIH0pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cbiAgfSlcblxuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcbiAgdGhpcy5wbGF5ID0gYmFzZVBsYXkoKVxufVxuXG5mdW5jdGlvbiBBdWRpb1N5c3RlbSAoY2hhbm5lbE5hbWVzKSB7XG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcbiAgbGV0IGNoYW5uZWxzID0ge31cbiAgbGV0IGkgICAgICAgID0gLTFcblxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcbiAgICBjaGFubmVsc1tjaGFubmVsTmFtZXNbaV1dID0gbmV3IENoYW5uZWwoY29udGV4dCwgY2hhbm5lbE5hbWVzW2ldKVxuICB9XG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxuICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb1N5c3RlbVxuIiwibGV0IGRhdEd1aSA9IHJlcXVpcmUoXCJkYXQtZ3VpXCIpXG5sZXQge2NsZWFyQ29udGV4dH0gPSByZXF1aXJlKFwiLi9nbC11dGlsc1wiKVxubGV0IHtMb2FkU3RyZWFtLCBJbWFnZUFzc2V0LCBTb3VuZEFzc2V0fSA9IHJlcXVpcmUoXCIuL2xvYWRlcnNcIilcbmxldCBBdWRpb1N5c3RlbSA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpXG5cbmxldCByYWYgICAgICAgICA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbmxldCBzZXRJbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbFxuXG5sZXQgYXVkaW9TeXN0ZW0gPSBuZXcgQXVkaW9TeXN0ZW0oW1wibWFpblwiLCBcImJnXCJdKVxubGV0IHttYWluLCBiZ30gID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcbmxldCBjYW52YXMgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbmxldCBndWkgICAgICAgICA9IG5ldyBkYXRHdWkuR1VJKClcblxuLy9wZXJoYXBzIHdyYXAgdGhpcz9cbmxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIilcblxubGV0IGFzc2V0cyA9IHtcbiAgc291bmRzOiB7XG4gICAgYmFja2dyb3VuZDogXCJwdWJsaWMvc291bmRzL2JnbTEubXAzXCIsXG4gICAgaGFkb3VrZW46ICAgXCJwdWJsaWMvc291bmRzL2hhZG91a2VuLm1wM1wiIFxuICB9XG59XG5cbmxldCBzZXR0aW5ncyA9IHtcbiAgYXVkaW86IHtcbiAgICBiZ1ZvbHVtZTogICAwLjAsXG4gICAgbWFpblZvbHVtZTogMS4wXG4gIH0sXG4gIHZpZGVvOiB7XG4gICAgcmVzb2x1dGlvbjoge1xuICAgICAgd2lkdGg6IDQwMCxcbiAgICAgIGhlaWdodDogNjAwXG4gICAgfSxcbiAgICBiZ0NvbG9yOiBbMTAwLCAwLCAwLCAxLjBdXG4gIH1cbn1cblxubGV0IHRlc3RGbnMgPSB7XG4gIHBsYXlIYWRvdWtlbjogKCkgPT4gbWFpbi5wbGF5KGNhY2hlLnNvdW5kcy5oYWRvdWtlbilcbn1cblxubGV0IGxvYWRTdHJlYW0gPSBuZXcgTG9hZFN0cmVhbVxubGV0IGNhY2hlID0ge1xuICBzb3VuZHM6ICB7fSxcbiAgc3ByaXRlczoge31cbn1cblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIGJnLnZvbHVtZSAgID0gc2V0dGluZ3MuYXVkaW8uYmdWb2x1bWVcbiAgICBtYWluLnZvbHVtZSA9IHNldHRpbmdzLmF1ZGlvLm1haW5Wb2x1bWVcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlUmVuZGVyIChnbCkge1xuICByZXR1cm4gZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBnbC5jYW52YXMud2lkdGggID0gc2V0dGluZ3MudmlkZW8ucmVzb2x1dGlvbi53aWR0aFxuICAgIGdsLmNhbnZhcy5oZWlnaHQgPSBzZXR0aW5ncy52aWRlby5yZXNvbHV0aW9uLmhlaWdodFxuXG4gICAgY2xlYXJDb250ZXh0KGdsLCBzZXR0aW5ncy52aWRlby5iZ0NvbG9yKVxuICAgIHJhZihyZW5kZXIpIFxuICB9XG59XG5cbmxldCBhdWRpb1RhYiAgPSBndWkuYWRkRm9sZGVyKFwiQXVkaW9cIilcbmxldCB2aWRlb1RhYiAgPSBndWkuYWRkRm9sZGVyKFwiVmlkZW9cIilcbmxldCBhY3Rpb25UYWIgPSBndWkuYWRkRm9sZGVyKFwiQWN0aW9uc1wiKVxuXG5hdWRpb1RhYi5vcGVuKClcbnZpZGVvVGFiLm9wZW4oKVxuYWN0aW9uVGFiLm9wZW4oKVxuYXVkaW9UYWIuYWRkKHNldHRpbmdzLmF1ZGlvLCBcImJnVm9sdW1lXCIsIFswLjAsIDAuNSwgMS4wXSlcbmF1ZGlvVGFiLmFkZChzZXR0aW5ncy5hdWRpbywgXCJtYWluVm9sdW1lXCIsIFswLjAsIDAuNSwgMS4wXSlcbnZpZGVvVGFiLmFkZChzZXR0aW5ncy52aWRlby5yZXNvbHV0aW9uLCBcIndpZHRoXCIsIDIwMCwgNDAwKVxudmlkZW9UYWIuYWRkKHNldHRpbmdzLnZpZGVvLnJlc29sdXRpb24sIFwiaGVpZ2h0XCIsIDQwMCwgNjAwKVxudmlkZW9UYWIuYWRkQ29sb3Ioc2V0dGluZ3MudmlkZW8sIFwiYmdDb2xvclwiKVxuYWN0aW9uVGFiLmFkZCh0ZXN0Rm5zLCBcInBsYXlIYWRvdWtlblwiKVxuXG53aW5kb3cuZ3VpID0gZ3VpXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcblxuZnVuY3Rpb24gc3RhcnRHYW1lICgpIHtcbiAgYmcubG9vcChjYWNoZS5zb3VuZHMuYmFja2dyb3VuZClcbiAgcmFmKG1ha2VSZW5kZXIoZ2wpKVxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKCksIDI1KVxufVxuXG5sb2FkU3RyZWFtLmxvYWRNYW55KFtcbiAgbmV3IFNvdW5kQXNzZXQoXCJiYWNrZ3JvdW5kXCIsIFwicHVibGljL3NvdW5kcy9iZ20xLm1wM1wiKSxcbiAgbmV3IFNvdW5kQXNzZXQoXCJoYWRvdWtlblwiLCBcInB1YmxpYy9zb3VuZHMvaGFkb3VrZW4ubXAzXCIpLFxuXSlcbmxvYWRTdHJlYW0ub24oXCJsb2FkXCIsIGZ1bmN0aW9uIChhc3NldCkge1xuICBsZXQga2V5ID0gbnVsbFxuXG4gIGlmIChhc3NldCBpbnN0YW5jZW9mIFNvdW5kQXNzZXQpICAgICAga2V5ID0gXCJzb3VuZHNcIlxuICBlbHNlIGlmIChhc3NldCBpbnN0YW5jZW9mIEltYWdlQXNzZXQpIGtleSA9IFwic3ByaXRlc1wiXG4gIGNhY2hlW2tleV1bYXNzZXQubmFtZV0gPSBhc3NldC5kYXRhXG59KVxubG9hZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChhc3NldCkge1xuICBjb25zb2xlLmxvZyhhc3NldC5uYW1lICsgXCIgZmFpbGVkIHRvIGxvYWRcIilcbn0pXG5sb2FkU3RyZWFtLm9uKFwiZG9uZVwiLCBmdW5jdGlvbiAoKSB7XG4gIHN0YXJ0R2FtZSgpXG59KVxuIiwidmFyIHV0aWxzID0ge31cblxudmFyIGNsZWFyQ29udGV4dCA9IGZ1bmN0aW9uIChnbCwgY29sb3IpIHtcbiAgbGV0IHIgPSBjb2xvclswXSAvIDI1NVxuICBsZXQgZyA9IGNvbG9yWzFdIC8gMjU1XG4gIGxldCBiID0gY29sb3JbMl0gLyAyNTVcbiAgbGV0IGEgPSBjb2xvclszXVxuICBcbiAgZ2wuY2xlYXJDb2xvcihyLCBnLCBiLCBhKVxuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxufVxuXG52YXIgdXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBwcm9ncmFtLCBjaHVua1NpemUsIGF0dHJOYW1lLCBkYXRhKSB7XG4gIHZhciBhdHRyaWJ1dGUgPSBwcm9ncmFtLmF0dHJpYnV0ZXNbYXR0ck5hbWVdXG4gIHZhciBidWZmZXIgICAgPSBwcm9ncmFtLmJ1ZmZlcnNbYXR0ck5hbWVdXG5cbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0cmlidXRlKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGF0dHJpYnV0ZSwgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXG4gIHJldHVybiBidWZmZXJcbn1cblxuLy9naXZlbiBzcmMgYW5kIHR5cGUsIGNvbXBpbGUgYW5kIHJldHVybiBzaGFkZXJcbmZ1bmN0aW9uIGNvbXBpbGUgKGdsLCBzaGFkZXJUeXBlLCBzcmMpIHtcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKVxuXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG4gIHJldHVybiBzaGFkZXJcbn1cblxuLy9saW5rIHlvdXIgcHJvZ3JhbSB3LyBvcGVuZ2xcbmZ1bmN0aW9uIGxpbmsgKGdsLCB2cywgZnMpIHtcbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKClcblxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpIFxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpIFxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vKlxuICogV2Ugd2FudCB0byBjcmVhdGUgYSB3cmFwcGVyIGZvciBhIGxvYWRlZCBnbCBwcm9ncmFtXG4gKiB0aGF0IGluY2x1ZGVzIHBvaW50ZXJzIHRvIGFsbCB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXNcbiAqIGRlZmluZWQgZm9yIHRoaXMgcHJvZ3JhbS4gIFRoaXMgbWFrZXMgaXQgbW9yZSBjb252ZW5pZW50XG4gKiB0byBjaGFuZ2UgdGhlc2UgdmFsdWVzXG4gKi9cbnZhciBMb2FkZWRQcm9ncmFtID0gZnVuY3Rpb24gKGdsLCB2U3JjLCBmU3JjKSB7XG4gIHZhciB2cyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcbiAgdmFyIGZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZTcmMpXG4gIHZhciBwcm9ncmFtICAgICAgID0gbGluayhnbCwgdnMsIGZzKVxuICB2YXIgbnVtQXR0cmlidXRlcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpXG4gIHZhciBudW1Vbmlmb3JtcyAgID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpXG4gIHZhciBscCA9IHtcbiAgICB2ZXJ0ZXg6IHtcbiAgICAgIHNyYzogICAgdlNyYyxcbiAgICAgIHNoYWRlcjogdnMgXG4gICAgfSxcbiAgICBmcmFnbWVudDoge1xuICAgICAgc3JjOiAgICBmU3JjLFxuICAgICAgc2hhZGVyOiBmcyBcbiAgICB9LFxuICAgIHByb2dyYW06ICAgIHByb2dyYW0sXG4gICAgdW5pZm9ybXM6ICAge30sIFxuICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgIGJ1ZmZlcnM6ICAgIHt9XG4gIH1cbiAgdmFyIGFOYW1lXG4gIHZhciB1TmFtZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQXR0cmlidXRlczsgKytpKSB7XG4gICAgYU5hbWUgICAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVBdHRyaWIocHJvZ3JhbSwgaSkubmFtZVxuICAgIGxwLmF0dHJpYnV0ZXNbYU5hbWVdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYU5hbWUpXG4gICAgbHAuYnVmZmVyc1thTmFtZV0gICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICB9XG5cbiAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1Vbmlmb3JtczsgKytqKSB7XG4gICAgdU5hbWUgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShwcm9ncmFtLCBqKS5uYW1lXG4gICAgbHAudW5pZm9ybXNbdU5hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIHVOYW1lKVxuICB9XG5cbiAgcmV0dXJuIGxwIFxufVxuXG51dGlscy5jbGVhckNvbnRleHQgID0gY2xlYXJDb250ZXh0XG51dGlscy51cGRhdGVCdWZmZXIgID0gdXBkYXRlQnVmZmVyXG51dGlscy5Mb2FkZWRQcm9ncmFtID0gTG9hZGVkUHJvZ3JhbVxubW9kdWxlLmV4cG9ydHMgICAgICA9IHV0aWxzXG4iLCJsZXQge0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlKFwiZXZlbnRzXCIpXG5cbmZ1bmN0aW9uIEFzc2V0IChuYW1lLCBwYXRoKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5wYXRoID0gcGF0aFxuICB0aGlzLmRhdGEgPSBudWxsXG59XG5cbmZ1bmN0aW9uIEltYWdlQXNzZXQgKG5hbWUsIHBhdGgpIHtcbiAgQXNzZXQuY2FsbCh0aGlzLCBuYW1lLCBwYXRoKVxufVxuXG5mdW5jdGlvbiBTb3VuZEFzc2V0IChuYW1lLCBwYXRoKSB7XG4gIEFzc2V0LmNhbGwodGhpcywgbmFtZSwgcGF0aClcbn1cblxuZnVuY3Rpb24gTG9hZFN0cmVhbSAoKSB7XG4gIGxldCBhdWRpb0N0eCAgICAgID0gbmV3IChBdWRpb0NvbnRleHQgfHwgd2Via2l0QXVkaW9Db250ZXh0KSgpXG4gIGxldCBpbkZsaWdodENvdW50ID0gMFxuXG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpXG5cbiAgbGV0IGVtaXRSZXN1bHQgPSAoZXZlbnROYW1lLCBhc3NldCkgPT4ge1xuICAgIGluRmxpZ2h0Q291bnQtLVxuICAgIHRoaXMuZW1pdChldmVudE5hbWUsIGFzc2V0KVxuICAgIGlmIChpbkZsaWdodENvdW50ID09PSAwKSB0aGlzLmVtaXQoXCJkb25lXCIpXG4gIH1cblxuICBsZXQgbG9hZEltYWdlID0gKGFzc2V0KSA9PiB7XG4gICAgYXNzZXQuZGF0YSA9IG5ldyBJbWFnZVxuXG4gICAgYXNzZXQuZGF0YS5vbmxvYWQgID0gKCkgPT4gZW1pdFJlc3VsdChcImxvYWRcIiwgYXNzZXQpXG4gICAgYXNzZXQuZGF0YS5vbmVycm9yID0gKCkgPT4gZW1pdFJlc3VsdChcImVycm9yXCIsIGFzc2V0KVxuICAgIGFzc2V0LmRhdGEuc3JjICAgICA9IGFzc2V0LnBhdGhcbiAgfVxuXG4gIGxldCBsb2FkU291bmQgPSAoYXNzZXQpID0+IHtcbiAgICBmZXRjaChcImFycmF5YnVmZmVyXCIsIGFzc2V0LnBhdGgsIGZ1bmN0aW9uIChlcnIsIGJpbmFyeSkge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHRoaXMucmV0dXJuRXJyb3IoYXNzZXQpXG5cbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4ge1xuICAgICAgICBhc3NldC5kYXRhID0gYnVmZmVyIFxuICAgICAgICBlbWl0UmVzdWx0KFwibG9hZFwiLCBhc3NldClcbiAgICAgIH1cbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gKGVycikgPT4ge1xuICAgICAgICBlbWl0UmVzdWx0KFwiZXJyb3JcIiwgYXNzZXQpIFxuICAgICAgfVxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pXG4gIH1cblxuICB0aGlzLmxvYWQgPSAoYXNzZXQpID0+IHtcbiAgICBpbkZsaWdodENvdW50KytcbiAgICBpZiAgICAgIChhc3NldCBpbnN0YW5jZW9mIFNvdW5kQXNzZXQpIGxvYWRTb3VuZChhc3NldClcbiAgICBlbHNlIGlmIChhc3NldCBpbnN0YW5jZW9mIEltYWdlQXNzZXQpIGxvYWRJbWFnZShhc3NldClcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXNzZXRcIilcbiAgfVxuXG4gIHRoaXMubG9hZE1hbnkgPSAoYXNzZXRzKSA9PiBhc3NldHMuZm9yRWFjaCh0aGlzLmxvYWQsIHRoaXMpXG59XG5cbkxvYWRTdHJlYW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudEVtaXR0ZXIucHJvdG90eXBlKVxuXG5mdW5jdGlvbiBmZXRjaCAodHlwZSwgcGF0aCwgY2IpIHtcbiAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuXG4gIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cy5JbWFnZUFzc2V0ID0gSW1hZ2VBc3NldFxubW9kdWxlLmV4cG9ydHMuU291bmRBc3NldCA9IFNvdW5kQXNzZXRcbm1vZHVsZS5leHBvcnRzLkxvYWRTdHJlYW0gPSBMb2FkU3RyZWFtXG4iXX0=
