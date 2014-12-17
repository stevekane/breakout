(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = function AABB(w, h, x, y) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  Object.defineProperty(this, "ulx", {
    get: function () {
      return x;
    }
  });
  Object.defineProperty(this, "uly", {
    get: function () {
      return y;
    }
  });
  Object.defineProperty(this, "lrx", {
    get: function () {
      return x + w;
    }
  });
  Object.defineProperty(this, "lry", {
    get: function () {
      return y + h;
    }
  });
};

},{}],2:[function(require,module,exports){
"use strict";

var AABB = require("./AABB");

module.exports = Animation;

function Frame(aabb, duration) {
  this.aabb = aabb;
  this.duration = duration;
}

//rate is in ms.  This is the time per frame (42 ~ 24fps)
function Animation(frames, doesLoop, rate) {
  if (rate === undefined) rate = 42;
  this.loop = doesLoop;
  this.rate = rate;
  this.frames = frames;
}

Animation.createLinear = function (w, h, x, y, count, doesLoop, rate) {
  if (rate === undefined) rate = 42;
  var frames = [];
  var i = -1;
  var eachX;
  var aabb;

  while (++i < count) {
    eachX = x + i * w;
    aabb = new AABB(w, h, eachX, y);
    frames.push(new Frame(aabb, rate));
  }

  return new Animation(frames, doesLoop, rate);
};

},{"./AABB":1}],3:[function(require,module,exports){
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

module.exports = function Cache(keyNames) {
  if (!keyNames) throw new Error("Must provide some keyNames");
  for (var i = 0; i < keyNames.length; ++i) this[keyNames[i]] = {};
};

},{}],5:[function(require,module,exports){
"use strict";

module.exports = Clock;

function Clock(timeFn) {
  var _this = this;
  if (timeFn === undefined) timeFn = Date.now;
  return (function () {
    _this.oldTime = timeFn();
    _this.newTime = timeFn();
    _this.dT = 0;
    _this.tick = function () {
      this.oldTime = this.newTime;
      this.newTime = timeFn();
      this.dT = this.newTime - this.oldTime;
    };
  })();
}

},{}],6:[function(require,module,exports){
"use strict";

//this does literally nothing.  it's a shell that holds components
module.exports = function Entity() {};

},{}],7:[function(require,module,exports){
"use strict";

var _ref = require("./functions");

var hasKeys = _ref.hasKeys;


module.exports = EntityStore;

function EntityStore(max) {
  if (max === undefined) max = 1000;
  this.entities = [];
  this.lastQuery = [];
}

EntityStore.prototype.addEntity = function (e) {
  var id = this.entities.length;

  this.entities.push(e);
  return id;
};

EntityStore.prototype.query = function (componentNames) {
  var i = -1;
  var entity;

  this.lastQuery = [];

  while (this.entities[++i]) {
    entity = this.entities[i];
    if (hasKeys(componentNames, entity)) this.lastQuery.push(entity);
  }
  return this.lastQuery;
};

},{"./functions":22}],8:[function(require,module,exports){
"use strict";

var _ref = require("./gl-shaders");

var spriteVertexShader = _ref.spriteVertexShader;
var spriteFragmentShader = _ref.spriteFragmentShader;
var _ref2 = require("./gl-shaders");

var polygonVertexShader = _ref2.polygonVertexShader;
var polygonFragmentShader = _ref2.polygonFragmentShader;
var _ref3 = require("./utils");

var setBox = _ref3.setBox;
var _ref4 = require("./gl-types");

var Shader = _ref4.Shader;
var Program = _ref4.Program;
var Texture = _ref4.Texture;
var _ref5 = require("./gl-buffer");

var updateBuffer = _ref5.updateBuffer;


module.exports = GLRenderer;

var POINT_DIMENSION = 2;
var COLOR_CHANNEL_COUNT = 4;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;
var MAX_VERTEX_COUNT = 1000000;

function BoxArray(count) {
  return new Float32Array(count * BOX_LENGTH);
}

function CenterArray(count) {
  return new Float32Array(count * BOX_LENGTH);
}

function ScaleArray(count) {
  var ar = new Float32Array(count * BOX_LENGTH);

  for (var i = 0, len = ar.length; i < len; ++i) ar[i] = 1;
  return ar;
}

function RotationArray(count) {
  return new Float32Array(count * POINTS_PER_BOX);
}

//texture coords are initialized to 0 -> 1 texture coord space
function TextureCoordinatesArray(count) {
  var ar = new Float32Array(count * BOX_LENGTH);

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    setBox(ar, i, 1, 1, 0, 0);
  }
  return ar;
}

function IndexArray(size) {
  return new Uint16Array(size);
}

function VertexArray(size) {
  return new Float32Array(size * POINT_DIMENSION);
}

//4 for r, g, b, a
function VertexColorArray(size) {
  return new Float32Array(size * 4);
}

function SpriteBatch(size) {
  this.count = 0;
  this.boxes = BoxArray(size);
  this.centers = CenterArray(size);
  this.scales = ScaleArray(size);
  this.rotations = RotationArray(size);
  this.texCoords = TextureCoordinatesArray(size);
}

function PolygonBatch(size) {
  this.index = 0;
  this.indices = IndexArray(size);
  this.vertices = VertexArray(size);
  this.vertexColors = VertexColorArray(size);
}

function GLRenderer(canvas, width, height) {
  var _this = this;
  var maxSpriteCount = 100;
  var view = canvas;
  var gl = canvas.getContext("webgl");
  var svs = Shader(gl, gl.VERTEX_SHADER, spriteVertexShader);
  var sfs = Shader(gl, gl.FRAGMENT_SHADER, spriteFragmentShader);
  var pvs = Shader(gl, gl.VERTEX_SHADER, polygonVertexShader);
  var pfs = Shader(gl, gl.FRAGMENT_SHADER, polygonFragmentShader);
  var spriteProgram = Program(gl, svs, sfs);
  var polygonProgram = Program(gl, pvs, pfs);

  //Sprite shader buffers
  var boxBuffer = gl.createBuffer();
  var centerBuffer = gl.createBuffer();
  var scaleBuffer = gl.createBuffer();
  var rotationBuffer = gl.createBuffer();
  var texCoordBuffer = gl.createBuffer();

  //polygon shader buffers
  var vertexBuffer = gl.createBuffer();
  var vertexColorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();

  //GPU buffer locations
  var boxLocation = gl.getAttribLocation(spriteProgram, "a_position");
  var texCoordLocation = gl.getAttribLocation(spriteProgram, "a_texCoord");
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")

  var vertexLocation = gl.getAttribLocation(polygonProgram, "a_vertex");
  var vertexColorLocation = gl.getAttribLocation(polygonProgram, "a_vertexColor");

  //Uniform locations
  var worldSizeSpriteLocation = gl.getUniformLocation(spriteProgram, "u_worldSize");
  var worldSizePolygonLocation = gl.getUniformLocation(polygonProgram, "u_worldSize");

  var imageToTextureMap = new Map();
  var textureToBatchMap = new Map();
  var polygonBatch = new PolygonBatch(MAX_VERTEX_COUNT);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(1, 1, 1, 0);
  gl.colorMask(true, true, true, true);
  gl.activeTexture(gl.TEXTURE0);

  this.dimensions = {
    width: width || 1920,
    height: height || 1080
  };

  this.addBatch = function (texture) {
    textureToBatchMap.set(texture, new SpriteBatch(maxSpriteCount));
    return textureToBatchMap.get(texture);
  };

  this.addTexture = function (image) {
    var texture = Texture(gl);

    imageToTextureMap.set(image, texture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
  };

  this.resize = function (width, height) {
    var ratio = _this.dimensions.width / _this.dimensions.height;
    var targetRatio = width / height;
    var useWidth = ratio >= targetRatio;
    var newWidth = useWidth ? width : (height * ratio);
    var newHeight = useWidth ? (width / ratio) : height;

    canvas.width = newWidth;
    canvas.height = newHeight;
    gl.viewport(0, 0, newWidth, newHeight);
  };

  this.addSprite = function (image, w, h, x, y, texw, texh, texx, texy) {
    var tx = imageToTextureMap.get(image) || _this.addTexture(image);
    var batch = textureToBatchMap.get(tx) || _this.addBatch(tx);

    setBox(batch.boxes, batch.count, w, h, x, y);
    setBox(batch.texCoords, batch.count, texw, texh, texx, texy);
    batch.count++;
  };

  this.addPolygon = function (vertices, indices, vertexColors) {
    var vertexCount = indices.length;

    polygonBatch.vertices.set(vertices, polygonBatch.index);
    polygonBatch.indices.set(indices, polygonBatch.index);
    polygonBatch.vertexColors.set(vertexColors, polygonBatch.index);
    polygonBatch.index += vertexCount;
  };

  var resetPolygons = function (batch) {
    return batch.index = 0;
  };

  var drawPolygons = function (batch) {
    updateBuffer(gl, vertexBuffer, vertexLocation, POINT_DIMENSION, batch.vertices);
    updateBuffer(gl, vertexColorBuffer, vertexColorLocation, COLOR_CHANNEL_COUNT, batch.vertexColors);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, batch.index, gl.UNSIGNED_SHORT, 0);
  };

  var resetBatch = function (batch) {
    return batch.count = 0;
  };

  var drawBatch = function (batch, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, batch.boxes);
    //updateBuffer(gl, centerBuffer, centerLocation, POINT_DIMENSION, centers)
    //updateBuffer(gl, scaleBuffer, scaleLocation, POINT_DIMENSION, scales)
    //updateBuffer(gl, rotationBuffer, rotLocation, 1, rotations)
    updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, batch.texCoords);
    gl.drawArrays(gl.TRIANGLES, 0, batch.count * POINTS_PER_BOX);
  };

  this.flush = function () {
    textureToBatchMap.forEach(resetBatch);
    resetPolygons(polygonBatch);
  };

  this.render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Spritesheet batch rendering
    gl.useProgram(spriteProgram);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeSpriteLocation, 1920, 1080);
    textureToBatchMap.forEach(drawBatch);

    //polgon rendering
    gl.useProgram(polygonProgram);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizePolygonLocation, 1920, 1080);
    drawPolygons(polygonBatch);
  };
}

},{"./gl-buffer":23,"./gl-shaders":24,"./gl-types":25,"./utils":27}],9:[function(require,module,exports){
"use strict";

var _ref = require("./utils");

var checkType = _ref.checkType;
var InputManager = require("./InputManager");
var Clock = require("./Clock");
var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var AudioSystem = require("./AudioSystem");
var Cache = require("./Cache");
var EntityStore = require("./EntityStore-Simple");
var SceneManager = require("./SceneManager");

module.exports = Game;

//:: Clock -> Cache -> Loader -> GLRenderer -> AudioSystem -> EntityStore -> SceneManager
function Game(clock, cache, loader, inputManager, renderer, audioSystem, entityStore, sceneManager) {
  checkType(clock, Clock);
  checkType(cache, Cache);
  checkType(inputManager, InputManager);
  checkType(loader, Loader);
  checkType(renderer, GLRenderer);
  checkType(audioSystem, AudioSystem);
  checkType(entityStore, EntityStore);
  checkType(sceneManager, SceneManager);

  this.clock = clock;
  this.cache = cache;
  this.loader = loader;
  this.inputManager = inputManager;
  this.renderer = renderer;
  this.audioSystem = audioSystem;
  this.entityStore = entityStore;
  this.sceneManager = sceneManager;

  //Introduce bi-directional reference to game object onto each scene
  for (var i = 0, len = this.sceneManager.scenes.length; i < len; ++i) {
    this.sceneManager.scenes[i].game = this;
  }
}

Game.prototype.start = function () {
  var startScene = this.sceneManager.activeScene;

  console.log("calling setup for " + startScene.name);
  startScene.setup(function (err) {
    return console.log("setup completed");
  });
};

Game.prototype.stop = function () {};

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./InputManager":10,"./Loader":13,"./SceneManager":17,"./utils":27}],10:[function(require,module,exports){
"use strict";

var _ref = require("./utils");

var checkType = _ref.checkType;
var KeyboardManager = require("./KeyboardManager");

module.exports = InputManager;

//TODO: could take mouseManager and gamepad manager?
function InputManager(keyboardManager) {
  checkType(keyboardManager, KeyboardManager);
  this.keyboardManager = keyboardManager;
}

},{"./KeyboardManager":11,"./utils":27}],11:[function(require,module,exports){
"use strict";

module.exports = KeyboardManager;

var KEY_COUNT = 256;

function KeyboardManager(document) {
  var isDowns = new Uint8Array(KEY_COUNT);
  var justDowns = new Uint8Array(KEY_COUNT);
  var justUps = new Uint8Array(KEY_COUNT);
  var downDurations = new Uint32Array(KEY_COUNT);

  var handleKeyDown = function (_ref) {
    var keyCode = _ref.keyCode;
    justDowns[keyCode] = !isDowns[keyCode];
    isDowns[keyCode] = true;
  };

  var handleKeyUp = function (_ref2) {
    var keyCode = _ref2.keyCode;
    justUps[keyCode] = true;
    isDowns[keyCode] = false;
  };

  var handleBlur = function () {
    var i = -1;

    while (++i < KEY_COUNT) {
      isDowns[i] = 0;
      justDowns[i] = 0;
      justUps[i] = 0;
    }
  };

  this.isDowns = isDowns;
  this.justUps = justUps;
  this.justDowns = justDowns;
  this.downDurations = downDurations;

  this.tick = function (dT) {
    var i = -1;

    while (++i < KEY_COUNT) {
      justDowns[i] = false;
      justUps[i] = false;
      if (isDowns[i]) downDurations[i] += dT;else downDurations[i] = 0;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("blur", handleBlur);
}

},{}],12:[function(require,module,exports){
"use strict";

var System = require("./System");

module.exports = KeyframeAnimationSystem;

function KeyframeAnimationSystem() {
  System.call(this, ["renderable", "animated"]);
}

KeyframeAnimationSystem.prototype.run = function (scene, entities) {
  var dT = scene.game.clock.dT;
  var len = entities.length;
  var i = -1;
  var ent;
  var timeLeft;
  var currentIndex;
  var currentAnim;
  var currentFrame;
  var nextFrame;
  var overshoot;
  var shouldAdvance;

  while (++i < len) {
    ent = entities[i];
    currentIndex = ent.animated.currentAnimationIndex;
    currentAnim = ent.animated.currentAnimation;
    currentFrame = currentAnim.frames[currentIndex];
    nextFrame = currentAnim.frames[currentIndex + 1] || currentAnim.frames[0];
    timeLeft = ent.animated.timeTillNextFrame;
    overshoot = timeLeft - dT;
    shouldAdvance = overshoot <= 0;

    if (shouldAdvance) {
      ent.animated.currentAnimationIndex = currentAnim.frames.indexOf(nextFrame);
      ent.animated.timeTillNextFrame = nextFrame.duration + overshoot;
    } else {
      ent.animated.timeTillNextFrame = overshoot;
    }
  }
};

},{"./System":18}],13:[function(require,module,exports){
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
    var soundKeys = Object.keys(sounds || {});
    var textureKeys = Object.keys(textures || {});
    var shaderKeys = Object.keys(shaders || {});
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

},{}],14:[function(require,module,exports){
"use strict";

var System = require("./System");

module.exports = PaddleMoverSystem;

function PaddleMoverSystem() {
  System.call(this, ["physics", "playerControlled"]);
}

PaddleMoverSystem.prototype.run = function (scene, entities) {
  var clock = scene.game.clock;
  var inputManager = scene.game.inputManager;
  var keyboardManager = inputManager.keyboardManager;
  var moveSpeed = 1;
  var paddle = entities[0];

  //can happen during loading for example
  if (!paddle) return;

  if (keyboardManager.isDowns[37]) paddle.physics.x -= clock.dT * moveSpeed;
  if (keyboardManager.isDowns[39]) paddle.physics.x += clock.dT * moveSpeed;
};

},{"./System":18}],15:[function(require,module,exports){
"use strict";

var _ref = require("./utils");

var setBox = _ref.setBox;
var System = require("./System");

module.exports = RenderingSystem;

function RenderingSystem() {
  System.call(this, ["physics", "renderable"]);
}

//x0, y0, x1, y1, x2, y2...
//let verts = new Float32Array([
//  0, 800,
//  1920, 800,
//  0, 1080,
//  1920, 800,
//  1920, 1080,
//  0, 1080
//])
//
////r,g,b,a...
//let vertColors = new Float32Array([
//  0, 0, 0.5, .6, //light
//  0, 0, 0.5, .6, //light
//  0, 0, 1,   1,
//  0, 0, 1,   1,
//  0, 0, 0.5, .6, //light
//  0, 0, 1,   1
//])

function Polygon(vertices, indices, vertexColors) {
  this.vertices = vertices;
  this.indices = indices;
  this.vertexColors = vertexColors;
}

function createWater(w, h, x, y, subDiv, colorTop, colorBottom) {
  var vertices = new Float32Array(subDiv * 6 * 2);
  var vertexColors = new Float32Array(subDiv * 6 * 4);
  var unitWidth = w / subDiv;
  var i = -1;

  while (++i < subDiv) {
    setBox(vertices, i, unitWidth, h, unitWidth * i + x, y);
    vertexColors.set(vertColors, i * vertColors.length);
  }
  return new Polygon(vertices, vertexColors);
}

var waterVerts = new Float32Array([0, 800, 1920, 400, 0, 1080, 1920, 1080]);
var waterIndices = new Uint32Array([0, 1, 2, 2, 1, 3]);
var waterColors = new Float32Array([0, 0, 0.5, 0.6, 0, 0, 0.5, 0.6, 0, 0, 1, 1, 0, 0, 1, 1]);

var water = new Polygon(waterVerts, waterIndices, waterColors);

RenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;
  var len = entities.length;
  var i = -1;
  var ent;
  var frame;

  renderer.flush();

  //TODO: For testing of polygon rendering
  renderer.addPolygon(water.vertices, water.indices, water.vertexColors);

  while (++i < len) {
    ent = entities[i];

    if (ent.animated) {
      frame = ent.animated.currentAnimation.frames[ent.animated.currentAnimationIndex];
      renderer.addSprite(ent.renderable.image, //image
      ent.physics.width, ent.physics.height, ent.physics.x, ent.physics.y, frame.aabb.w / ent.renderable.image.width, frame.aabb.h / ent.renderable.image.height, frame.aabb.x / ent.renderable.image.width, frame.aabb.y / ent.renderable.image.height);
    } else {
      renderer.addSprite(ent.renderable.image, //image
      ent.physics.width, ent.physics.height, ent.physics.x, ent.physics.y, 1, //texture width
      1, //texture height
      0, //texture x
      0 //texture y
      );
    }
  }
};

},{"./System":18,"./utils":27}],16:[function(require,module,exports){
"use strict";

module.exports = Scene;

function Scene(name, systems) {
  if (!name) throw new Error("Scene constructor requires a name");

  this.name = name;
  this.systems = systems;
  this.game = null;
}

Scene.prototype.setup = function (cb) {
  cb(null, null);
};

Scene.prototype.update = function (dT) {
  var store = this.game.entityStore;
  var len = this.systems.length;
  var i = -1;
  var system;

  while (++i < len) {
    system = this.systems[i];
    system.run(this, store.query(system.componentNames));
  }
};

},{}],17:[function(require,module,exports){
"use strict";

var _ref = require("./functions");

var findWhere = _ref.findWhere;


module.exports = SceneManager;

function SceneManager(_scenes) {
  if (_scenes === undefined) _scenes = [];
  if (_scenes.length <= 0) throw new Error("Must provide one or more scenes");

  var activeSceneIndex = 0;
  var _scenes = _scenes;

  this.scenes = _scenes;
  this.activeScene = _scenes[activeSceneIndex];

  this.transitionTo = function (sceneName) {
    var scene = findWhere("name", sceneName, _scenes);

    if (!scene) throw new Error(sceneName + " is not a valid scene name");

    activeSceneIndex = _scenes.indexOf(scene);
    this.activeScene = scene;
  };

  this.advance = function () {
    var scene = _scenes[activeSceneIndex + 1];

    if (!scene) throw new Error("No more scenes!");

    this.activeScene = _scenes[++activeSceneIndex];
  };
}

},{"./functions":22}],18:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

//scene.game.clock
System.prototype.run = function (scene, entities) {};

},{}],19:[function(require,module,exports){
"use strict";

var _ref = require("./assemblages");

var Paddle = _ref.Paddle;
var Block = _ref.Block;
var Fighter = _ref.Fighter;
var PaddleMoverSystem = require("./PaddleMoverSystem");
var RenderingSystem = require("./RenderingSystem");
var KeyframeAnimationSystem = require("./KeyframeAnimationSystem");
var Scene = require("./Scene");

module.exports = TestScene;

function TestScene() {
  var systems = [new PaddleMoverSystem(), new KeyframeAnimationSystem(), new RenderingSystem()];

  Scene.call(this, "test", systems);
}

TestScene.prototype = Object.create(Scene.prototype);

TestScene.prototype.setup = function (cb) {
  var cache = this.game.cache;
  var loader = this.game.loader;
  var entityStore = this.game.entityStore;
  var audioSystem = this.game.audioSystem;
  var bg = audioSystem.channels.bg;
  var assets = {
    //sounds: { bgMusic: "/public/sounds/bgm1.mp3" },
    textures: {
      paddle: "/public/spritesheets/paddle.png",
      blocks: "/public/spritesheets/blocks.png",
      fighter: "/public/spritesheets/punch.png"
    }
  };

  loader.loadAssets(assets, function (err, loadedAssets) {
    var textures = loadedAssets.textures;
    var sounds = loadedAssets.sounds;


    cache.sounds = sounds;
    cache.textures = textures;
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400));
    entityStore.addEntity(new Block(textures.blocks, 44, 22, 800, 800));
    entityStore.addEntity(new Fighter(textures.fighter, 76, 59, 500, 500));
    //bg.volume = 0
    //bg.loop(cache.sounds.bgMusic)
    cb(null);
  });
};

},{"./KeyframeAnimationSystem":12,"./PaddleMoverSystem":14,"./RenderingSystem":15,"./Scene":16,"./assemblages":20}],20:[function(require,module,exports){
"use strict";

var _ref = require("./components");

var Renderable = _ref.Renderable;
var Physics = _ref.Physics;
var PlayerControlled = _ref.PlayerControlled;
var _ref2 = require("./components");

var Animated = _ref2.Animated;
var Animation = require("./Animation");
var Entity = require("./Entity");

module.exports.Paddle = Paddle;
module.exports.Block = Block;
module.exports.Fighter = Fighter;

function Paddle(image, w, h, x, y) {
  Entity.call(this);
  Renderable(this, image, w, h);
  Physics(this, w, h, x, y);
  PlayerControlled(this);
}

function Block(image, w, h, x, y) {
  Entity.call(this);
  Renderable(this, image, w, h);
  Physics(this, w, h, x, y);
  Animated(this, "idle", {
    idle: Animation.createLinear(44, 22, 0, 0, 3, true, 1000)
  });
}

function Fighter(image, w, h, x, y) {
  Entity.call(this);
  Renderable(this, image, w, h);
  Physics(this, w, h, x, y);
  Animated(this, "fireball", {
    fireball: Animation.createLinear(174, 134, 0, 0, 25, true)
  });
}

},{"./Animation":2,"./Entity":6,"./components":21}],21:[function(require,module,exports){
"use strict";

module.exports.Renderable = Renderable;
module.exports.Physics = Physics;
module.exports.PlayerControlled = PlayerControlled;
module.exports.Animated = Animated;

function Renderable(e, image, width, height) {
  e.renderable = {
    image: image,
    width: width,
    height: height,
    rotation: 0,
    center: {
      x: width / 2,
      y: height / 2
    },
    scale: {
      x: 1,
      y: 1
    }
  };
  return e;
}

function Physics(e, width, height, x, y) {
  e.physics = {
    width: width,
    height: height,
    x: x,
    y: y,
    dx: 0,
    dy: 0,
    ddx: 0,
    ddy: 0
  };
  return e;
}

function PlayerControlled(e) {
  e.playerControlled = true;
}

function Animated(e, defaultAnimationName, animHash) {
  e.animated = {
    animations: animHash,
    currentAnimationName: defaultAnimationName,
    currentAnimationIndex: 0,
    currentAnimation: animHash[defaultAnimationName],
    timeTillNextFrame: animHash[defaultAnimationName].frames[0].duration
  };
}

},{}],22:[function(require,module,exports){
"use strict";

module.exports.findWhere = findWhere;
module.exports.hasKeys = hasKeys;

//:: [{}] -> String -> Maybe A
function findWhere(key, property, arrayOfObjects) {
  var len = arrayOfObjects.length;
  var i = -1;
  var found = null;

  while (++i < len) {
    if (arrayOfObjects[i][key] === property) {
      found = arrayOfObjects[i];
      break;
    }
  }
  return found;
}

function hasKeys(keys, obj) {
  var i = -1;

  while (keys[++i]) if (!obj[keys[i]]) return false;
  return true;
}

},{}],23:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],24:[function(require,module,exports){
"use strict";

module.exports.spriteVertexShader = "   precision highp float;     attribute vec2 a_position;   attribute vec2 a_texCoord;     uniform vec2 u_worldSize;     varying vec2 v_texCoord;     vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }     void main() {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_position / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_texCoord  = a_texCoord;     gl_Position = vec4(position, 0, 1);   }";

module.exports.spriteFragmentShader = "  precision highp float;     uniform sampler2D u_image;     varying vec2 v_texCoord;     void main() {     gl_FragColor = texture2D(u_image, v_texCoord);   }";

module.exports.polygonVertexShader = "  attribute vec2 a_vertex;   attribute vec4 a_vertexColor;   uniform vec2 u_worldSize;   varying vec4 v_vertexColor;   vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }   void main () {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_vertex / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_vertexColor = a_vertexColor;     gl_Position   = vec4(position, 0, 1);   }";

module.exports.polygonFragmentShader = "  precision highp float;     varying vec4 v_vertexColor;     void main() {     gl_FragColor = v_vertexColor;   }";

},{}],25:[function(require,module,exports){
"use strict";

//:: => GLContext -> ENUM (VERTEX || FRAGMENT) -> String (Code)
function Shader(gl, type, src) {
  var shader = gl.createShader(type);
  var isValid = false;

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!isValid) throw new Error("Not valid shader: \n" + gl.getShaderInfoLog(shader));
  return shader;
}

//:: => GLContext -> VertexShader -> FragmentShader
function Program(gl, vs, fs) {
  var program = gl.createProgram(vs, fs);

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

//:: => GLContext -> Texture
function Texture(gl) {
  var texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}

module.exports.Shader = Shader;
module.exports.Program = Program;
module.exports.Texture = Texture;

},{}],26:[function(require,module,exports){
"use strict";

var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var EntityStore = require("./EntityStore-Simple");
var Clock = require("./Clock");
var Cache = require("./Cache");
var SceneManager = require("./SceneManager");
var TestScene = require("./TestScene");
var Game = require("./Game");
var InputManager = require("./InputManager");
var KeyboardManager = require("./KeyboardManager");
var AudioSystem = require("./AudioSystem");
var canvas = document.createElement("canvas");

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var keyboardManager = new KeyboardManager(document);
var inputManager = new InputManager(keyboardManager);
var entityStore = new EntityStore();
var clock = new Clock(Date.now);
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, 1920, 1080);
var audioSystem = new AudioSystem(["main", "bg"]);
var sceneManager = new SceneManager([new TestScene()]);
var game = new Game(clock, cache, loader, inputManager, renderer, audioSystem, entityStore, sceneManager);

function makeUpdate(game) {
  var store = game.entityStore;
  var _clock = game.clock;
  var _inputManager = game.inputManager;
  var componentNames = ["renderable", "physics"];

  return function update() {
    _clock.tick();
    _inputManager.keyboardManager.tick(_clock.dT);
    game.sceneManager.activeScene.update(_clock.dT);
  };
}

function makeAnimate(game) {
  return function animate() {
    game.renderer.render();
    requestAnimationFrame(animate);
  };
}

window.game = game;

function setupDocument(canvas, document, window) {
  document.body.appendChild(canvas);
  renderer.resize(window.innerWidth, window.innerHeight);
  window.addEventListener("resize", function () {
    renderer.resize(window.innerWidth, window.innerHeight);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setupDocument(canvas, document, window);
  game.start();
  requestAnimationFrame(makeAnimate(game));
  setInterval(makeUpdate(game), UPDATE_INTERVAL);
});

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./Game":9,"./InputManager":10,"./KeyboardManager":11,"./Loader":13,"./SceneManager":17,"./TestScene":19}],27:[function(require,module,exports){
"use strict";

module.exports.checkType = checkType;
module.exports.checkValueType = checkValueType;
module.exports.setBox = setBox;

var POINT_DIMENSION = 2;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;

function checkType(instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name);
}

function checkValueType(instance, ctor) {
  var keys = Object.keys(instance);

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor);
}

function setBox(boxArray, index, w, h, x, y) {
  var i = BOX_LENGTH * index;
  var x1 = x;
  var y1 = y;
  var x2 = x + w;
  var y2 = y + h;

  boxArray[i] = x1;
  boxArray[i + 1] = y1;
  boxArray[i + 2] = x2;
  boxArray[i + 3] = y1;
  boxArray[i + 4] = x1;
  boxArray[i + 5] = y2;

  boxArray[i + 6] = x1;
  boxArray[i + 7] = y2;
  boxArray[i + 8] = x2;
  boxArray[i + 9] = y1;
  boxArray[i + 10] = x2;
  boxArray[i + 11] = y2;
}

},{}]},{},[26])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtc2hhZGVycy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRVYsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLENBQUE7S0FBRTtHQUNuQixDQUFDLENBQUE7QUFDRixRQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDakMsT0FBRyxFQUFBLFlBQUc7QUFBRSxhQUFPLENBQUMsQ0FBQTtLQUFFO0dBQ25CLENBQUMsQ0FBQTtBQUNGLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUFFO0dBQ3ZCLENBQUMsQ0FBQTtBQUNGLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUFFO0dBQ3ZCLENBQUMsQ0FBQTtDQUNILENBQUE7Ozs7O0FDbEJELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUE7O0FBRTFCLFNBQVMsS0FBSyxDQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDOUIsTUFBSSxDQUFDLElBQUksR0FBTyxJQUFJLENBQUE7QUFDcEIsTUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7Q0FDekI7OztBQUdELFNBQVMsU0FBUyxDQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFLO01BQVQsSUFBSSxnQkFBSixJQUFJLEdBQUMsRUFBRTtBQUMzQyxNQUFJLENBQUMsSUFBSSxHQUFLLFFBQVEsQ0FBQTtBQUN0QixNQUFJLENBQUMsSUFBSSxHQUFLLElBQUksQ0FBQTtBQUNsQixNQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtDQUNyQjs7QUFFRCxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFLO01BQVQsSUFBSSxnQkFBSixJQUFJLEdBQUMsRUFBRTtBQUNyRSxNQUFJLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFDZixNQUFJLENBQUMsR0FBUSxDQUFDLENBQUMsQ0FBQTtBQUNmLE1BQUksS0FBSyxDQUFBO0FBQ1QsTUFBSSxJQUFJLENBQUE7O0FBRVIsU0FBTyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUU7QUFDbEIsU0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2pCLFFBQUksR0FBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNoQyxVQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFBO0dBQ25DOztBQUVELFNBQU8sSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUM3QyxDQUFBOzs7OztBQzdCRCxTQUFTLE9BQU8sQ0FBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQy9CLE1BQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQTs7QUFFbEMsTUFBSSxhQUFhLEdBQUcsVUFBVSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUMvQyxPQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ25CLFVBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7R0FDckIsQ0FBQTs7QUFFRCxNQUFJLFFBQVEsR0FBRyxVQUFVLE9BQU8sRUFBSztRQUFaLE9BQU8sZ0JBQVAsT0FBTyxHQUFDLEVBQUU7QUFDakMsUUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUE7O0FBRXRDLFdBQU8sVUFBVSxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQy9CLFVBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTs7QUFFOUMsVUFBSSxNQUFNLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUEsS0FDbkMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTs7QUFFaEMsU0FBRyxDQUFDLElBQUksR0FBSyxVQUFVLENBQUE7QUFDdkIsU0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDbkIsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNaLGFBQU8sR0FBRyxDQUFBO0tBQ1gsQ0FBQTtHQUNGLENBQUE7O0FBRUQsU0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBRXBDLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxjQUFVLEVBQUUsSUFBSTtBQUNoQixPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUE7S0FBRTtBQUNuQyxPQUFHLEVBQUEsVUFBQyxLQUFLLEVBQUU7QUFBRSxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7S0FBRTtHQUMxQyxDQUFDLENBQUE7O0FBRUYsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xDLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxPQUFPLENBQUE7S0FBRTtHQUN6QixDQUFDLENBQUE7O0FBRUYsTUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7QUFDaEIsTUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtBQUNsQyxNQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsRUFBRSxDQUFBO0NBQ3ZCOztBQUVELFNBQVMsV0FBVyxDQUFFLFlBQVksRUFBRTtBQUNsQyxNQUFJLE9BQU8sR0FBSSxJQUFJLFlBQVksRUFBQSxDQUFBO0FBQy9CLE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNqQixNQUFJLENBQUMsR0FBVSxDQUFDLENBQUMsQ0FBQTs7QUFFakIsU0FBTyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUN4QixZQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2xFO0FBQ0QsTUFBSSxDQUFDLE9BQU8sR0FBSSxPQUFPLENBQUE7QUFDdkIsTUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7Q0FDekI7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUE7Ozs7O0FDdEQ1QixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsS0FBSyxDQUFFLFFBQVEsRUFBRTtBQUN6QyxNQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtBQUM1RCxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ2pFLENBQUE7Ozs7O0FDSEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7O0FBRXRCLFNBQVMsS0FBSyxDQUFFLE1BQU07O01BQU4sTUFBTSxnQkFBTixNQUFNLEdBQUMsSUFBSSxDQUFDLEdBQUc7c0JBQUU7QUFDL0IsVUFBSyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUE7QUFDdkIsVUFBSyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUE7QUFDdkIsVUFBSyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1gsVUFBSyxJQUFJLEdBQUcsWUFBWTtBQUN0QixVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7QUFDM0IsVUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEVBQUUsQ0FBQTtBQUN2QixVQUFJLENBQUMsRUFBRSxHQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtLQUMzQyxDQUFBO0dBQ0Y7Q0FBQTs7Ozs7O0FDVkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLE1BQU0sR0FBSSxFQUFFLENBQUE7Ozs7O1dDRHRCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQWpDLE9BQU8sUUFBUCxPQUFPOzs7QUFFWixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQTs7QUFFNUIsU0FBUyxXQUFXLENBQUUsR0FBRyxFQUFPO01BQVYsR0FBRyxnQkFBSCxHQUFHLEdBQUMsSUFBSTtBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFJLEVBQUUsQ0FBQTtBQUNuQixNQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM3QyxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDckIsU0FBTyxFQUFFLENBQUE7Q0FDVixDQUFBOztBQUVELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsY0FBYyxFQUFFO0FBQ3RELE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxNQUFNLENBQUE7O0FBRVYsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFVBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFFBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUNqRTtBQUNELFNBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtDQUN0QixDQUFBOzs7OztXQzNCZ0QsT0FBTyxDQUFDLGNBQWMsQ0FBQzs7SUFBbkUsa0JBQWtCLFFBQWxCLGtCQUFrQjtJQUFFLG9CQUFvQixRQUFwQixvQkFBb0I7WUFDTSxPQUFPLENBQUMsY0FBYyxDQUFDOztJQUFyRSxtQkFBbUIsU0FBbkIsbUJBQW1CO0lBQUUscUJBQXFCLFNBQXJCLHFCQUFxQjtZQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDOztJQUE1QixNQUFNLFNBQU4sTUFBTTtZQUNzQixPQUFPLENBQUMsWUFBWSxDQUFDOztJQUFqRCxNQUFNLFNBQU4sTUFBTTtJQUFFLE9BQU8sU0FBUCxPQUFPO0lBQUUsT0FBTyxTQUFQLE9BQU87WUFDUixPQUFPLENBQUMsYUFBYSxDQUFDOztJQUF0QyxZQUFZLFNBQVosWUFBWTs7O0FBRWpCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFBOztBQUUzQixJQUFNLGVBQWUsR0FBTyxDQUFDLENBQUE7QUFDN0IsSUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUE7QUFDN0IsSUFBTSxjQUFjLEdBQVEsQ0FBQyxDQUFBO0FBQzdCLElBQU0sVUFBVSxHQUFZLGVBQWUsR0FBRyxjQUFjLENBQUE7QUFDNUQsSUFBTSxnQkFBZ0IsR0FBTSxPQUFPLENBQUE7O0FBRW5DLFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUN4QixTQUFPLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTtDQUM1Qzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUU7QUFDM0IsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFO0FBQzFCLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTs7QUFFN0MsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ3hELFNBQU8sRUFBRSxDQUFBO0NBQ1Y7O0FBRUQsU0FBUyxhQUFhLENBQUUsS0FBSyxFQUFFO0FBQzdCLFNBQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFBO0NBQ2hEOzs7QUFHRCxTQUFTLHVCQUF1QixDQUFFLEtBQUssRUFBRTtBQUN2QyxNQUFJLEVBQUUsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7O0FBRTdDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFVBQVUsRUFBRTtBQUN6RCxVQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtHQUMxQjtBQUNELFNBQU8sRUFBRSxDQUFBO0NBQ1Y7O0FBRUQsU0FBUyxVQUFVLENBQUUsSUFBSSxFQUFFO0FBQ3pCLFNBQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDN0I7O0FBRUQsU0FBUyxXQUFXLENBQUUsSUFBSSxFQUFFO0FBQzFCLFNBQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxDQUFBO0NBQ2hEOzs7QUFHRCxTQUFTLGdCQUFnQixDQUFFLElBQUksRUFBRTtBQUMvQixTQUFPLElBQUksWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQTtDQUNsQzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxJQUFJLEVBQUU7QUFDMUIsTUFBSSxDQUFDLEtBQUssR0FBUSxDQUFDLENBQUE7QUFDbkIsTUFBSSxDQUFDLEtBQUssR0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEMsTUFBSSxDQUFDLE9BQU8sR0FBTSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbkMsTUFBSSxDQUFDLE1BQU0sR0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbEMsTUFBSSxDQUFDLFNBQVMsR0FBSSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDckMsTUFBSSxDQUFDLFNBQVMsR0FBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUNoRDs7QUFFRCxTQUFTLFlBQVksQ0FBRSxJQUFJLEVBQUU7QUFDM0IsTUFBSSxDQUFDLEtBQUssR0FBVSxDQUFDLENBQUE7QUFDckIsTUFBSSxDQUFDLE9BQU8sR0FBUSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEMsTUFBSSxDQUFDLFFBQVEsR0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDckMsTUFBSSxDQUFDLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUMzQzs7QUFFRCxTQUFTLFVBQVUsQ0FBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTs7QUFDMUMsTUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFBO0FBQ3hCLE1BQUksSUFBSSxHQUFhLE1BQU0sQ0FBQTtBQUMzQixNQUFJLEVBQUUsR0FBZSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQy9DLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0FBQ3JFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3pFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO0FBQ3RFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO0FBQzFFLE1BQUksYUFBYSxHQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQzFDLE1BQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBOzs7QUFHMUMsTUFBSSxTQUFTLEdBQVEsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFBO0FBQ3RDLE1BQUksWUFBWSxHQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN0QyxNQUFJLFdBQVcsR0FBTSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDdEMsTUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFBO0FBQ3RDLE1BQUksY0FBYyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTs7O0FBR3RDLE1BQUksWUFBWSxHQUFRLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN6QyxNQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN6QyxNQUFJLFdBQVcsR0FBUyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUE7OztBQUd6QyxNQUFJLFdBQVcsR0FBUSxFQUFFLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ3hFLE1BQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQTs7Ozs7QUFLeEUsTUFBSSxjQUFjLEdBQVEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUMxRSxNQUFJLG1CQUFtQixHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7OztBQUcvRSxNQUFJLHVCQUF1QixHQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFDbEYsTUFBSSx3QkFBd0IsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFBOztBQUVuRixNQUFJLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDakMsTUFBSSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ2pDLE1BQUksWUFBWSxHQUFRLElBQUksWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUE7O0FBRTFELElBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ25CLElBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtBQUNsRCxJQUFFLENBQUMsVUFBVSxDQUFDLENBQUcsRUFBRSxDQUFHLEVBQUUsQ0FBRyxFQUFFLENBQUcsQ0FBQyxDQUFBO0FBQ2pDLElBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDcEMsSUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUE7O0FBRTdCLE1BQUksQ0FBQyxVQUFVLEdBQUc7QUFDaEIsU0FBSyxFQUFHLEtBQUssSUFBSSxJQUFJO0FBQ3JCLFVBQU0sRUFBRSxNQUFNLElBQUksSUFBSTtHQUN2QixDQUFBOztBQUVELE1BQUksQ0FBQyxRQUFRLEdBQUcsVUFBQyxPQUFPLEVBQUs7QUFDM0IscUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0FBQy9ELFdBQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQ3RDLENBQUE7O0FBRUQsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFDLEtBQUssRUFBSztBQUMzQixRQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7O0FBRXpCLHFCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDckMsTUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQ3RDLE1BQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDMUUsV0FBTyxPQUFPLENBQUE7R0FDZixDQUFBOztBQUVELE1BQUksQ0FBQyxNQUFNLEdBQUcsVUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFLO0FBQy9CLFFBQUksS0FBSyxHQUFTLE1BQUssVUFBVSxDQUFDLEtBQUssR0FBRyxNQUFLLFVBQVUsQ0FBQyxNQUFNLENBQUE7QUFDaEUsUUFBSSxXQUFXLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQTtBQUNoQyxRQUFJLFFBQVEsR0FBTSxLQUFLLElBQUksV0FBVyxDQUFBO0FBQ3RDLFFBQUksUUFBUSxHQUFNLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUE7QUFDckQsUUFBSSxTQUFTLEdBQUssUUFBUSxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQTs7QUFFckQsVUFBTSxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUE7QUFDeEIsVUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUE7QUFDekIsTUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQTtHQUN2QyxDQUFBOztBQUVELE1BQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBSztBQUM5RCxRQUFJLEVBQUUsR0FBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksTUFBSyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDbEUsUUFBSSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE1BQUssUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBOztBQUUxRCxVQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzVDLFVBQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDNUQsU0FBSyxDQUFDLEtBQUssRUFBRSxDQUFBO0dBQ2QsQ0FBQTs7QUFFRCxNQUFJLENBQUMsVUFBVSxHQUFHLFVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUs7QUFDckQsUUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTs7QUFFaEMsZ0JBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdkQsZ0JBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDckQsZ0JBQVksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDL0QsZ0JBQVksQ0FBQyxLQUFLLElBQUksV0FBVyxDQUFBO0dBQ2xDLENBQUE7O0FBRUQsTUFBSSxhQUFhLEdBQUcsVUFBQyxLQUFLO1dBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQUEsQ0FBQTs7QUFFOUMsTUFBSSxZQUFZLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDNUIsZ0JBQVksQ0FBQyxFQUFFLEVBQ2IsWUFBWSxFQUNaLGNBQWMsRUFDZCxlQUFlLEVBQ2YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ2pCLGdCQUFZLENBQ1YsRUFBRSxFQUNGLGlCQUFpQixFQUNqQixtQkFBbUIsRUFDbkIsbUJBQW1CLEVBQ25CLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUNyQixNQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuRCxNQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN0RSxNQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFBO0dBQ2pFLENBQUE7O0FBRUQsTUFBSSxVQUFVLEdBQUcsVUFBQyxLQUFLO1dBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQUEsQ0FBQTs7QUFFM0MsTUFBSSxTQUFTLEdBQUcsVUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFLO0FBQ2xDLE1BQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUN0QyxnQkFBWSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7Ozs7QUFJdEUsZ0JBQVksQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDcEYsTUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFBO0dBQzdELENBQUE7O0FBRUQsTUFBSSxDQUFDLEtBQUssR0FBRyxZQUFNO0FBQ2pCLHFCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNyQyxpQkFBYSxDQUFDLFlBQVksQ0FBQyxDQUFBO0dBQzVCLENBQUE7O0FBRUQsTUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFNO0FBQ2xCLE1BQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUE7OztBQUc3QixNQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFBOztBQUU1QixNQUFFLENBQUMsU0FBUyxDQUFDLHVCQUF1QixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNqRCxxQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7OztBQUdwQyxNQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFBOztBQUU3QixNQUFFLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNsRCxnQkFBWSxDQUFDLFlBQVksQ0FBQyxDQUFBO0dBQzNCLENBQUE7Q0FDRjs7Ozs7V0MzTmlCLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBQS9CLFNBQVMsUUFBVCxTQUFTO0FBQ2QsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDNUMsSUFBSSxLQUFLLEdBQVUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3JDLElBQUksTUFBTSxHQUFTLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUN0QyxJQUFJLFVBQVUsR0FBSyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDMUMsSUFBSSxXQUFXLEdBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQzNDLElBQUksS0FBSyxHQUFVLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUNyQyxJQUFJLFdBQVcsR0FBSSxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUNsRCxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTs7QUFFNUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7OztBQUdyQixTQUFTLElBQUksQ0FBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFDekQsV0FBVyxFQUFFLFlBQVksRUFBRTtBQUN4QyxXQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3ZCLFdBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDdkIsV0FBUyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQTtBQUNyQyxXQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3pCLFdBQVMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFDL0IsV0FBUyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuQyxXQUFTLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0FBQ25DLFdBQVMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUE7O0FBRXJDLE1BQUksQ0FBQyxLQUFLLEdBQVUsS0FBSyxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxLQUFLLEdBQVUsS0FBSyxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxNQUFNLEdBQVMsTUFBTSxDQUFBO0FBQzFCLE1BQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO0FBQ2hDLE1BQUksQ0FBQyxRQUFRLEdBQU8sUUFBUSxDQUFBO0FBQzVCLE1BQUksQ0FBQyxXQUFXLEdBQUksV0FBVyxDQUFBO0FBQy9CLE1BQUksQ0FBQyxXQUFXLEdBQUksV0FBVyxDQUFBO0FBQy9CLE1BQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBOzs7QUFHaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ25FLFFBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7R0FDeEM7Q0FDRjs7QUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFZO0FBQ2pDLE1BQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFBOztBQUU5QyxTQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNuRCxZQUFVLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRztXQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7R0FBQSxDQUFDLENBQUE7Q0FDMUQsQ0FBQTs7QUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxZQUFZLEVBRWpDLENBQUE7Ozs7O1dDaERpQixPQUFPLENBQUMsU0FBUyxDQUFDOztJQUEvQixTQUFTLFFBQVQsU0FBUztBQUNkLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBOztBQUVsRCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQTs7O0FBRzdCLFNBQVMsWUFBWSxDQUFFLGVBQWUsRUFBRTtBQUN0QyxXQUFTLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0FBQzNDLE1BQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFBO0NBQ3ZDOzs7OztBQ1RELE1BQU0sQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFBOztBQUVoQyxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUE7O0FBRXJCLFNBQVMsZUFBZSxDQUFFLFFBQVEsRUFBRTtBQUNsQyxNQUFJLE9BQU8sR0FBUyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUM3QyxNQUFJLFNBQVMsR0FBTyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUM3QyxNQUFJLE9BQU8sR0FBUyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUM3QyxNQUFJLGFBQWEsR0FBRyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFFOUMsTUFBSSxhQUFhLEdBQUcsZ0JBQWU7UUFBYixPQUFPLFFBQVAsT0FBTztBQUMzQixhQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDdEMsV0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFLLElBQUksQ0FBQTtHQUMxQixDQUFBOztBQUVELE1BQUksV0FBVyxHQUFHLGlCQUFlO1FBQWIsT0FBTyxTQUFQLE9BQU87QUFDekIsV0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFLLElBQUksQ0FBQTtBQUN6QixXQUFPLENBQUMsT0FBTyxDQUFDLEdBQUssS0FBSyxDQUFBO0dBQzNCLENBQUE7O0FBRUQsTUFBSSxVQUFVLEdBQUcsWUFBTTtBQUNyQixRQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTs7QUFFVixXQUFPLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRTtBQUN0QixhQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUssQ0FBQyxDQUFBO0FBQ2hCLGVBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDaEIsYUFBTyxDQUFDLENBQUMsQ0FBQyxHQUFLLENBQUMsQ0FBQTtLQUNqQjtHQUNGLENBQUE7O0FBRUQsTUFBSSxDQUFDLE9BQU8sR0FBUyxPQUFPLENBQUE7QUFDNUIsTUFBSSxDQUFDLE9BQU8sR0FBUyxPQUFPLENBQUE7QUFDNUIsTUFBSSxDQUFDLFNBQVMsR0FBTyxTQUFTLENBQUE7QUFDOUIsTUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUE7O0FBRWxDLE1BQUksQ0FBQyxJQUFJLEdBQUcsVUFBQyxFQUFFLEVBQUs7QUFDbEIsUUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7O0FBRVYsV0FBTyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUU7QUFDdEIsZUFBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTtBQUNwQixhQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUssS0FBSyxDQUFBO0FBQ3BCLFVBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUEsS0FDdEIsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUNyQztHQUNGLENBQUE7O0FBRUQsVUFBUSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQTtBQUNuRCxVQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0FBQy9DLFVBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUE7Q0FDOUM7Ozs7O0FDakRELElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTs7QUFFaEMsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQTs7QUFFeEMsU0FBUyx1QkFBdUIsR0FBSTtBQUNsQyxRQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFBO0NBQzlDOztBQUVELHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFO0FBQ2pFLE1BQUksRUFBRSxHQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtBQUM3QixNQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFLLENBQUMsQ0FBQyxDQUFBO0FBQ1osTUFBSSxHQUFHLENBQUE7QUFDUCxNQUFJLFFBQVEsQ0FBQTtBQUNaLE1BQUksWUFBWSxDQUFBO0FBQ2hCLE1BQUksV0FBVyxDQUFBO0FBQ2YsTUFBSSxZQUFZLENBQUE7QUFDaEIsTUFBSSxTQUFTLENBQUE7QUFDYixNQUFJLFNBQVMsQ0FBQTtBQUNiLE1BQUksYUFBYSxDQUFBOztBQUVqQixTQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNoQixPQUFHLEdBQWEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzNCLGdCQUFZLEdBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQTtBQUNsRCxlQUFXLEdBQUssR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQTtBQUM3QyxnQkFBWSxHQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7QUFDaEQsYUFBUyxHQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDN0UsWUFBUSxHQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUE7QUFDOUMsYUFBUyxHQUFPLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDN0IsaUJBQWEsR0FBRyxTQUFTLElBQUksQ0FBQyxDQUFBOztBQUU5QixRQUFJLGFBQWEsRUFBRTtBQUNqQixTQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQzFFLFNBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEdBQU8sU0FBUyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUE7S0FDcEUsTUFBTTtBQUNMLFNBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFBO0tBQzNDO0dBQ0Y7Q0FDRixDQUFBOzs7OztBQ3RDRCxTQUFTLE1BQU0sR0FBSTs7QUFDakIsTUFBSSxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUEsQ0FBQTs7QUFFL0IsTUFBSSxPQUFPLEdBQUcsVUFBQyxJQUFJLEVBQUs7QUFDdEIsV0FBTyxVQUFVLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDekIsVUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7O0FBRW5ELFVBQUksR0FBRyxHQUFHLElBQUksY0FBYyxFQUFBLENBQUE7O0FBRTVCLFNBQUcsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBQ3ZCLFNBQUcsQ0FBQyxNQUFNLEdBQVM7ZUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUM7T0FBQSxDQUFBO0FBQy9DLFNBQUcsQ0FBQyxPQUFPLEdBQVE7ZUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUM7T0FBQSxDQUFBO0FBQ2hFLFNBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMzQixTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ2YsQ0FBQTtHQUNGLENBQUE7O0FBRUQsTUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ3ZDLE1BQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFbEMsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7O0FBRTVCLE1BQUksQ0FBQyxXQUFXLEdBQUcsVUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFLO0FBQy9CLFFBQUksQ0FBQyxHQUFTLElBQUksS0FBSyxFQUFBLENBQUE7QUFDdkIsUUFBSSxNQUFNLEdBQUk7YUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUFBLENBQUE7QUFDL0IsUUFBSSxPQUFPLEdBQUc7YUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FBQSxDQUFBOztBQUUzRCxLQUFDLENBQUMsTUFBTSxHQUFJLE1BQU0sQ0FBQTtBQUNsQixLQUFDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtBQUNuQixLQUFDLENBQUMsR0FBRyxHQUFPLElBQUksQ0FBQTtHQUNqQixDQUFBOztBQUVELE1BQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFLO0FBQzdCLGNBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFLO0FBQ2hDLFVBQUksYUFBYSxHQUFHLFVBQUMsTUFBTTtlQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO09BQUEsQ0FBQTtBQUNoRCxVQUFJLGFBQWEsR0FBRyxFQUFFLENBQUE7O0FBRXRCLGNBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQTtLQUMvRCxDQUFDLENBQUE7R0FDSCxDQUFBOztBQUVELE1BQUksQ0FBQyxVQUFVLEdBQUcsZ0JBQThCLEVBQUUsRUFBSztRQUFuQyxNQUFNLFFBQU4sTUFBTTtRQUFFLFFBQVEsUUFBUixRQUFRO1FBQUUsT0FBTyxRQUFQLE9BQU87QUFDM0MsUUFBSSxTQUFTLEdBQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUE7QUFDNUMsUUFBSSxXQUFXLEdBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUE7QUFDOUMsUUFBSSxVQUFVLEdBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUE7QUFDN0MsUUFBSSxVQUFVLEdBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQTtBQUNuQyxRQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JDLFFBQUksV0FBVyxHQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUE7QUFDcEMsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxHQUFHLEdBQVk7QUFDakIsWUFBTSxFQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFO0tBQ3JDLENBQUE7O0FBRUQsUUFBSSxTQUFTLEdBQUcsWUFBTTtBQUNwQixVQUFJLFVBQVUsSUFBSSxDQUFDLElBQUksWUFBWSxJQUFJLENBQUMsSUFBSSxXQUFXLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7S0FDNUUsQ0FBQTs7QUFFRCxRQUFJLGFBQWEsR0FBRyxVQUFDLElBQUksRUFBRSxJQUFJLEVBQUs7QUFDbEMsZ0JBQVUsRUFBRSxDQUFBO0FBQ1osU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7QUFDdkIsZUFBUyxFQUFFLENBQUE7S0FDWixDQUFBOztBQUVELFFBQUksZUFBZSxHQUFHLFVBQUMsSUFBSSxFQUFFLElBQUksRUFBSztBQUNwQyxrQkFBWSxFQUFFLENBQUE7QUFDZCxTQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUN6QixlQUFTLEVBQUUsQ0FBQTtLQUNaLENBQUE7O0FBRUQsUUFBSSxjQUFjLEdBQUcsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFLO0FBQ25DLGlCQUFXLEVBQUUsQ0FBQTtBQUNiLFNBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ3hCLGVBQVMsRUFBRSxDQUFBO0tBQ1osQ0FBQTs7QUFFRCxXQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFOztBQUNyQixZQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUE7O0FBRXRCLGNBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUs7QUFDekMsdUJBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDekIsQ0FBQyxDQUFBOztLQUNIO0FBQ0QsV0FBTyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTs7QUFDdkIsWUFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUV4QixjQUFLLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFLO0FBQzdDLHlCQUFlLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1NBQzNCLENBQUMsQ0FBQTs7S0FDSDtBQUNELFdBQU8sVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7O0FBQ3RCLFlBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs7QUFFdkIsY0FBSyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUMzQyx3QkFBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUMxQixDQUFDLENBQUE7O0tBQ0g7R0FDRixDQUFBO0NBQ0Y7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7Ozs7O0FDckd2QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7O0FBRWhDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUE7O0FBRWxDLFNBQVMsaUJBQWlCLEdBQUk7QUFDNUIsUUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFBO0NBQ25EOztBQUVELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFO01BQ3RELEtBQUssR0FBa0IsS0FBSyxDQUFDLElBQUksQ0FBakMsS0FBSztNQUFFLFlBQVksR0FBSSxLQUFLLENBQUMsSUFBSSxDQUExQixZQUFZO01BQ25CLGVBQWUsR0FBSSxZQUFZLENBQS9CLGVBQWU7QUFDcEIsTUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFBO0FBQ2pCLE1BQUksTUFBTSxHQUFNLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTs7O0FBRzNCLE1BQUksQ0FBQyxNQUFNLEVBQUUsT0FBTTs7QUFFbkIsTUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFBO0FBQ3pFLE1BQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxHQUFHLFNBQVMsQ0FBQTtDQUMxRSxDQUFBOzs7OztXQ25CYyxPQUFPLENBQUMsU0FBUyxDQUFDOztJQUE1QixNQUFNLFFBQU4sTUFBTTtBQUNYLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTs7QUFFaEMsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUE7O0FBRWhDLFNBQVMsZUFBZSxHQUFJO0FBQzFCLFFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUE7Q0FDN0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkQsU0FBUyxPQUFPLENBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUU7QUFDakQsTUFBSSxDQUFDLFFBQVEsR0FBTyxRQUFRLENBQUE7QUFDNUIsTUFBSSxDQUFDLE9BQU8sR0FBUSxPQUFPLENBQUE7QUFDM0IsTUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7Q0FDakM7O0FBRUQsU0FBUyxXQUFXLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO0FBQy9ELE1BQUksUUFBUSxHQUFPLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDbkQsTUFBSSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNuRCxNQUFJLFNBQVMsR0FBTSxDQUFDLEdBQUcsTUFBTSxDQUFBO0FBQzdCLE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBOztBQUVWLFNBQVEsRUFBRyxDQUFDLEdBQUcsTUFBTSxFQUFHO0FBQ3RCLFVBQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDdkQsZ0JBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7R0FDcEQ7QUFDRCxTQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQTtDQUMzQzs7QUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLFlBQVksQ0FBQyxDQUNoQyxDQUFDLEVBQUssR0FBRyxFQUNULElBQUksRUFBRSxHQUFHLEVBQ1QsQ0FBQyxFQUFLLElBQUksRUFDVixJQUFJLEVBQUUsSUFBSSxDQUNYLENBQUMsQ0FBQTtBQUNGLElBQUksWUFBWSxHQUFHLElBQUksV0FBVyxDQUFDLENBQ2pDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNQLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUNSLENBQUMsQ0FBQTtBQUNGLElBQUksV0FBVyxHQUFHLElBQUksWUFBWSxDQUFDLENBQ2pDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUUsRUFDYixDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFFLEVBQ2IsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUksQ0FBQyxFQUNaLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFJLENBQUMsQ0FDYixDQUFDLENBQUE7O0FBRUYsSUFBSSxLQUFLLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQTs7QUFFOUQsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFO01BQ3BELFFBQVEsR0FBSSxLQUFLLENBQUMsSUFBSSxDQUF0QixRQUFRO0FBQ2IsTUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQTtBQUN6QixNQUFJLENBQUMsR0FBSyxDQUFDLENBQUMsQ0FBQTtBQUNaLE1BQUksR0FBRyxDQUFBO0FBQ1AsTUFBSSxLQUFLLENBQUE7O0FBRVQsVUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBOzs7QUFHaEIsVUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFBOztBQUV0RSxTQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNoQixPQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUVqQixRQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUU7QUFDaEIsV0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQTtBQUNoRixjQUFRLENBQUMsU0FBUyxDQUNoQixHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUs7QUFDcEIsU0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2pCLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUNsQixHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFDYixHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFDYixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUN6QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQzNDLENBQUE7S0FDRixNQUFNO0FBQ0wsY0FBUSxDQUFDLFNBQVMsQ0FDaEIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLO0FBQ3BCLFNBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNqQixHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFDbEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ2IsQ0FBQztBQUNELE9BQUM7QUFDRCxPQUFDO0FBQ0QsT0FBQztPQUNGLENBQUE7S0FDRjtHQUNGO0NBQ0YsQ0FBQTs7Ozs7QUM3R0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7O0FBRXRCLFNBQVMsS0FBSyxDQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDN0IsTUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUE7O0FBRS9ELE1BQUksQ0FBQyxJQUFJLEdBQU0sSUFBSSxDQUFBO0FBQ25CLE1BQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0FBQ3RCLE1BQUksQ0FBQyxJQUFJLEdBQU0sSUFBSSxDQUFBO0NBQ3BCOztBQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxFQUFFO0FBQ3BDLElBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDZixDQUFBOztBQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsRUFBRSxFQUFFO0FBQ3JDLE1BQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFBO0FBQ2pDLE1BQUksR0FBRyxHQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0FBQy9CLE1BQUksQ0FBQyxHQUFPLENBQUMsQ0FBQyxDQUFBO0FBQ2QsTUFBSSxNQUFNLENBQUE7O0FBRVYsU0FBTyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUU7QUFDaEIsVUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDeEIsVUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQTtHQUNyRDtDQUNGLENBQUE7Ozs7O1dDeEJpQixPQUFPLENBQUMsYUFBYSxDQUFDOztJQUFuQyxTQUFTLFFBQVQsU0FBUzs7O0FBRWQsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUE7O0FBRTdCLFNBQVMsWUFBWSxDQUFFLE9BQU0sRUFBSztNQUFYLE9BQU0sZ0JBQU4sT0FBTSxHQUFDLEVBQUU7QUFDOUIsTUFBSSxPQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7O0FBRTFFLE1BQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO0FBQ3hCLE1BQUksT0FBTSxHQUFhLE9BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLE1BQU0sR0FBUSxPQUFNLENBQUE7QUFDekIsTUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTs7QUFFM0MsTUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLFNBQVMsRUFBRTtBQUN2QyxRQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFNLENBQUMsQ0FBQTs7QUFFaEQsUUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsR0FBRyw0QkFBNEIsQ0FBQyxDQUFBOztBQUVyRSxvQkFBZ0IsR0FBRyxPQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3hDLFFBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO0dBQ3pCLENBQUE7O0FBRUQsTUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZO0FBQ3pCLFFBQUksS0FBSyxHQUFHLE9BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQTs7QUFFeEMsUUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtHQUM5QyxDQUFBO0NBQ0Y7Ozs7O0FDN0JELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBOztBQUV2QixTQUFTLE1BQU0sQ0FBRSxjQUFjLEVBQUs7TUFBbkIsY0FBYyxnQkFBZCxjQUFjLEdBQUMsRUFBRTtBQUNoQyxNQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTtDQUNyQzs7O0FBR0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBRWpELENBQUE7Ozs7O1dDVDhCLE9BQU8sQ0FBQyxlQUFlLENBQUM7O0lBQWxELE1BQU0sUUFBTixNQUFNO0lBQUUsS0FBSyxRQUFMLEtBQUs7SUFBRSxPQUFPLFFBQVAsT0FBTztBQUMzQixJQUFJLGlCQUFpQixHQUFTLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQzVELElBQUksZUFBZSxHQUFXLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0FBQzFELElBQUksdUJBQXVCLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUE7QUFDbEUsSUFBSSxLQUFLLEdBQXFCLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFFaEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUE7O0FBRTFCLFNBQVMsU0FBUyxHQUFJO0FBQ3BCLE1BQUksT0FBTyxHQUFHLENBQ1osSUFBSSxpQkFBaUIsRUFBQSxFQUNyQixJQUFJLHVCQUF1QixFQUFBLEVBQzNCLElBQUksZUFBZSxFQUFBLENBQ3BCLENBQUE7O0FBRUQsT0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0NBQ2xDOztBQUVELFNBQVMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7O0FBRXBELFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxFQUFFO01BQ25DLEtBQUssR0FBc0MsSUFBSSxDQUFDLElBQUksQ0FBcEQsS0FBSztNQUFFLE1BQU0sR0FBOEIsSUFBSSxDQUFDLElBQUksQ0FBN0MsTUFBTTtNQUFFLFdBQVcsR0FBaUIsSUFBSSxDQUFDLElBQUksQ0FBckMsV0FBVztNQUFFLFdBQVcsR0FBSSxJQUFJLENBQUMsSUFBSSxDQUF4QixXQUFXO01BQ3ZDLEVBQUUsR0FBSSxXQUFXLENBQUMsUUFBUSxDQUExQixFQUFFO0FBQ1AsTUFBSSxNQUFNLEdBQUc7O0FBRVgsWUFBUSxFQUFFO0FBQ1IsWUFBTSxFQUFHLGlDQUFpQztBQUMxQyxZQUFNLEVBQUcsaUNBQWlDO0FBQzFDLGFBQU8sRUFBRSxnQ0FBZ0M7S0FDMUM7R0FDRixDQUFBOztBQUVELFFBQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsR0FBRyxFQUFFLFlBQVksRUFBRTtRQUNoRCxRQUFRLEdBQVksWUFBWSxDQUFoQyxRQUFRO1FBQUUsTUFBTSxHQUFJLFlBQVksQ0FBdEIsTUFBTTs7O0FBRXJCLFNBQUssQ0FBQyxNQUFNLEdBQUssTUFBTSxDQUFBO0FBQ3ZCLFNBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO0FBQ3pCLGVBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ3JFLGVBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ25FLGVBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBOzs7QUFHdEUsTUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQ1QsQ0FBQyxDQUFBO0NBQ0gsQ0FBQTs7Ozs7V0M1QzZDLE9BQU8sQ0FBQyxjQUFjLENBQUM7O0lBQWhFLFVBQVUsUUFBVixVQUFVO0lBQUUsT0FBTyxRQUFQLE9BQU87SUFBRSxnQkFBZ0IsUUFBaEIsZ0JBQWdCO1lBQ3pCLE9BQU8sQ0FBQyxjQUFjLENBQUM7O0lBQW5DLFFBQVEsU0FBUixRQUFRO0FBQ2IsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ3RDLElBQUksTUFBTSxHQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTs7QUFFbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUksTUFBTSxDQUFBO0FBQy9CLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFLLEtBQUssQ0FBQTtBQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7O0FBRWhDLFNBQVMsTUFBTSxDQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDbEMsUUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNqQixZQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDN0IsU0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUN6QixrQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUN2Qjs7QUFFRCxTQUFTLEtBQUssQ0FBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2pDLFFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDakIsWUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzdCLFNBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDekIsVUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDckIsUUFBSSxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0dBQzFELENBQUMsQ0FBQTtDQUNIOztBQUVELFNBQVMsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDbkMsUUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNqQixZQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDN0IsU0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUN6QixVQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUN6QixZQUFRLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQztHQUMzRCxDQUFDLENBQUE7Q0FDSDs7Ozs7QUNoQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQVMsVUFBVSxDQUFBO0FBQzVDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFZLE9BQU8sQ0FBQTtBQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFBO0FBQ2xELE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFXLFFBQVEsQ0FBQTs7QUFFMUMsU0FBUyxVQUFVLENBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO0FBQzVDLEdBQUMsQ0FBQyxVQUFVLEdBQUc7QUFDYixTQUFLLEVBQUwsS0FBSztBQUNMLFNBQUssRUFBTCxLQUFLO0FBQ0wsVUFBTSxFQUFOLE1BQU07QUFDTixZQUFRLEVBQUUsQ0FBQztBQUNYLFVBQU0sRUFBRTtBQUNOLE9BQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUNaLE9BQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQztLQUNkO0FBQ0QsU0FBSyxFQUFFO0FBQ0wsT0FBQyxFQUFFLENBQUM7QUFDSixPQUFDLEVBQUUsQ0FBQztLQUNMO0dBQ0YsQ0FBQTtBQUNELFNBQU8sQ0FBQyxDQUFBO0NBQ1Q7O0FBRUQsU0FBUyxPQUFPLENBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN4QyxHQUFDLENBQUMsT0FBTyxHQUFHO0FBQ1YsU0FBSyxFQUFMLEtBQUs7QUFDTCxVQUFNLEVBQU4sTUFBTTtBQUNOLEtBQUMsRUFBRCxDQUFDO0FBQ0QsS0FBQyxFQUFELENBQUM7QUFDRCxNQUFFLEVBQUcsQ0FBQztBQUNOLE1BQUUsRUFBRyxDQUFDO0FBQ04sT0FBRyxFQUFFLENBQUM7QUFDTixPQUFHLEVBQUUsQ0FBQztHQUNQLENBQUE7QUFDRCxTQUFPLENBQUMsQ0FBQTtDQUNUOztBQUVELFNBQVMsZ0JBQWdCLENBQUUsQ0FBQyxFQUFFO0FBQzVCLEdBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7Q0FDMUI7O0FBRUQsU0FBUyxRQUFRLENBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRTtBQUNwRCxHQUFDLENBQUMsUUFBUSxHQUFHO0FBQ1gsY0FBVSxFQUFhLFFBQVE7QUFDL0Isd0JBQW9CLEVBQUcsb0JBQW9CO0FBQzNDLHlCQUFxQixFQUFFLENBQUM7QUFDeEIsb0JBQWdCLEVBQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDO0FBQ3JELHFCQUFpQixFQUFNLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRO0dBQ3pFLENBQUE7Q0FDRjs7Ozs7QUNqREQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO0FBQ3BDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFLLE9BQU8sQ0FBQTs7O0FBR2xDLFNBQVMsU0FBUyxDQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFO0FBQ2pELE1BQUksR0FBRyxHQUFLLGNBQWMsQ0FBQyxNQUFNLENBQUE7QUFDakMsTUFBSSxDQUFDLEdBQU8sQ0FBQyxDQUFDLENBQUE7QUFDZCxNQUFJLEtBQUssR0FBRyxJQUFJLENBQUE7O0FBRWhCLFNBQVEsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFHO0FBQ2xCLFFBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUN2QyxXQUFLLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFlBQUs7S0FDTjtHQUNGO0FBQ0QsU0FBTyxLQUFLLENBQUE7Q0FDYjs7QUFFRCxTQUFTLE9BQU8sQ0FBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQzNCLE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBOztBQUVWLFNBQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQTtBQUNqRCxTQUFPLElBQUksQ0FBQTtDQUNaOzs7Ozs7QUN0QkQsU0FBUyxZQUFZLENBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtBQUN2RCxJQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDdEMsSUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUE7QUFDckQsSUFBRSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQy9CLElBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtDQUM5RDs7QUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7Ozs7O0FDUjFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsd2RBcUJoQyxDQUFBOztBQUVKLE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsK0pBU2xDLENBQUE7O0FBRUosTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyw4YkFlakMsQ0FBQTs7QUFFSixNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixHQUFHLGtIQU9uQyxDQUFBOzs7Ozs7QUN6REosU0FBUyxNQUFNLENBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDOUIsTUFBSSxNQUFNLEdBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNuQyxNQUFJLE9BQU8sR0FBRyxLQUFLLENBQUE7O0FBRW5CLElBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQzVCLElBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUE7O0FBRXhCLFNBQU8sR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQTs7QUFFMUQsTUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0FBQ25GLFNBQWMsTUFBTSxDQUFBO0NBQ3JCOzs7QUFHRCxTQUFTLE9BQU8sQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtBQUM1QixNQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTs7QUFFdEMsSUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDNUIsSUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDNUIsSUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUN2QixTQUFPLE9BQU8sQ0FBQTtDQUNmOzs7QUFHRCxTQUFTLE9BQU8sQ0FBRSxFQUFFLEVBQUU7QUFDcEIsTUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDOztBQUVqQyxJQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUM3QixJQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDdEMsSUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDeEQsSUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JFLElBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNyRSxJQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuRSxJQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuRSxTQUFPLE9BQU8sQ0FBQTtDQUNmOztBQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFJLE1BQU0sQ0FBQTtBQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7QUFDaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBOzs7OztBQ3hDaEMsSUFBSSxNQUFNLEdBQVksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3pDLElBQUksVUFBVSxHQUFRLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM3QyxJQUFJLFdBQVcsR0FBTyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUNyRCxJQUFJLEtBQUssR0FBYSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDeEMsSUFBSSxLQUFLLEdBQWEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3hDLElBQUksWUFBWSxHQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9DLElBQUksU0FBUyxHQUFTLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUM1QyxJQUFJLElBQUksR0FBYyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDdkMsSUFBSSxZQUFZLEdBQU0sT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDL0MsSUFBSSxlQUFlLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUE7QUFDbEQsSUFBSSxXQUFXLEdBQU8sT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQzlDLElBQUksTUFBTSxHQUFZLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7O0FBRXRELElBQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQTtBQUMxQixJQUFNLFNBQVMsR0FBUyxJQUFJLENBQUE7O0FBRTVCLElBQUksZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ25ELElBQUksWUFBWSxHQUFNLElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQ3ZELElBQUksV0FBVyxHQUFPLElBQUksV0FBVyxFQUFBLENBQUE7QUFDckMsSUFBSSxLQUFLLEdBQWEsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ3pDLElBQUksS0FBSyxHQUFhLElBQUksS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUE7QUFDdkQsSUFBSSxNQUFNLEdBQVksSUFBSSxNQUFNLEVBQUEsQ0FBQTtBQUNoQyxJQUFJLFFBQVEsR0FBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ3hELElBQUksV0FBVyxHQUFPLElBQUksV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDckQsSUFBSSxZQUFZLEdBQU0sSUFBSSxZQUFZLENBQUMsQ0FBQyxJQUFJLFNBQVMsRUFBQSxDQUFDLENBQUMsQ0FBQTtBQUN2RCxJQUFJLElBQUksR0FBYyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQ2xDLFFBQVEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUNsQyxZQUFZLENBQUMsQ0FBQTs7b0JBRXZCLElBQUksRUFBRTtBQUN6QixjQUFxQixJQUFJLENBQUMsV0FBVyxDQUFBO0FBQ3JDLFlBQVMsR0FBWSxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQy9CLG1CQUFnQixHQUFLLElBQUksQ0FBQyxZQUFZO0FBQ3RDLGlEQUE4Qzs7QUFFOUMsMkJBQTBCO0FBQ3hCLFVBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNaLGlCQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDM0MsK0NBQTBDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDL0M7OztxQkFHbUIsSUFBSSxFQUFFO0FBQzFCLDRCQUEyQjtBQUN6QiwyQkFBc0I7QUFDdEIsbUNBQThCO0lBQy9COzs7bUJBR2U7O3VCQUVNLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO0FBQ2hELG9DQUFpQztBQUNqQyx5REFBc0Q7QUFDdEQ7QUFDRSwyREFBc0Q7S0FDdEQ7Ozs7QUFJRiwwQ0FBdUM7QUFDdkMsZUFBWTtBQUNaLDJDQUF3QztBQUN4QyxpREFBOEM7R0FDOUM7Ozs7O0FDaEVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFRLFNBQVMsQ0FBQTtBQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7QUFDOUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQVcsTUFBTSxDQUFBOztBQUV0QyxJQUFNLGVBQWUsR0FBTyxDQUFDLENBQUE7QUFDN0IsSUFBTSxjQUFjLEdBQVEsQ0FBQyxDQUFBO0FBQzdCLElBQU0sVUFBVSxHQUFZLGVBQWUsR0FBRyxjQUFjLENBQUE7O0FBRTVELFNBQVMsU0FBUyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDbEMsTUFBSSxDQUFDLENBQUMsUUFBUSxZQUFZLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0NBQ2pGOztBQUVELFNBQVMsY0FBYyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6RTs7QUFFRCxTQUFTLE1BQU0sQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QyxNQUFJLENBQUMsR0FBSSxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQzNCLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDZCxNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVkLFVBQVEsQ0FBQyxDQUFDLENBQUMsR0FBTSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7O0FBRW5CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ3BCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQUFCQiAodywgaCwgeCwgeSkge1xyXG4gIHRoaXMueCA9IHhcclxuICB0aGlzLnkgPSB5XHJcbiAgdGhpcy53ID0gd1xyXG4gIHRoaXMuaCA9IGhcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx4XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHggfSBcclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseVwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB5IH0gXHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnhcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geCArIHcgfVxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ5XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHkgKyBoIH1cclxuICB9KVxyXG59XHJcbiIsImxldCBBQUJCID0gcmVxdWlyZShcIi4vQUFCQlwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb25cclxuXHJcbmZ1bmN0aW9uIEZyYW1lIChhYWJiLCBkdXJhdGlvbikge1xyXG4gIHRoaXMuYWFiYiAgICAgPSBhYWJiXHJcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXHJcbn1cclxuXHJcbi8vcmF0ZSBpcyBpbiBtcy4gIFRoaXMgaXMgdGhlIHRpbWUgcGVyIGZyYW1lICg0MiB+IDI0ZnBzKVxyXG5mdW5jdGlvbiBBbmltYXRpb24gKGZyYW1lcywgZG9lc0xvb3AsIHJhdGU9NDIpIHtcclxuICB0aGlzLmxvb3AgICA9IGRvZXNMb29wXHJcbiAgdGhpcy5yYXRlICAgPSByYXRlXHJcbiAgdGhpcy5mcmFtZXMgPSBmcmFtZXNcclxufVxyXG5cclxuQW5pbWF0aW9uLmNyZWF0ZUxpbmVhciA9IGZ1bmN0aW9uICh3LCBoLCB4LCB5LCBjb3VudCwgZG9lc0xvb3AsIHJhdGU9NDIpIHtcclxuICBsZXQgZnJhbWVzID0gW11cclxuICBsZXQgaSAgICAgID0gLTFcclxuICBsZXQgZWFjaFhcclxuICBsZXQgYWFiYlxyXG5cclxuICB3aGlsZSAoKytpIDwgY291bnQpIHtcclxuICAgIGVhY2hYID0geCArIGkgKiB3XHJcbiAgICBhYWJiICA9IG5ldyBBQUJCKHcsIGgsIGVhY2hYLCB5KVxyXG4gICAgZnJhbWVzLnB1c2gobmV3IEZyYW1lKGFhYmIsIHJhdGUpKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBBbmltYXRpb24oZnJhbWVzLCBkb2VzTG9vcCwgcmF0ZSlcclxufVxyXG4iLCJmdW5jdGlvbiBDaGFubmVsIChjb250ZXh0LCBuYW1lKSB7XHJcbiAgbGV0IGNoYW5uZWwgPSBjb250ZXh0LmNyZWF0ZUdhaW4oKVxyXG4gIFxyXG4gIGxldCBjb25uZWN0UGFubmVyID0gZnVuY3Rpb24gKHNyYywgcGFubmVyLCBjaGFuKSB7XHJcbiAgICBzcmMuY29ubmVjdChwYW5uZXIpXHJcbiAgICBwYW5uZXIuY29ubmVjdChjaGFuKSBcclxuICB9XHJcblxyXG4gIGxldCBiYXNlUGxheSA9IGZ1bmN0aW9uIChvcHRpb25zPXt9KSB7XHJcbiAgICBsZXQgc2hvdWxkTG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiAoYnVmZmVyLCBwYW5uZXIpIHtcclxuICAgICAgbGV0IHNyYyA9IGNoYW5uZWwuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSBcclxuXHJcbiAgICAgIGlmIChwYW5uZXIpIGNvbm5lY3RQYW5uZXIoc3JjLCBwYW5uZXIsIGNoYW5uZWwpXHJcbiAgICAgIGVsc2UgICAgICAgIHNyYy5jb25uZWN0KGNoYW5uZWwpXHJcblxyXG4gICAgICBzcmMubG9vcCAgID0gc2hvdWxkTG9vcFxyXG4gICAgICBzcmMuYnVmZmVyID0gYnVmZmVyXHJcbiAgICAgIHNyYy5zdGFydCgwKVxyXG4gICAgICByZXR1cm4gc3JjXHJcbiAgICB9IFxyXG4gIH1cclxuXHJcbiAgY2hhbm5lbC5jb25uZWN0KGNvbnRleHQuZGVzdGluYXRpb24pXHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInZvbHVtZVwiLCB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbC5nYWluLnZhbHVlIH0sXHJcbiAgICBzZXQodmFsdWUpIHsgY2hhbm5lbC5nYWluLnZhbHVlID0gdmFsdWUgfVxyXG4gIH0pXHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImdhaW5cIiwge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwgfVxyXG4gIH0pXHJcblxyXG4gIHRoaXMubmFtZSA9IG5hbWVcclxuICB0aGlzLmxvb3AgPSBiYXNlUGxheSh7bG9vcDogdHJ1ZX0pXHJcbiAgdGhpcy5wbGF5ID0gYmFzZVBsYXkoKVxyXG59XHJcblxyXG5mdW5jdGlvbiBBdWRpb1N5c3RlbSAoY2hhbm5lbE5hbWVzKSB7XHJcbiAgbGV0IGNvbnRleHQgID0gbmV3IEF1ZGlvQ29udGV4dFxyXG4gIGxldCBjaGFubmVscyA9IHt9XHJcbiAgbGV0IGkgICAgICAgID0gLTFcclxuXHJcbiAgd2hpbGUgKGNoYW5uZWxOYW1lc1srK2ldKSB7XHJcbiAgICBjaGFubmVsc1tjaGFubmVsTmFtZXNbaV1dID0gbmV3IENoYW5uZWwoY29udGV4dCwgY2hhbm5lbE5hbWVzW2ldKVxyXG4gIH1cclxuICB0aGlzLmNvbnRleHQgID0gY29udGV4dCBcclxuICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHNcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb1N5c3RlbVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENhY2hlIChrZXlOYW1lcykge1xyXG4gIGlmICgha2V5TmFtZXMpIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBzb21lIGtleU5hbWVzXCIpXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlOYW1lcy5sZW5ndGg7ICsraSkgdGhpc1trZXlOYW1lc1tpXV0gPSB7fVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gQ2xvY2tcclxuXHJcbmZ1bmN0aW9uIENsb2NrICh0aW1lRm49RGF0ZS5ub3cpIHtcclxuICB0aGlzLm9sZFRpbWUgPSB0aW1lRm4oKVxyXG4gIHRoaXMubmV3VGltZSA9IHRpbWVGbigpXHJcbiAgdGhpcy5kVCA9IDBcclxuICB0aGlzLnRpY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLm9sZFRpbWUgPSB0aGlzLm5ld1RpbWVcclxuICAgIHRoaXMubmV3VGltZSA9IHRpbWVGbigpICBcclxuICAgIHRoaXMuZFQgICAgICA9IHRoaXMubmV3VGltZSAtIHRoaXMub2xkVGltZVxyXG4gIH1cclxufVxyXG4iLCIvL3RoaXMgZG9lcyBsaXRlcmFsbHkgbm90aGluZy4gIGl0J3MgYSBzaGVsbCB0aGF0IGhvbGRzIGNvbXBvbmVudHNcclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbnRpdHkgKCkge31cclxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdHlTdG9yZVxyXG5cclxuZnVuY3Rpb24gRW50aXR5U3RvcmUgKG1heD0xMDAwKSB7XHJcbiAgdGhpcy5lbnRpdGllcyAgPSBbXVxyXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cclxufVxyXG5cclxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgbGV0IGlkID0gdGhpcy5lbnRpdGllcy5sZW5ndGhcclxuXHJcbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbkVudGl0eVN0b3JlLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChjb21wb25lbnROYW1lcykge1xyXG4gIGxldCBpID0gLTFcclxuICBsZXQgZW50aXR5XHJcblxyXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cclxuXHJcbiAgd2hpbGUgKHRoaXMuZW50aXRpZXNbKytpXSkge1xyXG4gICAgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxyXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxyXG4gIH1cclxuICByZXR1cm4gdGhpcy5sYXN0UXVlcnlcclxufVxyXG4iLCJsZXQge3Nwcml0ZVZlcnRleFNoYWRlciwgc3ByaXRlRnJhZ21lbnRTaGFkZXJ9ID0gcmVxdWlyZShcIi4vZ2wtc2hhZGVyc1wiKVxyXG5sZXQge3BvbHlnb25WZXJ0ZXhTaGFkZXIsIHBvbHlnb25GcmFnbWVudFNoYWRlcn0gPSByZXF1aXJlKFwiLi9nbC1zaGFkZXJzXCIpXHJcbmxldCB7c2V0Qm94fSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCB7U2hhZGVyLCBQcm9ncmFtLCBUZXh0dXJlfSA9IHJlcXVpcmUoXCIuL2dsLXR5cGVzXCIpXHJcbmxldCB7dXBkYXRlQnVmZmVyfSA9IHJlcXVpcmUoXCIuL2dsLWJ1ZmZlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHTFJlbmRlcmVyXHJcblxyXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gICAgID0gMlxyXG5jb25zdCBDT0xPUl9DSEFOTkVMX0NPVU5UID0gNFxyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgICAgID0gNlxyXG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcclxuY29uc3QgTUFYX1ZFUlRFWF9DT1VOVCAgICA9IDEwMDAwMDBcclxuXHJcbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG59XHJcblxyXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbn1cclxuXHJcbi8vdGV4dHVyZSBjb29yZHMgYXJlIGluaXRpYWxpemVkIHRvIDAgLT4gMSB0ZXh0dXJlIGNvb3JkIHNwYWNlXHJcbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xyXG4gICAgc2V0Qm94KGFyLCBpLCAxLCAxLCAwLCAwKVxyXG4gIH0gXHJcbiAgcmV0dXJuIGFyXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZGV4QXJyYXkgKHNpemUpIHtcclxuICByZXR1cm4gbmV3IFVpbnQxNkFycmF5KHNpemUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZlcnRleEFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSAqIFBPSU5UX0RJTUVOU0lPTilcclxufVxyXG5cclxuLy80IGZvciByLCBnLCBiLCBhXHJcbmZ1bmN0aW9uIFZlcnRleENvbG9yQXJyYXkgKHNpemUpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShzaXplICogNClcclxufVxyXG5cclxuZnVuY3Rpb24gU3ByaXRlQmF0Y2ggKHNpemUpIHtcclxuICB0aGlzLmNvdW50ICAgICAgPSAwXHJcbiAgdGhpcy5ib3hlcyAgICAgID0gQm94QXJyYXkoc2l6ZSlcclxuICB0aGlzLmNlbnRlcnMgICAgPSBDZW50ZXJBcnJheShzaXplKVxyXG4gIHRoaXMuc2NhbGVzICAgICA9IFNjYWxlQXJyYXkoc2l6ZSlcclxuICB0aGlzLnJvdGF0aW9ucyAgPSBSb3RhdGlvbkFycmF5KHNpemUpXHJcbiAgdGhpcy50ZXhDb29yZHMgID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkoc2l6ZSlcclxufVxyXG5cclxuZnVuY3Rpb24gUG9seWdvbkJhdGNoIChzaXplKSB7XHJcbiAgdGhpcy5pbmRleCAgICAgICAgPSAwXHJcbiAgdGhpcy5pbmRpY2VzICAgICAgPSBJbmRleEFycmF5KHNpemUpXHJcbiAgdGhpcy52ZXJ0aWNlcyAgICAgPSBWZXJ0ZXhBcnJheShzaXplKVxyXG4gIHRoaXMudmVydGV4Q29sb3JzID0gVmVydGV4Q29sb3JBcnJheShzaXplKVxyXG59XHJcblxyXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHdpZHRoLCBoZWlnaHQpIHtcclxuICBsZXQgbWF4U3ByaXRlQ291bnQgPSAxMDBcclxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcclxuICBsZXQgZ2wgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpICAgICAgXHJcbiAgbGV0IHN2cyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCBzcHJpdGVWZXJ0ZXhTaGFkZXIpXHJcbiAgbGV0IHNmcyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIHNwcml0ZUZyYWdtZW50U2hhZGVyKVxyXG4gIGxldCBwdnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgcG9seWdvblZlcnRleFNoYWRlcilcclxuICBsZXQgcGZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgcG9seWdvbkZyYWdtZW50U2hhZGVyKVxyXG4gIGxldCBzcHJpdGVQcm9ncmFtICA9IFByb2dyYW0oZ2wsIHN2cywgc2ZzKVxyXG4gIGxldCBwb2x5Z29uUHJvZ3JhbSA9IFByb2dyYW0oZ2wsIHB2cywgcGZzKVxyXG5cclxuICAvL1Nwcml0ZSBzaGFkZXIgYnVmZmVyc1xyXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IGNlbnRlckJ1ZmZlciAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgc2NhbGVCdWZmZXIgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuXHJcbiAgLy9wb2x5Z29uIHNoYWRlciBidWZmZXJzXHJcbiAgbGV0IHZlcnRleEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgdmVydGV4Q29sb3JCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBpbmRleEJ1ZmZlciAgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcblxyXG4gIC8vR1BVIGJ1ZmZlciBsb2NhdGlvbnNcclxuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNwcml0ZVByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxyXG4gIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJhX3RleENvb3JkXCIpXHJcbiAgLy9sZXQgY2VudGVyTG9jYXRpb24gICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jZW50ZXJcIilcclxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXHJcbiAgLy9sZXQgcm90TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9yb3RhdGlvblwiKVxyXG5cclxuICBsZXQgdmVydGV4TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcImFfdmVydGV4XCIpXHJcbiAgbGV0IHZlcnRleENvbG9yTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJhX3ZlcnRleENvbG9yXCIpXHJcblxyXG4gIC8vVW5pZm9ybSBsb2NhdGlvbnNcclxuICBsZXQgd29ybGRTaXplU3ByaXRlTG9jYXRpb24gID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNwcml0ZVByb2dyYW0sIFwidV93b3JsZFNpemVcIilcclxuICBsZXQgd29ybGRTaXplUG9seWdvbkxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXHJcblxyXG4gIGxldCBpbWFnZVRvVGV4dHVyZU1hcCA9IG5ldyBNYXAoKVxyXG4gIGxldCB0ZXh0dXJlVG9CYXRjaE1hcCA9IG5ldyBNYXAoKVxyXG4gIGxldCBwb2x5Z29uQmF0Y2ggICAgICA9IG5ldyBQb2x5Z29uQmF0Y2goTUFYX1ZFUlRFWF9DT1VOVClcclxuXHJcbiAgZ2wuZW5hYmxlKGdsLkJMRU5EKVxyXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXHJcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXHJcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuXHJcbiAgdGhpcy5kaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcclxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuc2V0KHRleHR1cmUsIG5ldyBTcHJpdGVCYXRjaChtYXhTcHJpdGVDb3VudCkpXHJcbiAgICByZXR1cm4gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHRleHR1cmUpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcclxuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcclxuXHJcbiAgICBpbWFnZVRvVGV4dHVyZU1hcC5zZXQoaW1hZ2UsIHRleHR1cmUpXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSlcclxuICAgIHJldHVybiB0ZXh0dXJlXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XHJcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XHJcbiAgICBsZXQgdGFyZ2V0UmF0aW8gPSB3aWR0aCAvIGhlaWdodFxyXG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cclxuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxyXG4gICAgbGV0IG5ld0hlaWdodCAgID0gdXNlV2lkdGggPyAod2lkdGggLyByYXRpbykgOiBoZWlnaHRcclxuXHJcbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gbmV3SGVpZ2h0IFxyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkU3ByaXRlID0gKGltYWdlLCB3LCBoLCB4LCB5LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KSA9PiB7XHJcbiAgICBsZXQgdHggICAgPSBpbWFnZVRvVGV4dHVyZU1hcC5nZXQoaW1hZ2UpIHx8IHRoaXMuYWRkVGV4dHVyZShpbWFnZSlcclxuICAgIGxldCBiYXRjaCA9IHRleHR1cmVUb0JhdGNoTWFwLmdldCh0eCkgfHwgdGhpcy5hZGRCYXRjaCh0eClcclxuXHJcbiAgICBzZXRCb3goYmF0Y2guYm94ZXMsIGJhdGNoLmNvdW50LCB3LCBoLCB4LCB5KVxyXG4gICAgc2V0Qm94KGJhdGNoLnRleENvb3JkcywgYmF0Y2guY291bnQsIHRleHcsIHRleGgsIHRleHgsIHRleHkpXHJcbiAgICBiYXRjaC5jb3VudCsrXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFBvbHlnb24gPSAodmVydGljZXMsIGluZGljZXMsIHZlcnRleENvbG9ycykgPT4ge1xyXG4gICAgbGV0IHZlcnRleENvdW50ID0gaW5kaWNlcy5sZW5ndGhcclxuXHJcbiAgICBwb2x5Z29uQmF0Y2gudmVydGljZXMuc2V0KHZlcnRpY2VzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kaWNlcy5zZXQoaW5kaWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRleENvbG9ycy5zZXQodmVydGV4Q29sb3JzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kZXggKz0gdmVydGV4Q291bnRcclxuICB9XHJcblxyXG4gIGxldCByZXNldFBvbHlnb25zID0gKGJhdGNoKSA9PiBiYXRjaC5pbmRleCA9IDBcclxuXHJcbiAgbGV0IGRyYXdQb2x5Z29ucyA9IChiYXRjaCkgPT4ge1xyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBcclxuICAgICAgdmVydGV4QnVmZmVyLCBcclxuICAgICAgdmVydGV4TG9jYXRpb24sIFxyXG4gICAgICBQT0lOVF9ESU1FTlNJT04sIFxyXG4gICAgICBiYXRjaC52ZXJ0aWNlcylcclxuICAgIHVwZGF0ZUJ1ZmZlcihcclxuICAgICAgZ2wsIFxyXG4gICAgICB2ZXJ0ZXhDb2xvckJ1ZmZlciwgXHJcbiAgICAgIHZlcnRleENvbG9yTG9jYXRpb24sIFxyXG4gICAgICBDT0xPUl9DSEFOTkVMX0NPVU5ULCBcclxuICAgICAgYmF0Y2gudmVydGV4Q29sb3JzKVxyXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kZXhCdWZmZXIpXHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBiYXRjaC5pbmRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpXHJcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBiYXRjaC5pbmRleCwgZ2wuVU5TSUdORURfU0hPUlQsIDApXHJcbiAgfVxyXG5cclxuICBsZXQgcmVzZXRCYXRjaCA9IChiYXRjaCkgPT4gYmF0Y2guY291bnQgPSAwXHJcblxyXG4gIGxldCBkcmF3QmF0Y2ggPSAoYmF0Y2gsIHRleHR1cmUpID0+IHtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2guYm94ZXMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgY2VudGVyQnVmZmVyLCBjZW50ZXJMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBjZW50ZXJzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgdGV4Q29vcmRCdWZmZXIsIHRleENvb3JkTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2gudGV4Q29vcmRzKVxyXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGJhdGNoLmNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbiAgfVxyXG5cclxuICB0aGlzLmZsdXNoID0gKCkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChyZXNldEJhdGNoKVxyXG4gICAgcmVzZXRQb2x5Z29ucyhwb2x5Z29uQmF0Y2gpXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlbmRlciA9ICgpID0+IHtcclxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXHJcblxyXG4gICAgLy9TcHJpdGVzaGVldCBiYXRjaCByZW5kZXJpbmdcclxuICAgIGdsLnVzZVByb2dyYW0oc3ByaXRlUHJvZ3JhbSlcclxuICAgIC8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXHJcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplU3ByaXRlTG9jYXRpb24sIDE5MjAsIDEwODApXHJcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKGRyYXdCYXRjaClcclxuXHJcbiAgICAvL3BvbGdvbiByZW5kZXJpbmdcclxuICAgIGdsLnVzZVByb2dyYW0ocG9seWdvblByb2dyYW0pXHJcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xyXG4gICAgZ2wudW5pZm9ybTJmKHdvcmxkU2l6ZVBvbHlnb25Mb2NhdGlvbiwgMTkyMCwgMTA4MClcclxuICAgIGRyYXdQb2x5Z29ucyhwb2x5Z29uQmF0Y2gpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcclxubGV0IENsb2NrICAgICAgICA9IHJlcXVpcmUoXCIuL0Nsb2NrXCIpXHJcbmxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcclxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcclxubGV0IEF1ZGlvU3lzdGVtICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXHJcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxyXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXHJcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2FtZVxyXG5cclxuLy86OiBDbG9jayAtPiBDYWNoZSAtPiBMb2FkZXIgLT4gR0xSZW5kZXJlciAtPiBBdWRpb1N5c3RlbSAtPiBFbnRpdHlTdG9yZSAtPiBTY2VuZU1hbmFnZXJcclxuZnVuY3Rpb24gR2FtZSAoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBcclxuICAgICAgICAgICAgICAgZW50aXR5U3RvcmUsIHNjZW5lTWFuYWdlcikge1xyXG4gIGNoZWNrVHlwZShjbG9jaywgQ2xvY2spXHJcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcclxuICBjaGVja1R5cGUoaW5wdXRNYW5hZ2VyLCBJbnB1dE1hbmFnZXIpXHJcbiAgY2hlY2tUeXBlKGxvYWRlciwgTG9hZGVyKVxyXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcclxuICBjaGVja1R5cGUoYXVkaW9TeXN0ZW0sIEF1ZGlvU3lzdGVtKVxyXG4gIGNoZWNrVHlwZShlbnRpdHlTdG9yZSwgRW50aXR5U3RvcmUpXHJcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxyXG5cclxuICB0aGlzLmNsb2NrICAgICAgICA9IGNsb2NrXHJcbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcclxuICB0aGlzLmxvYWRlciAgICAgICA9IGxvYWRlclxyXG4gIHRoaXMuaW5wdXRNYW5hZ2VyID0gaW5wdXRNYW5hZ2VyXHJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxyXG4gIHRoaXMuYXVkaW9TeXN0ZW0gID0gYXVkaW9TeXN0ZW1cclxuICB0aGlzLmVudGl0eVN0b3JlICA9IGVudGl0eVN0b3JlXHJcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcclxuXHJcbiAgLy9JbnRyb2R1Y2UgYmktZGlyZWN0aW9uYWwgcmVmZXJlbmNlIHRvIGdhbWUgb2JqZWN0IG9udG8gZWFjaCBzY2VuZVxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcclxuICAgIHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lc1tpXS5nYW1lID0gdGhpc1xyXG4gIH1cclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxyXG5cclxuICBjb25zb2xlLmxvZyhcImNhbGxpbmcgc2V0dXAgZm9yIFwiICsgc3RhcnRTY2VuZS5uYW1lKVxyXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLy93aGF0IGRvZXMgdGhpcyBldmVuIG1lYW4/XHJcbn1cclxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dE1hbmFnZXJcclxuXHJcbi8vVE9ETzogY291bGQgdGFrZSBtb3VzZU1hbmFnZXIgYW5kIGdhbWVwYWQgbWFuYWdlcj9cclxuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChrZXlib2FyZE1hbmFnZXIpIHtcclxuICBjaGVja1R5cGUoa2V5Ym9hcmRNYW5hZ2VyLCBLZXlib2FyZE1hbmFnZXIpXHJcbiAgdGhpcy5rZXlib2FyZE1hbmFnZXIgPSBrZXlib2FyZE1hbmFnZXIgXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBLZXlib2FyZE1hbmFnZXJcclxuXHJcbmNvbnN0IEtFWV9DT1VOVCA9IDI1NlxyXG5cclxuZnVuY3Rpb24gS2V5Ym9hcmRNYW5hZ2VyIChkb2N1bWVudCkge1xyXG4gIGxldCBpc0Rvd25zICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxyXG4gIGxldCBqdXN0RG93bnMgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxyXG4gIGxldCBqdXN0VXBzICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxyXG4gIGxldCBkb3duRHVyYXRpb25zID0gbmV3IFVpbnQzMkFycmF5KEtFWV9DT1VOVClcclxuICBcclxuICBsZXQgaGFuZGxlS2V5RG93biA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3REb3duc1trZXlDb2RlXSA9ICFpc0Rvd25zW2tleUNvZGVdXHJcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSB0cnVlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlS2V5VXAgPSAoe2tleUNvZGV9KSA9PiB7XHJcbiAgICBqdXN0VXBzW2tleUNvZGVdICAgPSB0cnVlXHJcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSBmYWxzZVxyXG4gIH1cclxuXHJcbiAgbGV0IGhhbmRsZUJsdXIgPSAoKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBpc0Rvd25zW2ldICAgPSAwXHJcbiAgICAgIGp1c3REb3duc1tpXSA9IDBcclxuICAgICAganVzdFVwc1tpXSAgID0gMFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdGhpcy5pc0Rvd25zICAgICAgID0gaXNEb3duc1xyXG4gIHRoaXMuanVzdFVwcyAgICAgICA9IGp1c3RVcHNcclxuICB0aGlzLmp1c3REb3ducyAgICAgPSBqdXN0RG93bnNcclxuICB0aGlzLmRvd25EdXJhdGlvbnMgPSBkb3duRHVyYXRpb25zXHJcblxyXG4gIHRoaXMudGljayA9IChkVCkgPT4ge1xyXG4gICAgbGV0IGkgPSAtMVxyXG5cclxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcclxuICAgICAganVzdERvd25zW2ldID0gZmFsc2UgXHJcbiAgICAgIGp1c3RVcHNbaV0gICA9IGZhbHNlXHJcbiAgICAgIGlmIChpc0Rvd25zW2ldKSBkb3duRHVyYXRpb25zW2ldICs9IGRUXHJcbiAgICAgIGVsc2UgICAgICAgICAgICBkb3duRHVyYXRpb25zW2ldID0gMFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bilcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgaGFuZGxlQmx1cilcclxufVxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicmVuZGVyYWJsZVwiLCBcImFuaW1hdGVkXCJdKVxyXG59XHJcblxyXG5LZXlmcmFtZUFuaW1hdGlvblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXHJcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxyXG4gIGxldCBpICAgPSAtMVxyXG4gIGxldCBlbnRcclxuICBsZXQgdGltZUxlZnRcclxuICBsZXQgY3VycmVudEluZGV4XHJcbiAgbGV0IGN1cnJlbnRBbmltXHJcbiAgbGV0IGN1cnJlbnRGcmFtZVxyXG4gIGxldCBuZXh0RnJhbWVcclxuICBsZXQgb3ZlcnNob290XHJcbiAgbGV0IHNob3VsZEFkdmFuY2VcclxuXHJcbiAgd2hpbGUgKCsraSA8IGxlbikge1xyXG4gICAgZW50ICAgICAgICAgICA9IGVudGl0aWVzW2ldIFxyXG4gICAgY3VycmVudEluZGV4ICA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXhcclxuICAgIGN1cnJlbnRBbmltICAgPSBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvblxyXG4gICAgY3VycmVudEZyYW1lICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXhdXHJcbiAgICBuZXh0RnJhbWUgICAgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleCArIDFdIHx8IGN1cnJlbnRBbmltLmZyYW1lc1swXVxyXG4gICAgdGltZUxlZnQgICAgICA9IGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZVxyXG4gICAgb3ZlcnNob290ICAgICA9IHRpbWVMZWZ0IC0gZFQgICBcclxuICAgIHNob3VsZEFkdmFuY2UgPSBvdmVyc2hvb3QgPD0gMFxyXG4gICAgICBcclxuICAgIGlmIChzaG91bGRBZHZhbmNlKSB7XHJcbiAgICAgIGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXggPSBjdXJyZW50QW5pbS5mcmFtZXMuaW5kZXhPZihuZXh0RnJhbWUpXHJcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSAgICAgPSBuZXh0RnJhbWUuZHVyYXRpb24gKyBvdmVyc2hvb3QgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWUgPSBvdmVyc2hvb3QgXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XHJcbiAgbGV0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dFxyXG5cclxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XHJcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXHJcblxyXG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0IFxyXG5cclxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcclxuICAgICAgeGhyLm9ubG9hZCAgICAgICA9ICgpID0+IGNiKG51bGwsIHhoci5yZXNwb25zZSlcclxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXHJcbiAgICAgIHhoci5zZW5kKG51bGwpXHJcbiAgICB9IFxyXG4gIH1cclxuXHJcbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcclxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcclxuXHJcbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xyXG5cclxuICB0aGlzLmxvYWRUZXh0dXJlID0gKHBhdGgsIGNiKSA9PiB7XHJcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxyXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxyXG4gICAgbGV0IG9uZXJyb3IgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxyXG4gICAgXHJcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcclxuICAgIGkub25lcnJvciA9IG9uZXJyb3JcclxuICAgIGkuc3JjICAgICA9IHBhdGhcclxuICB9XHJcblxyXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XHJcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xyXG4gICAgICBsZXQgZGVjb2RlU3VjY2VzcyA9IChidWZmZXIpID0+IGNiKG51bGwsIGJ1ZmZlcikgICBcclxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxyXG5cclxuICAgICAgYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeSwgZGVjb2RlU3VjY2VzcywgZGVjb2RlRmFpbHVyZSlcclxuICAgIH0pIFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcclxuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXHJcbiAgICBsZXQgdGV4dHVyZUtleXMgID0gT2JqZWN0LmtleXModGV4dHVyZXMgfHwge30pXHJcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycyB8fCB7fSlcclxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXHJcbiAgICBsZXQgdGV4dHVyZUNvdW50ID0gdGV4dHVyZUtleXMubGVuZ3RoXHJcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcclxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IGogICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XHJcbiAgICAgIHNvdW5kczp7fSwgdGV4dHVyZXM6IHt9LCBzaGFkZXJzOiB7fSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2hlY2tEb25lID0gKCkgPT4ge1xyXG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICBzb3VuZENvdW50LS1cclxuICAgICAgb3V0LnNvdW5kc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgdGV4dHVyZUNvdW50LS1cclxuICAgICAgb3V0LnRleHR1cmVzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNoYWRlckNvdW50LS1cclxuICAgICAgb3V0LnNoYWRlcnNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XHJcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cclxuXHJcbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xyXG4gICAgICBsZXQga2V5ID0gdGV4dHVyZUtleXNbal1cclxuXHJcbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyVGV4dHVyZShrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB3aGlsZSAoc2hhZGVyS2V5c1srK2tdKSB7XHJcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXHJcblxyXG4gICAgICB0aGlzLmxvYWRTaGFkZXIoc2hhZGVyc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYWRkbGVNb3ZlclN5c3RlbVxyXG5cclxuZnVuY3Rpb24gUGFkZGxlTW92ZXJTeXN0ZW0gKCkge1xyXG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJwbGF5ZXJDb250cm9sbGVkXCJdKVxyXG59XHJcblxyXG5QYWRkbGVNb3ZlclN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIGxldCB7Y2xvY2ssIGlucHV0TWFuYWdlcn0gPSBzY2VuZS5nYW1lXHJcbiAgbGV0IHtrZXlib2FyZE1hbmFnZXJ9ID0gaW5wdXRNYW5hZ2VyXHJcbiAgbGV0IG1vdmVTcGVlZCA9IDFcclxuICBsZXQgcGFkZGxlICAgID0gZW50aXRpZXNbMF1cclxuXHJcbiAgLy9jYW4gaGFwcGVuIGR1cmluZyBsb2FkaW5nIGZvciBleGFtcGxlXHJcbiAgaWYgKCFwYWRkbGUpIHJldHVyblxyXG5cclxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzddKSBwYWRkbGUucGh5c2ljcy54IC09IGNsb2NrLmRUICogbW92ZVNwZWVkXHJcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxyXG59XHJcbiIsImxldCB7c2V0Qm94fSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyaW5nU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBSZW5kZXJpbmdTeXN0ZW0gKCkge1xyXG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJyZW5kZXJhYmxlXCJdKVxyXG59XHJcblxyXG4vL3gwLCB5MCwgeDEsIHkxLCB4MiwgeTIuLi5cclxuLy9sZXQgdmVydHMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuLy8gIDAsIDgwMCwgXHJcbi8vICAxOTIwLCA4MDAsIFxyXG4vLyAgMCwgMTA4MCxcclxuLy8gIDE5MjAsIDgwMCwgXHJcbi8vICAxOTIwLCAxMDgwLCBcclxuLy8gIDAsIDEwODBcclxuLy9dKVxyXG4vL1xyXG4vLy8vcixnLGIsYS4uLlxyXG4vL2xldCB2ZXJ0Q29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbi8vICAwLCAwLCAwLjUsIC42LCAvL2xpZ2h0XHJcbi8vICAwLCAwLCAwLjUsIC42LCAvL2xpZ2h0XHJcbi8vICAwLCAwLCAxLCAgIDEsXHJcbi8vICAwLCAwLCAxLCAgIDEsXHJcbi8vICAwLCAwLCAwLjUsIC42LCAvL2xpZ2h0XHJcbi8vICAwLCAwLCAxLCAgIDFcclxuLy9dKVxyXG5cclxuZnVuY3Rpb24gUG9seWdvbiAodmVydGljZXMsIGluZGljZXMsIHZlcnRleENvbG9ycykge1xyXG4gIHRoaXMudmVydGljZXMgICAgID0gdmVydGljZXNcclxuICB0aGlzLmluZGljZXMgICAgICA9IGluZGljZXNcclxuICB0aGlzLnZlcnRleENvbG9ycyA9IHZlcnRleENvbG9yc1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXYXRlciAodywgaCwgeCwgeSwgc3ViRGl2LCBjb2xvclRvcCwgY29sb3JCb3R0b20pIHtcclxuICBsZXQgdmVydGljZXMgICAgID0gbmV3IEZsb2F0MzJBcnJheShzdWJEaXYgKiA2ICogMilcclxuICBsZXQgdmVydGV4Q29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShzdWJEaXYgKiA2ICogNClcclxuICBsZXQgdW5pdFdpZHRoICAgID0gdyAvIHN1YkRpdlxyXG4gIGxldCBpID0gLTFcclxuXHJcbiAgd2hpbGUgKCArKyBpIDwgc3ViRGl2ICkge1xyXG4gICAgc2V0Qm94KHZlcnRpY2VzLCBpLCB1bml0V2lkdGgsIGgsIHVuaXRXaWR0aCAqIGkgKyB4LCB5KVxyXG4gICAgdmVydGV4Q29sb3JzLnNldCh2ZXJ0Q29sb3JzLCBpICogdmVydENvbG9ycy5sZW5ndGgpXHJcbiAgfVxyXG4gIHJldHVybiBuZXcgUG9seWdvbih2ZXJ0aWNlcywgdmVydGV4Q29sb3JzKVxyXG59XHJcblxyXG5sZXQgd2F0ZXJWZXJ0cyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gIDAsICAgIDgwMCxcclxuICAxOTIwLCA0MDAsXHJcbiAgMCwgICAgMTA4MCxcclxuICAxOTIwLCAxMDgwIFxyXG5dKVxyXG5sZXQgd2F0ZXJJbmRpY2VzID0gbmV3IFVpbnQzMkFycmF5KFtcclxuICAwLCAxLCAyLFxyXG4gIDIsIDEsIDNcclxuXSlcclxubGV0IHdhdGVyQ29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgMCwgMCwgMC41LCAuNixcclxuICAwLCAwLCAwLjUsIC42LFxyXG4gIDAsIDAsIDEsICAgMSxcclxuICAwLCAwLCAxLCAgIDFcclxuXSlcclxuXHJcbmxldCB3YXRlciA9IG5ldyBQb2x5Z29uKHdhdGVyVmVydHMsIHdhdGVySW5kaWNlcywgd2F0ZXJDb2xvcnMpXHJcblxyXG5SZW5kZXJpbmdTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCBmcmFtZVxyXG5cclxuICByZW5kZXJlci5mbHVzaCgpXHJcblxyXG4gIC8vVE9ETzogRm9yIHRlc3Rpbmcgb2YgcG9seWdvbiByZW5kZXJpbmdcclxuICByZW5kZXJlci5hZGRQb2x5Z29uKHdhdGVyLnZlcnRpY2VzLCB3YXRlci5pbmRpY2VzLCB3YXRlci52ZXJ0ZXhDb2xvcnMpXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIGVudCA9IGVudGl0aWVzW2ldXHJcblxyXG4gICAgaWYgKGVudC5hbmltYXRlZCkge1xyXG4gICAgICBmcmFtZSA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uLmZyYW1lc1tlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbkluZGV4XVxyXG4gICAgICByZW5kZXJlci5hZGRTcHJpdGUoXHJcbiAgICAgICAgZW50LnJlbmRlcmFibGUuaW1hZ2UsIC8vaW1hZ2VcclxuICAgICAgICBlbnQucGh5c2ljcy53aWR0aCxcclxuICAgICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueCxcclxuICAgICAgICBlbnQucGh5c2ljcy55LFxyXG4gICAgICAgIGZyYW1lLmFhYmIudyAvIGVudC5yZW5kZXJhYmxlLmltYWdlLndpZHRoLFxyXG4gICAgICAgIGZyYW1lLmFhYmIuaCAvIGVudC5yZW5kZXJhYmxlLmltYWdlLmhlaWdodCxcclxuICAgICAgICBmcmFtZS5hYWJiLnggLyBlbnQucmVuZGVyYWJsZS5pbWFnZS53aWR0aCxcclxuICAgICAgICBmcmFtZS5hYWJiLnkgLyBlbnQucmVuZGVyYWJsZS5pbWFnZS5oZWlnaHRcclxuICAgICAgKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxyXG4gICAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXHJcbiAgICAgICAgZW50LnBoeXNpY3Mud2lkdGgsXHJcbiAgICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxyXG4gICAgICAgIGVudC5waHlzaWNzLngsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueSxcclxuICAgICAgICAxLCAgLy90ZXh0dXJlIHdpZHRoXHJcbiAgICAgICAgMSwgIC8vdGV4dHVyZSBoZWlnaHRcclxuICAgICAgICAwLCAgLy90ZXh0dXJlIHhcclxuICAgICAgICAwICAgLy90ZXh0dXJlIHlcclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXHJcblxyXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xyXG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXHJcblxyXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcclxuICB0aGlzLnN5c3RlbXMgPSBzeXN0ZW1zXHJcbiAgdGhpcy5nYW1lICAgID0gbnVsbFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBjYihudWxsLCBudWxsKSAgXHJcbn1cclxuXHJcblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZFQpIHtcclxuICBsZXQgc3RvcmUgPSB0aGlzLmdhbWUuZW50aXR5U3RvcmVcclxuICBsZXQgbGVuICAgPSB0aGlzLnN5c3RlbXMubGVuZ3RoXHJcbiAgbGV0IGkgICAgID0gLTFcclxuICBsZXQgc3lzdGVtXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXSBcclxuICAgIHN5c3RlbS5ydW4odGhpcywgc3RvcmUucXVlcnkoc3lzdGVtLmNvbXBvbmVudE5hbWVzKSlcclxuICB9XHJcbn1cclxuIiwibGV0IHtmaW5kV2hlcmV9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lTWFuYWdlclxyXG5cclxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcclxuICBpZiAoc2NlbmVzLmxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgb25lIG9yIG1vcmUgc2NlbmVzXCIpXHJcblxyXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxyXG4gIGxldCBzY2VuZXMgICAgICAgICAgID0gc2NlbmVzXHJcblxyXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcclxuICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXhdXHJcblxyXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xyXG4gICAgbGV0IHNjZW5lID0gZmluZFdoZXJlKFwibmFtZVwiLCBzY2VuZU5hbWUsIHNjZW5lcylcclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxyXG5cclxuICAgIGFjdGl2ZVNjZW5lSW5kZXggPSBzY2VuZXMuaW5kZXhPZihzY2VuZSlcclxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgbGV0IHNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXggKyAxXVxyXG5cclxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxyXG5cclxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbKythY3RpdmVTY2VuZUluZGV4XVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbVxyXG5cclxuZnVuY3Rpb24gU3lzdGVtIChjb21wb25lbnROYW1lcz1bXSkge1xyXG4gIHRoaXMuY29tcG9uZW50TmFtZXMgPSBjb21wb25lbnROYW1lc1xyXG59XHJcblxyXG4vL3NjZW5lLmdhbWUuY2xvY2tcclxuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgLy9kb2VzIHNvbWV0aGluZyB3LyB0aGUgbGlzdCBvZiBlbnRpdGllcyBwYXNzZWQgdG8gaXRcclxufVxyXG4iLCJsZXQge1BhZGRsZSwgQmxvY2ssIEZpZ2h0ZXJ9ID0gcmVxdWlyZShcIi4vYXNzZW1ibGFnZXNcIilcclxubGV0IFBhZGRsZU1vdmVyU3lzdGVtICAgICAgID0gcmVxdWlyZShcIi4vUGFkZGxlTW92ZXJTeXN0ZW1cIilcclxubGV0IFJlbmRlcmluZ1N5c3RlbSAgICAgICAgID0gcmVxdWlyZShcIi4vUmVuZGVyaW5nU3lzdGVtXCIpXHJcbmxldCBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSA9IHJlcXVpcmUoXCIuL0tleWZyYW1lQW5pbWF0aW9uU3lzdGVtXCIpXHJcbmxldCBTY2VuZSAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxyXG5cclxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcclxuICBsZXQgc3lzdGVtcyA9IFtcclxuICAgIG5ldyBQYWRkbGVNb3ZlclN5c3RlbSwgXHJcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXHJcbiAgICBuZXcgUmVuZGVyaW5nU3lzdGVtXHJcbiAgXVxyXG5cclxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxyXG59XHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZSwgYXVkaW9TeXN0ZW19ID0gdGhpcy5nYW1lIFxyXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcclxuICBsZXQgYXNzZXRzID0ge1xyXG4gICAgLy9zb3VuZHM6IHsgYmdNdXNpYzogXCIvcHVibGljL3NvdW5kcy9iZ20xLm1wM1wiIH0sXHJcbiAgICB0ZXh0dXJlczogeyBcclxuICAgICAgcGFkZGxlOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIsXHJcbiAgICAgIGJsb2NrczogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvYmxvY2tzLnBuZ1wiLFxyXG4gICAgICBmaWdodGVyOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3B1bmNoLnBuZ1wiXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xyXG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcclxuXHJcbiAgICBjYWNoZS5zb3VuZHMgICA9IHNvdW5kc1xyXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xyXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBQYWRkbGUodGV4dHVyZXMucGFkZGxlLCAxMTIsIDI1LCA0MDAsIDQwMCkpXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEJsb2NrKHRleHR1cmVzLmJsb2NrcywgNDQsIDIyLCA4MDAsIDgwMCkpXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEZpZ2h0ZXIodGV4dHVyZXMuZmlnaHRlciwgNzYsIDU5LCA1MDAsIDUwMCkpXHJcbiAgICAvL2JnLnZvbHVtZSA9IDBcclxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcclxuICAgIGNiKG51bGwpXHJcbiAgfSlcclxufVxyXG4iLCJsZXQge1JlbmRlcmFibGUsIFBoeXNpY3MsIFBsYXllckNvbnRyb2xsZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxyXG5sZXQge0FuaW1hdGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcclxubGV0IEFuaW1hdGlvbiA9IHJlcXVpcmUoXCIuL0FuaW1hdGlvblwiKVxyXG5sZXQgRW50aXR5ICAgID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgID0gUGFkZGxlXHJcbm1vZHVsZS5leHBvcnRzLkJsb2NrICAgPSBCbG9ja1xyXG5tb2R1bGUuZXhwb3J0cy5GaWdodGVyID0gRmlnaHRlclxyXG5cclxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxyXG59XHJcblxyXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIEFuaW1hdGVkKHRoaXMsIFwiaWRsZVwiLCB7XHJcbiAgICBpZGxlOiBBbmltYXRpb24uY3JlYXRlTGluZWFyKDQ0LCAyMiwgMCwgMCwgMywgdHJ1ZSwgMTAwMClcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBGaWdodGVyIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgQW5pbWF0ZWQodGhpcywgXCJmaXJlYmFsbFwiLCB7XHJcbiAgICBmaXJlYmFsbDogQW5pbWF0aW9uLmNyZWF0ZUxpbmVhcigxNzQsIDEzNCwgMCwgMCwgMjUsIHRydWUpXHJcbiAgfSlcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5SZW5kZXJhYmxlICAgICAgID0gUmVuZGVyYWJsZVxyXG5tb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgICAgICAgID0gUGh5c2ljc1xyXG5tb2R1bGUuZXhwb3J0cy5QbGF5ZXJDb250cm9sbGVkID0gUGxheWVyQ29udHJvbGxlZFxyXG5tb2R1bGUuZXhwb3J0cy5BbmltYXRlZCAgICAgICAgID0gQW5pbWF0ZWRcclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmFibGUgKGUsIGltYWdlLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgZS5yZW5kZXJhYmxlID0ge1xyXG4gICAgaW1hZ2UsXHJcbiAgICB3aWR0aCxcclxuICAgIGhlaWdodCxcclxuICAgIHJvdGF0aW9uOiAwLFxyXG4gICAgY2VudGVyOiB7XHJcbiAgICAgIHg6IHdpZHRoIC8gMixcclxuICAgICAgeTogaGVpZ2h0IC8gMiBcclxuICAgIH0sXHJcbiAgICBzY2FsZToge1xyXG4gICAgICB4OiAxLFxyXG4gICAgICB5OiAxIFxyXG4gICAgfVxyXG4gIH0gXHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGh5c2ljcyAoZSwgd2lkdGgsIGhlaWdodCwgeCwgeSkge1xyXG4gIGUucGh5c2ljcyA9IHtcclxuICAgIHdpZHRoLCBcclxuICAgIGhlaWdodCwgXHJcbiAgICB4LCBcclxuICAgIHksIFxyXG4gICAgZHg6ICAwLCBcclxuICAgIGR5OiAgMCwgXHJcbiAgICBkZHg6IDAsIFxyXG4gICAgZGR5OiAwXHJcbiAgfVxyXG4gIHJldHVybiBlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBsYXllckNvbnRyb2xsZWQgKGUpIHtcclxuICBlLnBsYXllckNvbnRyb2xsZWQgPSB0cnVlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkIChlLCBkZWZhdWx0QW5pbWF0aW9uTmFtZSwgYW5pbUhhc2gpIHtcclxuICBlLmFuaW1hdGVkID0ge1xyXG4gICAgYW5pbWF0aW9uczogICAgICAgICAgICBhbmltSGFzaCxcclxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lOiAgZGVmYXVsdEFuaW1hdGlvbk5hbWUsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uSW5kZXg6IDAsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1IYXNoW2RlZmF1bHRBbmltYXRpb25OYW1lXSxcclxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLmZyYW1lc1swXS5kdXJhdGlvblxyXG4gIH0gXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXHJcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcclxuXHJcbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxyXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XHJcbiAgbGV0IGxlbiAgID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoXHJcbiAgbGV0IGkgICAgID0gLTFcclxuICBsZXQgZm91bmQgPSBudWxsXHJcblxyXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xyXG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XHJcbiAgICAgIGZvdW5kID0gYXJyYXlPZk9iamVjdHNbaV1cclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZvdW5kXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xyXG4gIGxldCBpID0gLTFcclxuICBcclxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXHJcbiAgcmV0dXJuIHRydWVcclxufVxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcclxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xyXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXHJcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcclxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXHJcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcclxuIiwibW9kdWxlLmV4cG9ydHMuc3ByaXRlVmVydGV4U2hhZGVyID0gXCIgXFxcclxuICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7IFxcXHJcbiAgXFxcclxuICBhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOyBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdGV4Q29vcmQ7IFxcXHJcbiAgXFxcclxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXHJcbiAgXFxcclxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxyXG4gICAgcmV0dXJuIHBvc2l0aW9uICogMi4wIC0gMS4wOyBcXFxyXG4gIH0gXFxcclxuICBcXFxyXG4gIHZvaWQgbWFpbigpIHsgXFxcclxuICAgIG1hdDIgY2xpcFNwYWNlICAgICA9IG1hdDIoMS4wLCAwLjAsIDAuMCwgLTEuMCk7IFxcXHJcbiAgICB2ZWMyIGZyb21Xb3JsZFNpemUgPSBhX3Bvc2l0aW9uIC8gdV93b3JsZFNpemU7IFxcXHJcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxyXG4gICAgXFxcclxuICAgIHZfdGV4Q29vcmQgID0gYV90ZXhDb29yZDsgXFxcclxuICAgIGdsX1Bvc2l0aW9uID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5zcHJpdGVGcmFnbWVudFNoYWRlciA9IFwiXFxcclxuICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7IFxcXHJcbiAgXFxcclxuICB1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOyBcXFxyXG4gIFxcXHJcbiAgdmFyeWluZyB2ZWMyIHZfdGV4Q29vcmQ7IFxcXHJcbiAgXFxcclxuICB2b2lkIG1haW4oKSB7IFxcXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodV9pbWFnZSwgdl90ZXhDb29yZCk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5wb2x5Z29uVmVydGV4U2hhZGVyID0gXCJcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdmVydGV4OyBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWM0IGFfdmVydGV4Q29sb3I7IFxcXHJcbiAgdW5pZm9ybSB2ZWMyIHVfd29ybGRTaXplOyBcXFxyXG4gIHZhcnlpbmcgdmVjNCB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxyXG4gICAgcmV0dXJuIHBvc2l0aW9uICogMi4wIC0gMS4wOyBcXFxyXG4gIH0gXFxcclxuICB2b2lkIG1haW4gKCkgeyBcXFxyXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcclxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IGFfdmVydGV4IC8gdV93b3JsZFNpemU7IFxcXHJcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxyXG4gICAgXFxcclxuICAgIHZfdmVydGV4Q29sb3IgPSBhX3ZlcnRleENvbG9yOyBcXFxyXG4gICAgZ2xfUG9zaXRpb24gICA9IHZlYzQocG9zaXRpb24sIDAsIDEpOyBcXFxyXG4gIH1cIlxyXG5cclxubW9kdWxlLmV4cG9ydHMucG9seWdvbkZyYWdtZW50U2hhZGVyID0gXCJcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIHZhcnlpbmcgdmVjNCB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIFxcXHJcbiAgdm9pZCBtYWluKCkgeyBcXFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdl92ZXJ0ZXhDb2xvcjsgXFxcclxuICB9XCJcclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXHJcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xyXG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXHJcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxyXG4gIFxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcclxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcclxuXHJcbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxyXG5cclxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKVxyXG4gIHJldHVybiAgICAgICAgc2hhZGVyXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XHJcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcclxuXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxyXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcclxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxyXG4gIHJldHVybiBwcm9ncmFtXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcclxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcclxuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICByZXR1cm4gdGV4dHVyZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXHJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXHJcbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXHJcbiIsImxldCBMb2FkZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcclxubGV0IEdMUmVuZGVyZXIgICAgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcclxubGV0IEVudGl0eVN0b3JlICAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxyXG5sZXQgQ2xvY2sgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IENhY2hlICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBTY2VuZU1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcclxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxyXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxyXG5sZXQgSW5wdXRNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXHJcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcclxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXHJcbmxldCBjYW52YXMgICAgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXHJcblxyXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxyXG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXHJcblxyXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcclxubGV0IGlucHV0TWFuYWdlciAgICA9IG5ldyBJbnB1dE1hbmFnZXIoa2V5Ym9hcmRNYW5hZ2VyKVxyXG5sZXQgZW50aXR5U3RvcmUgICAgID0gbmV3IEVudGl0eVN0b3JlXHJcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXHJcbmxldCBjYWNoZSAgICAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXHJcbmxldCBsb2FkZXIgICAgICAgICAgPSBuZXcgTG9hZGVyXHJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIDE5MjAsIDEwODApXHJcbmxldCBhdWRpb1N5c3RlbSAgICAgPSBuZXcgQXVkaW9TeXN0ZW0oW1wibWFpblwiLCBcImJnXCJdKVxyXG5sZXQgc2NlbmVNYW5hZ2VyICAgID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXHJcbmxldCBnYW1lICAgICAgICAgICAgPSBuZXcgR2FtZShjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBlbnRpdHlTdG9yZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2VuZU1hbmFnZXIpXHJcblxyXG5mdW5jdGlvbiBtYWtlVXBkYXRlIChnYW1lKSB7XHJcbiAgbGV0IHN0b3JlICAgICAgICAgID0gZ2FtZS5lbnRpdHlTdG9yZVxyXG4gIGxldCBjbG9jayAgICAgICAgICA9IGdhbWUuY2xvY2tcclxuICBsZXQgaW5wdXRNYW5hZ2VyICAgPSBnYW1lLmlucHV0TWFuYWdlclxyXG4gIGxldCBjb21wb25lbnROYW1lcyA9IFtcInJlbmRlcmFibGVcIiwgXCJwaHlzaWNzXCJdXHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xyXG4gICAgY2xvY2sudGljaygpXHJcbiAgICBpbnB1dE1hbmFnZXIua2V5Ym9hcmRNYW5hZ2VyLnRpY2soY2xvY2suZFQpXHJcbiAgICBnYW1lLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZS51cGRhdGUoY2xvY2suZFQpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2FtZSkge1xyXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcclxuICAgIGdhbWUucmVuZGVyZXIucmVuZGVyKClcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSAgXHJcbiAgfVxyXG59XHJcblxyXG53aW5kb3cuZ2FtZSA9IGdhbWVcclxuXHJcbmZ1bmN0aW9uIHNldHVwRG9jdW1lbnQgKGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdykge1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxyXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxyXG4gIH0pXHJcbn1cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcclxuICBzZXR1cERvY3VtZW50KGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdylcclxuICBnYW1lLnN0YXJ0KClcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXHJcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZShnYW1lKSwgVVBEQVRFX0lOVEVSVkFMKVxyXG59KVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxyXG5tb2R1bGUuZXhwb3J0cy5jaGVja1ZhbHVlVHlwZSA9IGNoZWNrVmFsdWVUeXBlXHJcbm1vZHVsZS5leHBvcnRzLnNldEJveCAgICAgICAgID0gc2V0Qm94XHJcblxyXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gICAgID0gMlxyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgICAgID0gNlxyXG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgdywgaCwgeCwgeSkge1xyXG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxyXG4gIGxldCB4MSA9IHhcclxuICBsZXQgeTEgPSB5IFxyXG4gIGxldCB4MiA9IHggKyB3XHJcbiAgbGV0IHkyID0geSArIGhcclxuXHJcbiAgYm94QXJyYXlbaV0gICAgPSB4MVxyXG4gIGJveEFycmF5W2krMV0gID0geTFcclxuICBib3hBcnJheVtpKzJdICA9IHgyXHJcbiAgYm94QXJyYXlbaSszXSAgPSB5MVxyXG4gIGJveEFycmF5W2krNF0gID0geDFcclxuICBib3hBcnJheVtpKzVdICA9IHkyXHJcblxyXG4gIGJveEFycmF5W2krNl0gID0geDFcclxuICBib3hBcnJheVtpKzddICA9IHkyXHJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxyXG4gIGJveEFycmF5W2krOV0gID0geTFcclxuICBib3hBcnJheVtpKzEwXSA9IHgyXHJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MlxyXG59XHJcbiJdfQ==
