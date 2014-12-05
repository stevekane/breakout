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
module.exports = noop

function noop() {
  throw new Error(
      'You should bundle your code ' +
      'using `glslify` as a transform.'
  )
}

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";

function Loader() {
  var _this = this;
  var audioCtx = new AudioContext();

  var loadXHR = function (type) {
    return function (path, cb) {
      if (!path) return cb(new Error("No path provided"));

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
    };
  };

  var loadBuffer = loadXHR("arraybuffer");
  var loadString = loadXHR("string");

  this.loadShader = loadString;

  this.loadTexture = function (path, cb) {
    var i = new Image();
    var onload = function () {
      return cb(null, i);
    };
    var onerror = function () {
      return cb(new Error("Could not load " + path));
    };

    i.onload = onload;
    i.onerror = onerror;
    i.src = path;
  };

  this.loadSound = function (path, cb) {
    loadBuffer(path, function (err, binary) {
      var decodeSuccess = function (buffer) {
        return cb(null, buffer);
      };
      var decodeFailure = cb;

      audioCtx.decodeAudioData(binary, decodeSuccess, decodeFailure);
    });
  };

  this.loadAssets = function (_ref, cb) {
    var sounds = _ref.sounds;
    var textures = _ref.textures;
    var shaders = _ref.shaders;
    var soundKeys = Object.keys(sounds);
    var textureKeys = Object.keys(textures);
    var shaderKeys = Object.keys(shaders);
    var soundCount = soundKeys.length;
    var textureCount = textureKeys.length;
    var shaderCount = shaderKeys.length;
    var i = -1;
    var j = -1;
    var k = -1;
    var out = {
      sounds: {}, textures: {}, shaders: {}
    };

    var checkDone = function () {
      if (soundCount <= 0 && textureCount <= 0 && shaderCount <= 0) cb(null, out);
    };

    var registerSound = function (name, data) {
      soundCount--;
      out.sounds[name] = data;
      checkDone();
    };

    var registerTexture = function (name, data) {
      textureCount--;
      out.textures[name] = data;
      checkDone();
    };

    var registerShader = function (name, data) {
      shaderCount--;
      out.shaders[name] = data;
      checkDone();
    };

    while (soundKeys[++i]) {
      (function () {
        var key = soundKeys[i];

        _this.loadSound(sounds[key], function (err, data) {
          registerSound(key, data);
        });
      })();
    }
    while (textureKeys[++j]) {
      (function () {
        var key = textureKeys[j];

        _this.loadTexture(textures[key], function (err, data) {
          registerTexture(key, data);
        });
      })();
    }
    while (shaderKeys[++k]) {
      (function () {
        var key = shaderKeys[k];

        _this.loadShader(shaders[key], function (err, data) {
          registerShader(key, data);
        });
      })();
    }
  };
}

module.exports = Loader;

},{}],5:[function(require,module,exports){
"use strict";

var datGui = require("dat-gui");
var _ref = require("./gl-utils");

var LoadedProgram = _ref.LoadedProgram;
var clearContext = _ref.clearContext;
var Loader = require("./Loader");
var _ref2 = require("./loaders");

var LoadStream = _ref2.LoadStream;
var ImageAsset = _ref2.ImageAsset;
var SoundAsset = _ref2.SoundAsset;
var AudioSystem = require("./AudioSystem");
var shader = require("./gl-playground");

var raf = window.requestAnimationFrame;
var setInterval = window.setInterval;

var audioSystem = new AudioSystem(["main", "bg"]);
var main = audioSystem.channels.main;
var bg = audioSystem.channels.bg;
var canvas = document.createElement("canvas");
var gui = new datGui.GUI();

var gl = canvas.getContext("webgl");

var assets = {
  sounds: {
    background: "public/sounds/bgm1.mp3",
    hadouken: "public/sounds/hadouken.mp3"
  },
  textures: {
    paddle: "public/spritesheets/paddle.png"
  },
  shaders: {
    baseF: "public/shaders/base.fragment",
    baseV: "public/shaders/base.vertex"
  }
};

//initial config
canvas.height = 600;
canvas.width = 400;
bg.volume = 0;

var settings = {
  bgColor: [100, 0, 0, 1]
};

var testFns = {
  playHadouken: function () {
    return main.play(cache.sounds.hadouken);
  }
};

var loader = new Loader();

var cache = {
  sounds: {},
  textures: {},
  shaders: {},
  programs: {}
};

function makeUpdate() {
  return function update() {};
}

function makeRender(gl) {
  return function render() {
    clearContext(gl, settings.bgColor);
    raf(render);
  };
}

var audioTab = gui.addFolder("Audio");
var videoTab = gui.addFolder("Video");
var actionTab = gui.addFolder("Actions");

audioTab.open();
videoTab.open();
actionTab.open();
audioTab.add(bg, "volume", [0, 0.5, 1]);
audioTab.add(main, "volume", [0, 0.5, 1]);
videoTab.add(gl.canvas, "width", 200, 400);
videoTab.add(gl.canvas, "height", 400, 600);
videoTab.addColor(settings, "bgColor");
actionTab.add(testFns, "playHadouken");

document.body.appendChild(canvas);

function startGame() {
  bg.loop(cache.sounds.background);
  raf(makeRender(gl));
  setInterval(makeUpdate(), 25);
}

loader.loadAssets(assets, function (err, _ref3) {
  var sounds = _ref3.sounds;
  var textures = _ref3.textures;
  var shaders = _ref3.shaders;
  cache.sounds = sounds;
  cache.shaders = shaders;
  cache.textures = textures;
  cache.programs.base = new LoadedProgram(gl, shaders.basev, shaders.basec);
  startGame();
});

},{"./AudioSystem":3,"./Loader":4,"./gl-playground":6,"./gl-utils":7,"./loaders":8,"dat-gui":"dat-gui"}],6:[function(require,module,exports){
"use strict";

var glslify = require("glslify");

module.exports = glslify({
  vertex: "    attribute vec2 position;    varying vec2 texCoord;    void main() {]      gl_Position = vec4(position, 0, 1);      texCoord = vec2(0.0,1.0)+vec2(0.5,-0.5) * (position + 1.0);    }  ",
  fragment: "    precision highp float;    uniform sampler2D texture;    varying vec2 texCoord;    void main() {      gl_FragColor = texture2D(texture, texCoord);    }  ",
  inline: true
});

},{"glslify":2}],7:[function(require,module,exports){
"use strict";

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

module.exports = { clearContext: clearContext, updateBuffer: updateBuffer, LoadedProgram: LoadedProgram };

},{}],8:[function(require,module,exports){
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

function ShaderAsset(name, path) {
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
    if (asset instanceof SoundAsset) loadSound(asset);else if (asset instanceof ImageAsset) loadImage(asset);else if (asset instanceof ShaderAsset) loadImage(asset);else throw new Error("invalid asset");
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

},{"events":1}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9nbHNsaWZ5L2Jyb3dzZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9BdWRpb1N5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0xvYWRlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2JyZWFrb3V0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvZ2wtcGxheWdyb3VuZC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2dsLXV0aWxzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvbG9hZGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QyxDQUFDO0dBQUEsQ0FBQTtBQUNoRSxLQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDM0IsS0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUNmOztBQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtBQUN0QyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7QUFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm9vcFxuXG5mdW5jdGlvbiBub29wKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnWW91IHNob3VsZCBidW5kbGUgeW91ciBjb2RlICcgK1xuICAgICAgJ3VzaW5nIGBnbHNsaWZ5YCBhcyBhIHRyYW5zZm9ybS4nXG4gIClcbn1cbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcbiAgbGV0IGNoYW5uZWwgPSBjb250ZXh0LmNyZWF0ZUdhaW4oKVxuICBcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcbiAgICBzcmMuY29ubmVjdChwYW5uZXIpXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXG4gIH1cblxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxuXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcblxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcbiAgICAgIHNyYy5zdGFydCgwKVxuICAgICAgcmV0dXJuIHNyY1xuICAgIH0gXG4gIH1cblxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbC5nYWluLnZhbHVlIH0sXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cbiAgfSlcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwgfVxuICB9KVxuXG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXG59XG5cbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcbiAgbGV0IGNvbnRleHQgID0gbmV3IEF1ZGlvQ29udGV4dFxuICBsZXQgY2hhbm5lbHMgPSB7fVxuICBsZXQgaSAgICAgICAgPSAtMVxuXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXG4gIH1cbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XG5cbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXG5cbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXG5cbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICAgICAgeGhyLnNlbmQobnVsbClcbiAgICB9IFxuICB9XG5cbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXG5cbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xuXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxuICAgIGkuc3JjICAgICA9IHBhdGhcbiAgfVxuXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pIFxuICB9XG5cbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzKVxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcylcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycylcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxuICAgIH1cblxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc291bmRDb3VudC0tXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHRleHR1cmVDb3VudC0tXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzaGFkZXJDb3VudC0tXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXG5cbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxuXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXG5cbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcbiIsImxldCBkYXRHdWkgPSByZXF1aXJlKFwiZGF0LWd1aVwiKVxubGV0IHtMb2FkZWRQcm9ncmFtLCBjbGVhckNvbnRleHR9ID0gcmVxdWlyZShcIi4vZ2wtdXRpbHNcIilcbmxldCBMb2FkZXIgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCB7TG9hZFN0cmVhbSwgSW1hZ2VBc3NldCwgU291bmRBc3NldH0gPSByZXF1aXJlKFwiLi9sb2FkZXJzXCIpXG5sZXQgQXVkaW9TeXN0ZW0gPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IHNoYWRlciA9IHJlcXVpcmUoXCIuL2dsLXBsYXlncm91bmRcIilcblxubGV0IHJhZiAgICAgICAgID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxubGV0IHNldEludGVydmFsID0gd2luZG93LnNldEludGVydmFsXG5cbmxldCBhdWRpb1N5c3RlbSA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXG5sZXQge21haW4sIGJnfSAgPSBhdWRpb1N5c3RlbS5jaGFubmVsc1xubGV0IGNhbnZhcyAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxubGV0IGd1aSAgICAgICAgID0gbmV3IGRhdEd1aS5HVUkoKVxuXG5sZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpXG5cbmxldCBhc3NldHMgPSB7XG4gIHNvdW5kczoge1xuICAgIGJhY2tncm91bmQ6IFwicHVibGljL3NvdW5kcy9iZ20xLm1wM1wiLFxuICAgIGhhZG91a2VuOiAgIFwicHVibGljL3NvdW5kcy9oYWRvdWtlbi5tcDNcIiBcbiAgfSxcbiAgdGV4dHVyZXM6IHtcbiAgICBwYWRkbGU6IFwicHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIgXG4gIH0sXG4gIHNoYWRlcnM6IHtcbiAgICBiYXNlRjogXCJwdWJsaWMvc2hhZGVycy9iYXNlLmZyYWdtZW50XCIsXG4gICAgYmFzZVY6IFwicHVibGljL3NoYWRlcnMvYmFzZS52ZXJ0ZXhcIlxuICB9XG59XG5cbi8vaW5pdGlhbCBjb25maWdcbmNhbnZhcy5oZWlnaHQgPSA2MDBcbmNhbnZhcy53aWR0aCAgPSA0MDBcbmJnLnZvbHVtZSAgICAgPSAwXG5cbmxldCBzZXR0aW5ncyA9IHtcbiAgYmdDb2xvcjogWzEwMCwgMCwgMCwgMS4wXVxufVxuXG5sZXQgdGVzdEZucyA9IHtcbiAgcGxheUhhZG91a2VuOiAoKSA9PiBtYWluLnBsYXkoY2FjaGUuc291bmRzLmhhZG91a2VuKVxufVxuXG5sZXQgbG9hZGVyID0gbmV3IExvYWRlclxuXG5sZXQgY2FjaGUgPSB7XG4gIHNvdW5kczogICB7fSxcbiAgdGV4dHVyZXM6IHt9LFxuICBzaGFkZXJzOiAge30sXG4gIHByb2dyYW1zOiB7fVxufVxuXG5mdW5jdGlvbiBtYWtlVXBkYXRlICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7fVxufVxuXG5mdW5jdGlvbiBtYWtlUmVuZGVyIChnbCkge1xuICByZXR1cm4gZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBjbGVhckNvbnRleHQoZ2wsIHNldHRpbmdzLmJnQ29sb3IpXG4gICAgcmFmKHJlbmRlcikgXG4gIH1cbn1cblxubGV0IGF1ZGlvVGFiICA9IGd1aS5hZGRGb2xkZXIoXCJBdWRpb1wiKVxubGV0IHZpZGVvVGFiICA9IGd1aS5hZGRGb2xkZXIoXCJWaWRlb1wiKVxubGV0IGFjdGlvblRhYiA9IGd1aS5hZGRGb2xkZXIoXCJBY3Rpb25zXCIpXG5cbmF1ZGlvVGFiLm9wZW4oKVxudmlkZW9UYWIub3BlbigpXG5hY3Rpb25UYWIub3BlbigpXG5hdWRpb1RhYi5hZGQoYmcsIFwidm9sdW1lXCIsIFswLjAsIDAuNSwgMS4wXSlcbmF1ZGlvVGFiLmFkZChtYWluLCBcInZvbHVtZVwiLCBbMC4wLCAwLjUsIDEuMF0pXG52aWRlb1RhYi5hZGQoZ2wuY2FudmFzLCBcIndpZHRoXCIsIDIwMCwgNDAwKVxudmlkZW9UYWIuYWRkKGdsLmNhbnZhcywgXCJoZWlnaHRcIiwgNDAwLCA2MDApXG52aWRlb1RhYi5hZGRDb2xvcihzZXR0aW5ncywgXCJiZ0NvbG9yXCIpXG5hY3Rpb25UYWIuYWRkKHRlc3RGbnMsIFwicGxheUhhZG91a2VuXCIpXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxuXG5mdW5jdGlvbiBzdGFydEdhbWUgKCkge1xuICBiZy5sb29wKGNhY2hlLnNvdW5kcy5iYWNrZ3JvdW5kKVxuICByYWYobWFrZVJlbmRlcihnbCkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoKSwgMjUpXG59XG5cbmxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgKGVyciwge3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9KSA9PiB7XG4gIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXG4gIGNhY2hlLnNoYWRlcnMgID0gc2hhZGVyc1xuICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG4gIGNhY2hlLnByb2dyYW1zLmJhc2UgPSBuZXcgTG9hZGVkUHJvZ3JhbShnbCwgc2hhZGVycy5iYXNldiwgc2hhZGVycy5iYXNlYylcbiAgc3RhcnRHYW1lKClcbn0pXG4iLCJsZXQgZ2xzbGlmeSA9IHJlcXVpcmUoXCJnbHNsaWZ5XCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZ2xzbGlmeSh7XG4gIHZlcnRleDogXCJcXFxuICAgIGF0dHJpYnV0ZSB2ZWMyIHBvc2l0aW9uO1xcXG4gICAgdmFyeWluZyB2ZWMyIHRleENvb3JkO1xcXG4gICAgdm9pZCBtYWluKCkge11cXFxuICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvc2l0aW9uLCAwLCAxKTtcXFxuICAgICAgdGV4Q29vcmQgPSB2ZWMyKDAuMCwxLjApK3ZlYzIoMC41LC0wLjUpICogKHBvc2l0aW9uICsgMS4wKTtcXFxuICAgIH1cXFxuICBcIlxuICAsIFxuICBmcmFnbWVudDogXCJcXFxuICAgIHByZWNpc2lvbiBoaWdocCBmbG9hdDtcXFxuICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxcbiAgICB2YXJ5aW5nIHZlYzIgdGV4Q29vcmQ7XFxcbiAgICB2b2lkIG1haW4oKSB7XFxcbiAgICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCk7XFxcbiAgICB9XFxcbiAgXCJcbiAgLFxuICBpbmxpbmU6IHRydWVcbn0pXG4iLCJ2YXIgY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24gKGdsLCBjb2xvcikge1xuICBsZXQgciA9IGNvbG9yWzBdIC8gMjU1XG4gIGxldCBnID0gY29sb3JbMV0gLyAyNTVcbiAgbGV0IGIgPSBjb2xvclsyXSAvIDI1NVxuICBsZXQgYSA9IGNvbG9yWzNdXG4gIFxuICBnbC5jbGVhckNvbG9yKHIsIGcsIGIsIGEpXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG59XG5cbnZhciB1cGRhdGVCdWZmZXIgPSBmdW5jdGlvbiAoZ2wsIHByb2dyYW0sIGNodW5rU2l6ZSwgYXR0ck5hbWUsIGRhdGEpIHtcbiAgdmFyIGF0dHJpYnV0ZSA9IHByb2dyYW0uYXR0cmlidXRlc1thdHRyTmFtZV1cbiAgdmFyIGJ1ZmZlciAgICA9IHByb2dyYW0uYnVmZmVyc1thdHRyTmFtZV1cblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoYXR0cmlidXRlLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG4vL2dpdmVuIHNyYyBhbmQgdHlwZSwgY29tcGlsZSBhbmQgcmV0dXJuIHNoYWRlclxuZnVuY3Rpb24gY29tcGlsZSAoZ2wsIHNoYWRlclR5cGUsIHNyYykge1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpXG5cbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcbiAgcmV0dXJuIHNoYWRlclxufVxuXG4vL2xpbmsgeW91ciBwcm9ncmFtIHcvIG9wZW5nbFxuZnVuY3Rpb24gbGluayAoZ2wsIHZzLCBmcykge1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cykgXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcykgXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8qXG4gKiBXZSB3YW50IHRvIGNyZWF0ZSBhIHdyYXBwZXIgZm9yIGEgbG9hZGVkIGdsIHByb2dyYW1cbiAqIHRoYXQgaW5jbHVkZXMgcG9pbnRlcnMgdG8gYWxsIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlc1xuICogZGVmaW5lZCBmb3IgdGhpcyBwcm9ncmFtLiAgVGhpcyBtYWtlcyBpdCBtb3JlIGNvbnZlbmllbnRcbiAqIHRvIGNoYW5nZSB0aGVzZSB2YWx1ZXNcbiAqL1xudmFyIExvYWRlZFByb2dyYW0gPSBmdW5jdGlvbiAoZ2wsIHZTcmMsIGZTcmMpIHtcbiAgdmFyIHZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxuICB2YXIgZnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcbiAgdmFyIHByb2dyYW0gICAgICAgPSBsaW5rKGdsLCB2cywgZnMpXG4gIHZhciBudW1BdHRyaWJ1dGVzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUylcbiAgdmFyIG51bVVuaWZvcm1zICAgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUylcbiAgdmFyIGxwID0ge1xuICAgIHZlcnRleDoge1xuICAgICAgc3JjOiAgICB2U3JjLFxuICAgICAgc2hhZGVyOiB2cyBcbiAgICB9LFxuICAgIGZyYWdtZW50OiB7XG4gICAgICBzcmM6ICAgIGZTcmMsXG4gICAgICBzaGFkZXI6IGZzIFxuICAgIH0sXG4gICAgcHJvZ3JhbTogICAgcHJvZ3JhbSxcbiAgICB1bmlmb3JtczogICB7fSwgXG4gICAgYXR0cmlidXRlczoge30sXG4gICAgYnVmZmVyczogICAge31cbiAgfVxuICB2YXIgYU5hbWVcbiAgdmFyIHVOYW1lXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1BdHRyaWJ1dGVzOyArK2kpIHtcbiAgICBhTmFtZSAgICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZUF0dHJpYihwcm9ncmFtLCBpKS5uYW1lXG4gICAgbHAuYXR0cmlidXRlc1thTmFtZV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBhTmFtZSlcbiAgICBscC5idWZmZXJzW2FOYW1lXSAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIH1cblxuICBmb3IgKHZhciBqID0gMDsgaiA8IG51bVVuaWZvcm1zOyArK2opIHtcbiAgICB1TmFtZSAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGopLm5hbWVcbiAgICBscC51bmlmb3Jtc1t1TmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdU5hbWUpXG4gIH1cblxuICByZXR1cm4gbHAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NsZWFyQ29udGV4dCwgdXBkYXRlQnVmZmVyLCBMb2FkZWRQcm9ncmFtfVxuIiwibGV0IHtFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZShcImV2ZW50c1wiKVxuXG5mdW5jdGlvbiBBc3NldCAobmFtZSwgcGF0aCkge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMucGF0aCA9IHBhdGhcbiAgdGhpcy5kYXRhID0gbnVsbFxufVxuXG5mdW5jdGlvbiBJbWFnZUFzc2V0IChuYW1lLCBwYXRoKSB7XG4gIEFzc2V0LmNhbGwodGhpcywgbmFtZSwgcGF0aClcbn1cblxuZnVuY3Rpb24gU291bmRBc3NldCAobmFtZSwgcGF0aCkge1xuICBBc3NldC5jYWxsKHRoaXMsIG5hbWUsIHBhdGgpXG59XG5cbmZ1bmN0aW9uIFNoYWRlckFzc2V0IChuYW1lLCBwYXRoKSB7XG4gIEFzc2V0LmNhbGwodGhpcywgbmFtZSwgcGF0aClcbn1cblxuZnVuY3Rpb24gTG9hZFN0cmVhbSAoKSB7XG4gIGxldCBhdWRpb0N0eCAgICAgID0gbmV3IChBdWRpb0NvbnRleHQgfHwgd2Via2l0QXVkaW9Db250ZXh0KSgpXG4gIGxldCBpbkZsaWdodENvdW50ID0gMFxuXG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpXG5cbiAgbGV0IGVtaXRSZXN1bHQgPSAoZXZlbnROYW1lLCBhc3NldCkgPT4ge1xuICAgIGluRmxpZ2h0Q291bnQtLVxuICAgIHRoaXMuZW1pdChldmVudE5hbWUsIGFzc2V0KVxuICAgIGlmIChpbkZsaWdodENvdW50ID09PSAwKSB0aGlzLmVtaXQoXCJkb25lXCIpXG4gIH1cblxuICBsZXQgbG9hZEltYWdlID0gKGFzc2V0KSA9PiB7XG4gICAgYXNzZXQuZGF0YSA9IG5ldyBJbWFnZVxuXG4gICAgYXNzZXQuZGF0YS5vbmxvYWQgID0gKCkgPT4gZW1pdFJlc3VsdChcImxvYWRcIiwgYXNzZXQpXG4gICAgYXNzZXQuZGF0YS5vbmVycm9yID0gKCkgPT4gZW1pdFJlc3VsdChcImVycm9yXCIsIGFzc2V0KVxuICAgIGFzc2V0LmRhdGEuc3JjICAgICA9IGFzc2V0LnBhdGhcbiAgfVxuXG4gIGxldCBsb2FkU291bmQgPSAoYXNzZXQpID0+IHtcbiAgICBmZXRjaChcImFycmF5YnVmZmVyXCIsIGFzc2V0LnBhdGgsIGZ1bmN0aW9uIChlcnIsIGJpbmFyeSkge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHRoaXMucmV0dXJuRXJyb3IoYXNzZXQpXG5cbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4ge1xuICAgICAgICBhc3NldC5kYXRhID0gYnVmZmVyIFxuICAgICAgICBlbWl0UmVzdWx0KFwibG9hZFwiLCBhc3NldClcbiAgICAgIH1cbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gKGVycikgPT4ge1xuICAgICAgICBlbWl0UmVzdWx0KFwiZXJyb3JcIiwgYXNzZXQpIFxuICAgICAgfVxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pXG4gIH1cblxuICB0aGlzLmxvYWQgPSAoYXNzZXQpID0+IHtcbiAgICBpbkZsaWdodENvdW50KytcbiAgICBpZiAgICAgIChhc3NldCBpbnN0YW5jZW9mIFNvdW5kQXNzZXQpICBsb2FkU291bmQoYXNzZXQpXG4gICAgZWxzZSBpZiAoYXNzZXQgaW5zdGFuY2VvZiBJbWFnZUFzc2V0KSAgbG9hZEltYWdlKGFzc2V0KVxuICAgIGVsc2UgaWYgKGFzc2V0IGluc3RhbmNlb2YgU2hhZGVyQXNzZXQpIGxvYWRJbWFnZShhc3NldClcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXNzZXRcIilcbiAgfVxuXG4gIHRoaXMubG9hZE1hbnkgPSAoYXNzZXRzKSA9PiBhc3NldHMuZm9yRWFjaCh0aGlzLmxvYWQsIHRoaXMpXG59XG5cbkxvYWRTdHJlYW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudEVtaXR0ZXIucHJvdG90eXBlKVxuXG5mdW5jdGlvbiBmZXRjaCAodHlwZSwgcGF0aCwgY2IpIHtcbiAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuXG4gIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cy5JbWFnZUFzc2V0ID0gSW1hZ2VBc3NldFxubW9kdWxlLmV4cG9ydHMuU291bmRBc3NldCA9IFNvdW5kQXNzZXRcbm1vZHVsZS5leHBvcnRzLkxvYWRTdHJlYW0gPSBMb2FkU3RyZWFtXG4iXX0=
