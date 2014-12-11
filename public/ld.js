(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = function Cache(keyNames) {
  if (!keyNames) throw new Error("Must provide some keyNames");
  for (var i = 0; i < keyNames.length; ++i) this[keyNames[i]] = {};
};

},{}],2:[function(require,module,exports){
"use strict";

//this does literally nothing.  it's a shell that holds components
module.exports = function Entity() {};

},{}],3:[function(require,module,exports){
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

},{"./functions":15}],4:[function(require,module,exports){
"use strict";

var _ref = require("./gl-types");

var Shader = _ref.Shader;
var Program = _ref.Program;
var Texture = _ref.Texture;
var _ref2 = require("./gl-buffer");

var updateBuffer = _ref2.updateBuffer;


module.exports = GLRenderer;

var POINT_DIMENSION = 2;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;

function setBox(boxArray, index, x, y, w, h) {
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

function TextureCoordinatesArray(count) {
  var ar = new Float32Array(count * BOX_LENGTH);

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    ar[i] = 0;
    ar[i + 1] = 0;
    ar[i + 2] = 1;
    ar[i + 3] = 0;
    ar[i + 4] = 0;
    ar[i + 5] = 1;

    ar[i + 6] = 0;
    ar[i + 7] = 1;
    ar[i + 8] = 1;
    ar[i + 9] = 0;
    ar[i + 10] = 1;
    ar[i + 11] = 1;
  }
  return ar;
}

function GLRenderer(canvas, vSrc, fSrc, options) {
  var _this = this;
  if (options === undefined) options = {};
  var maxSpriteCount = options.maxSpriteCount;
  var width = options.width;
  var height = options.height;
  var maxSpriteCount = maxSpriteCount || 100;
  var view = canvas;
  var gl = canvas.getContext("webgl");
  var vs = Shader(gl, gl.VERTEX_SHADER, vSrc);
  var fs = Shader(gl, gl.FRAGMENT_SHADER, fSrc);
  var program = Program(gl, vs, fs);

  //index for tracking the current available position to instantiate from
  var freeIndex = 0;
  var activeSprites = 0;

  //views over cpu buffers for data
  var boxes = BoxArray(maxSpriteCount);
  var centers = CenterArray(maxSpriteCount);
  var scales = ScaleArray(maxSpriteCount);
  var rotations = RotationArray(maxSpriteCount);
  var texCoords = TextureCoordinatesArray(maxSpriteCount);

  //handles to GPU buffers
  var boxBuffer = gl.createBuffer();
  var centerBuffer = gl.createBuffer();
  var scaleBuffer = gl.createBuffer();
  var rotationBuffer = gl.createBuffer();
  var texCoordBuffer = gl.createBuffer();

  //GPU buffer locations
  var boxLocation = gl.getAttribLocation(program, "a_position");
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  //Uniform locations
  var worldSizeLocation = gl.getUniformLocation(program, "u_worldSize");

  //TODO: This is temporary for testing the single texture case
  var onlyTexture = Texture(gl);
  var loaded = false;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(1, 1, 1, 0);
  gl.colorMask(true, true, true, true);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);

  this.dimensions = {
    width: width || 1920,
    height: height || 1080
  };

  //TODO: This should not be public api.  entities contain references
  //to their image which should be Weakmap stored with a texture and used
  this.addTexture = function (image) {
    //TODO: Temporary yucky thing
    loaded = true;
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
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

  this.addSprite = function () {};

  //THINK OF NAME?
  //this.reset =
  //this.flush

  this.render = function (entities) {
    //reset these values on every call?
    freeIndex = 0;
    activeSprites = 0;
    window.boxes = boxes;

    if (!loaded && entities[0]) _this.addTexture(entities[0].renderable.image);

    //TODO: initial version of this loop uses commonly shared paddle texture
    for (var i = 0; i < entities.length; ++i) {
      setBox(boxes, freeIndex++, entities[i].physics.x, entities[i].physics.y, entities[i].renderable.width, entities[i].renderable.height);
      activeSprites++;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture);
    updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes);
    //updateBuffer(gl, centerBuffer, centerLocation, POINT_DIMENSION, centers)
    //updateBuffer(gl, scaleBuffer, scaleLocation, POINT_DIMENSION, scales)
    //updateBuffer(gl, rotationBuffer, rotLocation, 1, rotations)
    updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, texCoords);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080);
    gl.drawArrays(gl.TRIANGLES, 0, activeSprites * POINTS_PER_BOX);
  };
}

},{"./gl-buffer":16,"./gl-types":17}],5:[function(require,module,exports){
"use strict";

var _ref = require("./utils");

var checkType = _ref.checkType;
var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var Cache = require("./Cache");
var EntityStore = require("./EntityStore-Simple");
var SceneManager = require("./SceneManager");

module.exports = Game;

//:: Cache -> Loader -> GLRenderer -> EntityStore -> SceneManager
function Game(cache, loader, renderer, entityStore, sceneManager) {
  checkType(cache, Cache);
  checkType(loader, Loader);
  checkType(renderer, GLRenderer);
  checkType(entityStore, EntityStore);
  checkType(sceneManager, SceneManager);

  this.cache = cache;
  this.loader = loader;
  this.renderer = renderer;
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

},{"./Cache":1,"./EntityStore-Simple":3,"./GLRenderer":4,"./Loader":7,"./SceneManager":10,"./utils":19}],6:[function(require,module,exports){
"use strict";

module.exports = InputManager;

var EVENT_SIZE = 2;
var KEY_COUNT = 256;
var QUEUE_LENGTH = 10;
var KEYDOWN = 0;
var JUSTDOWN = 1;
var JUSTUP = 2;

//[up/down, justDown, justUp]
var isDown = function (states, keyCode) {
  return states[keyCode];
};
var setDown = function (states, keyCode, val) {
  return states[keyCode] = val;
};

function EventQueue() {
  var queue = new Int8Array(QUEUE_LENGTH * EVENT_SIZE);

  queue.index = QUEUE_LENGTH - 1;
  return queue;
}

//type is ENUM see above for defs
function queueEvent(queue, keyCode, type) {
  queue[queue.index * 2] = keyCode;
  queue[queue.index * 2 + 1] = type;
  queue.index--;
}

function InputManager(document) {
  var eventQueue = new EventQueue();
  var states = new Int8Array(KEY_COUNT);

  var handleKeyDown = function (_ref) {
    var keyCode = _ref.keyCode;
    if (!isDown(states, keyCode)) queueEvent(eventQueue, keyCode, JUSTDOWN);
    setDown(states, keyCode, 1);
  };

  var handleKeyUp = function (_ref2) {
    var keyCode = _ref2.keyCode;
    setDown(states, keyCode, 0);
    queueEvent(eventQueue, keyCode, JUSTUP);
  };

  Object.defineProperty(this, "eventQueue", {
    get: function () {
      return eventQueue;
    }
  });

  this.tick = function (dT) {
    for (var i = 0, len = states.length; i < len; ++i) {
      if (isDown(states, i)) queueEvent(eventQueue, i, KEYDOWN);
    }
  };

  this.flush = function () {
    var i = -1;
    var len = eventQueue.length;

    while (++i < len) eventQueue[i] = 0;
    eventQueue.index = QUEUE_LENGTH - 1;
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
"use strict";

var System = require("./System");

module.exports = RenderingSystem;

function RenderingSystem() {
  System.call(this, ["physics", "renderable"]);
}

//TODO: We need a reference to the scene that owns us!
//and by extension, if needed, we will have a reference
//to the game itself
RenderingSystem.prototype.run = function (entities) {};

},{"./System":11}],9:[function(require,module,exports){
"use strict";

module.exports = Scene;

/* GAME
 *    RENDERER
 *    AUDIO THING
 *    INPUT THING
 *    ASSET LOADER
 *    ASSET CACHE
 *    ENTITY STORE -- at simplest, this is an array of entities
 *    SCENEMANAGER
 *      [SCENES]  -- analogs to programs.  One program executes at a time
 *        SYSTEMS
 */

function Scene(name, systems) {
  if (!name) throw new Error("Scene constructor requires a name");

  this.name = name;
  this.systems = systems;
  this.game = null;
}

Scene.prototype.setup = function (cb) {
  cb(null, null);
};

Scene.prototype.update = function () {
  var store = this.game.entityStore;
  var len = this.systems.length;
  var i = -1;
  var system;

  while (++i < len) {
    system = this.systems[i];
    system.run(store.query(system.componentNames));
  }
};

},{}],10:[function(require,module,exports){
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

},{"./functions":15}],11:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

System.prototype.run = function (entities) {};

},{}],12:[function(require,module,exports){
"use strict";

var _ref = require("./assemblages");

var Paddle = _ref.Paddle;
var RenderingSystem = require("./RenderingSystem");
var Scene = require("./Scene");

module.exports = TestScene;

function TestScene() {
  var systems = [new RenderingSystem()];

  Scene.call(this, "test", systems);
}

TestScene.prototype = Object.create(Scene.prototype);

TestScene.prototype.setup = function (cb) {
  var cache = this.game.cache;
  var loader = this.game.loader;
  var entityStore = this.game.entityStore;
  var assets = {
    textures: { paddle: "/public/spritesheets/paddle.png" } };

  loader.loadAssets(assets, function (err, loadedAssets) {
    var textures = loadedAssets.textures;
    var sounds = loadedAssets.sounds;


    cache.sounds = sounds;
    cache.textures = textures;
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400));
    cb(null);
  });
};

},{"./RenderingSystem":8,"./Scene":9,"./assemblages":13}],13:[function(require,module,exports){
"use strict";

var _ref = require("./components");

var Renderable = _ref.Renderable;
var Physics = _ref.Physics;
var Entity = require("./Entity");

module.exports.Paddle = Paddle;

function Paddle(image, w, h, x, y) {
  Entity.call(this);
  Renderable(this, image, w, h);
  Physics(this, w, h, x, y);
}

},{"./Entity":2,"./components":14}],14:[function(require,module,exports){
"use strict";

module.exports.Renderable = Renderable;
module.exports.Physics = Physics;

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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],17:[function(require,module,exports){
"use strict";

//:: => GLContext -> ENUM (VERTEX || FRAGMENT) -> String (Code)
function Shader(gl, type, src) {
  var shader = gl.createShader(type);
  var isValid = false;

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!isValid) throw new Error("Not valid shader: \n" + src);
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

},{}],18:[function(require,module,exports){
"use strict";

var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var EntityStore = require("./EntityStore-Simple");
var Cache = require("./Cache");
var SceneManager = require("./SceneManager");
var Scene = require("./Scene");
var TestScene = require("./TestScene");
var Game = require("./Game");
var InputManager = require("./InputManager");
var canvas = document.createElement("canvas");
var vertexSrc = document.getElementById("vertex").text;
var fragSrc = document.getElementById("fragment").text;

//TESTING FOR INPUT MANAGER
var im = new InputManager(document);

window.im = im;

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var rendererOpts = { maxSpriteCount: MAX_COUNT };
var entityStore = new EntityStore();
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts);
var sceneManager = new SceneManager([new TestScene()]);
var game = new Game(cache, loader, renderer, entityStore, sceneManager);

function makeUpdate(game) {
  return function update() {
    im.tick();
    //console.log(im.eventQueue)
    im.flush();
    game.sceneManager.activeScene.update();
  };
}

console.log(im);

function makeAnimate(game) {
  var store = game.entityStore;
  var r = game.renderer;
  var componentNames = ["renderable", "physics"];

  return function animate() {
    var renderables = store.query(componentNames);

    r.render(renderables);
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

},{"./Cache":1,"./EntityStore-Simple":3,"./GLRenderer":4,"./Game":5,"./InputManager":6,"./Loader":7,"./Scene":9,"./SceneManager":10,"./TestScene":12}],19:[function(require,module,exports){
"use strict";

module.exports.checkType = checkType;
module.exports.checkValueType = checkValueType;

function checkType(instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name);
}

function checkValueType(instance, ctor) {
  var keys = Object.keys(instance);

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor);
}

},{}]},{},[18])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvSW5wdXRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvTG9hZGVyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLLENBQUUsUUFBUSxFQUFFO0FBQ3pDLE1BQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO0FBQzVELE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDakUsQ0FBQTs7Ozs7O0FDRkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLE1BQU0sR0FBSSxFQUFFLENBQUE7Ozs7O1dDRHRCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQWpDLE9BQU8sUUFBUCxPQUFPOzs7QUFFWixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQTs7QUFFNUIsU0FBUyxXQUFXLENBQUUsR0FBRyxFQUFPO01BQVYsR0FBRyxnQkFBSCxHQUFHLEdBQUMsSUFBSTtBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFJLEVBQUUsQ0FBQTtBQUNuQixNQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM3QyxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDckIsU0FBTyxFQUFFLENBQUE7Q0FDVixDQUFBOztBQUVELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsY0FBYyxFQUFFO0FBQ3RELE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxNQUFNLENBQUE7O0FBRVYsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFVBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFFBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUNqRTtBQUNELFNBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtDQUN0QixDQUFBOzs7OztXQzNCZ0MsT0FBTyxDQUFDLFlBQVksQ0FBQzs7SUFBakQsTUFBTSxRQUFOLE1BQU07SUFBRSxPQUFPLFFBQVAsT0FBTztJQUFFLE9BQU8sUUFBUCxPQUFPO1lBQ1IsT0FBTyxDQUFDLGFBQWEsQ0FBQzs7SUFBdEMsWUFBWSxTQUFaLFlBQVk7OztBQUVqQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQTs7QUFFM0IsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFBO0FBQ3pCLElBQU0sY0FBYyxHQUFJLENBQUMsQ0FBQTtBQUN6QixJQUFNLFVBQVUsR0FBUSxlQUFlLEdBQUcsY0FBYyxDQUFBOztBQUV4RCxTQUFTLE1BQU0sQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QyxNQUFJLENBQUMsR0FBSSxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQzNCLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDZCxNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVkLFVBQVEsQ0FBQyxDQUFDLENBQUMsR0FBTSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7O0FBRW5CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ3BCOztBQUVELFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUN4QixTQUFPLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTtDQUM1Qzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUU7QUFDM0IsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFO0FBQzFCLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTs7QUFFN0MsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFH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QUVELFNBQVMsY0FBYyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6RSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENhY2hlIChrZXlOYW1lcykge1xuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XG59XG4iLCIvL3RoaXMgZG9lcyBsaXRlcmFsbHkgbm90aGluZy4gIGl0J3MgYSBzaGVsbCB0aGF0IGhvbGRzIGNvbXBvbmVudHNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcblxuZnVuY3Rpb24gRW50aXR5U3RvcmUgKG1heD0xMDAwKSB7XG4gIHRoaXMuZW50aXRpZXMgID0gW11cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcbiAgbGV0IGlkID0gdGhpcy5lbnRpdGllcy5sZW5ndGhcblxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcbiAgcmV0dXJuIGlkXG59XG5cbkVudGl0eVN0b3JlLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChjb21wb25lbnROYW1lcykge1xuICBsZXQgaSA9IC0xXG4gIGxldCBlbnRpdHlcblxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXG5cbiAgd2hpbGUgKHRoaXMuZW50aXRpZXNbKytpXSkge1xuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXG4gIH1cbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XG59XG4iLCJsZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxuXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgeCwgeSwgdywgaCkge1xuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcbiAgbGV0IHgxID0geFxuICBsZXQgeTEgPSB5IFxuICBsZXQgeDIgPSB4ICsgd1xuICBsZXQgeTIgPSB5ICsgaFxuXG4gIGJveEFycmF5W2ldICAgID0geDFcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxuICBib3hBcnJheVtpKzJdICA9IHgyXG4gIGJveEFycmF5W2krM10gID0geTFcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxuICBib3hBcnJheVtpKzVdICA9IHkyXG5cbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxuICBib3hBcnJheVtpKzddICA9IHkyXG4gIGJveEFycmF5W2krOF0gID0geDJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxuICBib3hBcnJheVtpKzEwXSA9IHgyXG4gIGJveEFycmF5W2krMTFdID0geTJcbn1cblxuZnVuY3Rpb24gQm94QXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIFJvdGF0aW9uQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG59XG5cbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xuICAgIGFyW2ldICAgID0gMFxuICAgIGFyW2krMV0gID0gMFxuICAgIGFyW2krMl0gID0gMVxuICAgIGFyW2krM10gID0gMFxuICAgIGFyW2krNF0gID0gMFxuICAgIGFyW2krNV0gID0gMVxuXG4gICAgYXJbaSs2XSAgPSAwXG4gICAgYXJbaSs3XSAgPSAxXG4gICAgYXJbaSs4XSAgPSAxXG4gICAgYXJbaSs5XSAgPSAwXG4gICAgYXJbaSsxMF0gPSAxXG4gICAgYXJbaSsxMV0gPSAxXG4gIH0gXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcbiAgbGV0IHttYXhTcHJpdGVDb3VudCwgd2lkdGgsIGhlaWdodH0gPSBvcHRpb25zXG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IG1heFNwcml0ZUNvdW50IHx8IDEwMFxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxuICBsZXQgdnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICBsZXQgcHJvZ3JhbSAgICAgICAgPSBQcm9ncmFtKGdsLCB2cywgZnMpXG5cbiAgLy9pbmRleCBmb3IgdHJhY2tpbmcgdGhlIGN1cnJlbnQgYXZhaWxhYmxlIHBvc2l0aW9uIHRvIGluc3RhbnRpYXRlIGZyb21cbiAgbGV0IGZyZWVJbmRleCAgICAgPSAwXG4gIGxldCBhY3RpdmVTcHJpdGVzID0gMFxuXG4gIC8vdmlld3Mgb3ZlciBjcHUgYnVmZmVycyBmb3IgZGF0YVxuICBsZXQgYm94ZXMgICAgID0gQm94QXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCBjZW50ZXJzICAgPSBDZW50ZXJBcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHNjYWxlcyAgICA9IFNjYWxlQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCByb3RhdGlvbnMgPSBSb3RhdGlvbkFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgdGV4Q29vcmRzID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkobWF4U3ByaXRlQ291bnQpXG5cbiAgLy9oYW5kbGVzIHRvIEdQVSBidWZmZXJzXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcblxuICAvL1VuaWZvcm0gbG9jYXRpb25zXG4gIGxldCB3b3JsZFNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG5cbiAgLy9UT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBmb3IgdGVzdGluZyB0aGUgc2luZ2xlIHRleHR1cmUgY2FzZVxuICBsZXQgb25seVRleHR1cmUgPSBUZXh0dXJlKGdsKVxuICBsZXQgbG9hZGVkICAgICAgPSBmYWxzZVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG5cbiAgdGhpcy5kaW1lbnNpb25zID0ge1xuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXG4gICAgaGVpZ2h0OiBoZWlnaHQgfHwgMTA4MFxuICB9XG5cbiAgLy9UT0RPOiBUaGlzIHNob3VsZCBub3QgYmUgcHVibGljIGFwaS4gIGVudGl0aWVzIGNvbnRhaW4gcmVmZXJlbmNlc1xuICAvL3RvIHRoZWlyIGltYWdlIHdoaWNoIHNob3VsZCBiZSBXZWFrbWFwIHN0b3JlZCB3aXRoIGEgdGV4dHVyZSBhbmQgdXNlZFxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcbiAgICAvL1RPRE86IFRlbXBvcmFyeSB5dWNreSB0aGluZ1xuICAgIGxvYWRlZCA9IHRydWVcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKTsgXG4gIH1cblxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxuXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcbiAgfVxuXG4gIHRoaXMuYWRkU3ByaXRlID0gKCkgPT4ge31cblxuICAvL1RISU5LIE9GIE5BTUU/XG4gIC8vdGhpcy5yZXNldCA9IFxuICAvL3RoaXMuZmx1c2hcblxuICB0aGlzLnJlbmRlciA9IChlbnRpdGllcykgPT4ge1xuICAgIC8vcmVzZXQgdGhlc2UgdmFsdWVzIG9uIGV2ZXJ5IGNhbGw/XG4gICAgZnJlZUluZGV4ICAgICA9IDBcbiAgICBhY3RpdmVTcHJpdGVzID0gMFxuICAgIHdpbmRvdy5ib3hlcyA9IGJveGVzXG5cbiAgICBpZiAoIWxvYWRlZCAmJiBlbnRpdGllc1swXSkgdGhpcy5hZGRUZXh0dXJlKGVudGl0aWVzWzBdLnJlbmRlcmFibGUuaW1hZ2UpXG5cbiAgICAvL1RPRE86IGluaXRpYWwgdmVyc2lvbiBvZiB0aGlzIGxvb3AgdXNlcyBjb21tb25seSBzaGFyZWQgcGFkZGxlIHRleHR1cmVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBzZXRCb3goXG4gICAgICAgIGJveGVzLCBcbiAgICAgICAgZnJlZUluZGV4KyssIFxuICAgICAgICBlbnRpdGllc1tpXS5waHlzaWNzLngsIFxuICAgICAgICBlbnRpdGllc1tpXS5waHlzaWNzLnksIFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLndpZHRoLFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLmhlaWdodFxuICAgICAgKVxuICAgICAgYWN0aXZlU3ByaXRlcysrXG4gICAgfVxuXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGNlbnRlckJ1ZmZlciwgY2VudGVyTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgY2VudGVycylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIHRleENvb3JkQnVmZmVyLCB0ZXhDb29yZExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHRleENvb3JkcylcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYWN0aXZlU3ByaXRlcyAqIFBPSU5UU19QRVJfQk9YKVxuICB9XG59XG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVcblxuLy86OiBDYWNoZSAtPiBMb2FkZXIgLT4gR0xSZW5kZXJlciAtPiBFbnRpdHlTdG9yZSAtPiBTY2VuZU1hbmFnZXJcbmZ1bmN0aW9uIEdhbWUgKGNhY2hlLCBsb2FkZXIsIHJlbmRlcmVyLCBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XG4gIGNoZWNrVHlwZShjYWNoZSwgQ2FjaGUpXG4gIGNoZWNrVHlwZShsb2FkZXIsIExvYWRlcilcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxuICBjaGVja1R5cGUoZW50aXR5U3RvcmUsIEVudGl0eVN0b3JlKVxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXG5cbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmVudGl0eVN0b3JlICA9IGVudGl0eVN0b3JlXG4gIHRoaXMuc2NlbmVNYW5hZ2VyID0gc2NlbmVNYW5hZ2VyXG5cbiAgLy9JbnRyb2R1Y2UgYmktZGlyZWN0aW9uYWwgcmVmZXJlbmNlIHRvIGdhbWUgb2JqZWN0IG9udG8gZWFjaCBzY2VuZVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXG4gIH1cbn1cblxuR2FtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGFydFNjZW5lID0gdGhpcy5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmVcblxuICBjb25zb2xlLmxvZyhcImNhbGxpbmcgc2V0dXAgZm9yIFwiICsgc3RhcnRTY2VuZS5uYW1lKVxuICBzdGFydFNjZW5lLnNldHVwKChlcnIpID0+IGNvbnNvbGUubG9nKFwic2V0dXAgY29tcGxldGVkXCIpKVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5wdXRNYW5hZ2VyXG5cbmNvbnN0IEVWRU5UX1NJWkUgICA9IDJcbmNvbnN0IEtFWV9DT1VOVCAgICA9IDI1NlxuY29uc3QgUVVFVUVfTEVOR1RIID0gMTBcbmNvbnN0IEtFWURPV04gICAgICA9IDBcbmNvbnN0IEpVU1RET1dOICAgICA9IDFcbmNvbnN0IEpVU1RVUCAgICAgICA9IDJcblxuLy9bdXAvZG93biwganVzdERvd24sIGp1c3RVcF1cbmxldCBpc0Rvd24gID0gKHN0YXRlcywga2V5Q29kZSkgPT4gc3RhdGVzW2tleUNvZGVdXG5sZXQgc2V0RG93biA9IChzdGF0ZXMsIGtleUNvZGUsIHZhbCkgPT4gc3RhdGVzW2tleUNvZGVdID0gdmFsXG5cbmZ1bmN0aW9uIEV2ZW50UXVldWUgKCkge1xuICBsZXQgcXVldWUgPSBuZXcgSW50OEFycmF5KFFVRVVFX0xFTkdUSCAqIEVWRU5UX1NJWkUpXG5cbiAgcXVldWUuaW5kZXggPSBRVUVVRV9MRU5HVEggLSAxXG4gIHJldHVybiBxdWV1ZVxufVxuXG4vL3R5cGUgaXMgRU5VTSBzZWUgYWJvdmUgZm9yIGRlZnNcbmZ1bmN0aW9uIHF1ZXVlRXZlbnQgKHF1ZXVlLCBrZXlDb2RlLCB0eXBlKSB7XG4gIHF1ZXVlW3F1ZXVlLmluZGV4KjJdICAgPSBrZXlDb2RlXG4gIHF1ZXVlW3F1ZXVlLmluZGV4KjIrMV0gPSB0eXBlXG4gIHF1ZXVlLmluZGV4LS1cbn1cblxuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChkb2N1bWVudCkge1xuICBsZXQgZXZlbnRRdWV1ZSA9IG5ldyBFdmVudFF1ZXVlXG4gIGxldCBzdGF0ZXMgICAgID0gbmV3IEludDhBcnJheShLRVlfQ09VTlQpXG4gIFxuICBsZXQgaGFuZGxlS2V5RG93biA9ICh7a2V5Q29kZX0pID0+IHtcbiAgICBpZiAoIWlzRG93bihzdGF0ZXMsIGtleUNvZGUpKSBxdWV1ZUV2ZW50KGV2ZW50UXVldWUsIGtleUNvZGUsIEpVU1RET1dOKVxuICAgIHNldERvd24oc3RhdGVzLCBrZXlDb2RlLCAxKVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIHNldERvd24oc3RhdGVzLCBrZXlDb2RlLCAwKVxuICAgIHF1ZXVlRXZlbnQoZXZlbnRRdWV1ZSwga2V5Q29kZSwgSlVTVFVQKVxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZXZlbnRRdWV1ZVwiLCB7XG4gICAgZ2V0ICgpIHsgcmV0dXJuIGV2ZW50UXVldWUgfSBcbiAgfSlcblxuICB0aGlzLnRpY2sgPSAoZFQpID0+IHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gc3RhdGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBpZiAoaXNEb3duKHN0YXRlcywgaSkpIHF1ZXVlRXZlbnQoZXZlbnRRdWV1ZSwgaSwgS0VZRE9XTilcbiAgICB9ICAgIFxuICB9XG5cbiAgdGhpcy5mbHVzaCA9ICgpID0+IHtcbiAgICBsZXQgaSAgID0gLTFcbiAgICBsZXQgbGVuID0gZXZlbnRRdWV1ZS5sZW5ndGhcblxuICAgIHdoaWxlICgrK2kgPCBsZW4pIGV2ZW50UXVldWVbaV0gPSAwXG4gICAgZXZlbnRRdWV1ZS5pbmRleCA9IFFVRVVFX0xFTkdUSCAtIDFcbiAgfVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGhhbmRsZUtleURvd24pXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcbn1cbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcblxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcblxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcblxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gICAgICB4aHIuc2VuZChudWxsKVxuICAgIH0gXG4gIH1cblxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcblxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXG5cbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICBcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXG4gICAgaS5zcmMgICAgID0gcGF0aFxuICB9XG5cbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXG5cbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXG4gICAgfSkgXG4gIH1cblxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXG4gICAgfVxuXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzb3VuZENvdW50LS1cbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgdGV4dHVyZUNvdW50LS1cbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNoYWRlckNvdW50LS1cbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cblxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXG5cbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cblxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmluZ1N5c3RlbVxuXG5mdW5jdGlvbiBSZW5kZXJpbmdTeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicmVuZGVyYWJsZVwiXSlcbn1cblxuLy9UT0RPOiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZSBzY2VuZSB0aGF0IG93bnMgdXMhXG4vL2FuZCBieSBleHRlbnNpb24sIGlmIG5lZWRlZCwgd2Ugd2lsbCBoYXZlIGEgcmVmZXJlbmNlXG4vL3RvIHRoZSBnYW1lIGl0c2VsZlxuUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoZW50aXRpZXMpIHtcbiAgLy9sZXQge3JlbmRlcmVyfSA9IHRoaXMuc2NlbmUuZ2FtZVxuXG4gIC8vcmVuZGVyZXIucmVzZXQoKVxuICAvL2VudGl0aWVzLmZvckVhY2goZnVuY3Rpb24gKGVudGl0eSkge1xuICAvLyAgcmVuZGVyZXIuYWRkU3ByaXRlKC8vcHJvcGVydGllcyB0aGF0IGl0IGNhcmVzIGFib3V0KSBcbiAgLy99KSAgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxuXG4vKiBHQU1FXG4gKiAgICBSRU5ERVJFUlxuICogICAgQVVESU8gVEhJTkdcbiAqICAgIElOUFVUIFRISU5HXG4gKiAgICBBU1NFVCBMT0FERVJcbiAqICAgIEFTU0VUIENBQ0hFXG4gKiAgICBFTlRJVFkgU1RPUkUgLS0gYXQgc2ltcGxlc3QsIHRoaXMgaXMgYW4gYXJyYXkgb2YgZW50aXRpZXNcbiAqICAgIFNDRU5FTUFOQUdFUlxuICogICAgICBbU0NFTkVTXSAgLS0gYW5hbG9ncyB0byBwcm9ncmFtcy4gIE9uZSBwcm9ncmFtIGV4ZWN1dGVzIGF0IGEgdGltZVxuICogICAgICAgIFNZU1RFTVNcbiAqL1xuXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxuXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xuICB0aGlzLmdhbWUgICAgPSBudWxsXG59XG5cblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBjYihudWxsLCBudWxsKSAgXG59XG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdG9yZSA9IHRoaXMuZ2FtZS5lbnRpdHlTdG9yZVxuICBsZXQgbGVuICAgPSB0aGlzLnN5c3RlbXMubGVuZ3RoXG4gIGxldCBpICAgICA9IC0xXG4gIGxldCBzeXN0ZW1cblxuICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldIFxuICAgIHN5c3RlbS5ydW4oc3RvcmUucXVlcnkoc3lzdGVtLmNvbXBvbmVudE5hbWVzKSlcbiAgfVxufVxuIiwibGV0IHtmaW5kV2hlcmV9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmVNYW5hZ2VyXG5cbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XG4gIGlmIChzY2VuZXMubGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBvbmUgb3IgbW9yZSBzY2VuZXNcIilcblxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcbiAgbGV0IHNjZW5lcyAgICAgICAgICAgPSBzY2VuZXNcblxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXG4gIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleF1cblxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcbiAgICBsZXQgc2NlbmUgPSBmaW5kV2hlcmUoXCJuYW1lXCIsIHNjZW5lTmFtZSwgc2NlbmVzKVxuXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcblxuICAgIGFjdGl2ZVNjZW5lSW5kZXggPSBzY2VuZXMuaW5kZXhPZihzY2VuZSlcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcbiAgfVxuXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleCArIDFdXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcblxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbKythY3RpdmVTY2VuZUluZGV4XVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbVxuXG5mdW5jdGlvbiBTeXN0ZW0gKGNvbXBvbmVudE5hbWVzPVtdKSB7XG4gIHRoaXMuY29tcG9uZW50TmFtZXMgPSBjb21wb25lbnROYW1lc1xufVxuXG5TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChlbnRpdGllcykge1xuICAvL2RvZXMgc29tZXRoaW5nIHcvIHRoZSBsaXN0IG9mIGVudGl0aWVzIHBhc3NlZCB0byBpdFxufVxuIiwibGV0IHtQYWRkbGV9ID0gcmVxdWlyZShcIi4vYXNzZW1ibGFnZXNcIilcbmxldCBSZW5kZXJpbmdTeXN0ZW0gPSByZXF1aXJlKFwiLi9SZW5kZXJpbmdTeXN0ZW1cIilcbmxldCBTY2VuZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxuXG5mdW5jdGlvbiBUZXN0U2NlbmUgKCkge1xuICBsZXQgc3lzdGVtcyA9IFtuZXcgUmVuZGVyaW5nU3lzdGVtXVxuXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXG59XG5cblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcblxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlfSA9IHRoaXMuZ2FtZSBcbiAgbGV0IGFzc2V0cyA9IHtcbiAgICB0ZXh0dXJlczogeyBwYWRkbGU6IFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcGFkZGxlLnBuZ1wiIH0sXG4gIH1cblxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xuICAgIGxldCB7dGV4dHVyZXMsIHNvdW5kc30gPSBsb2FkZWRBc3NldHMgXG5cbiAgICBjYWNoZS5zb3VuZHMgICA9IHNvdW5kc1xuICAgIGNhY2hlLnRleHR1cmVzID0gdGV4dHVyZXNcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcbiAgICBjYihudWxsKVxuICB9KVxufVxuIiwibGV0IHtSZW5kZXJhYmxlLCBQaHlzaWNzfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcbmxldCBFbnRpdHkgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcblxubW9kdWxlLmV4cG9ydHMuUGFkZGxlID0gUGFkZGxlXG5cbmZ1bmN0aW9uIFBhZGRsZSAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcbiAgRW50aXR5LmNhbGwodGhpcylcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxufVxuIiwibW9kdWxlLmV4cG9ydHMuUmVuZGVyYWJsZSA9IFJlbmRlcmFibGVcbm1vZHVsZS5leHBvcnRzLlBoeXNpY3MgICAgPSBQaHlzaWNzXG5cbmZ1bmN0aW9uIFJlbmRlcmFibGUgKGUsIGltYWdlLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIGUucmVuZGVyYWJsZSA9IHtcbiAgICBpbWFnZSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgcm90YXRpb246IDAsXG4gICAgY2VudGVyOiB7XG4gICAgICB4OiB3aWR0aCAvIDIsXG4gICAgICB5OiBoZWlnaHQgLyAyIFxuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDEsXG4gICAgICB5OiAxIFxuICAgIH1cbiAgfSBcbiAgcmV0dXJuIGVcbn1cblxuZnVuY3Rpb24gUGh5c2ljcyAoZSwgd2lkdGgsIGhlaWdodCwgeCwgeSkge1xuICBlLnBoeXNpY3MgPSB7XG4gICAgd2lkdGgsIFxuICAgIGhlaWdodCwgXG4gICAgeCwgXG4gICAgeSwgXG4gICAgZHg6ICAwLCBcbiAgICBkeTogIDAsIFxuICAgIGRkeDogMCwgXG4gICAgZGR5OiAwXG4gIH1cbiAgcmV0dXJuIGVcbn1cbiIsIm1vZHVsZS5leHBvcnRzLmZpbmRXaGVyZSA9IGZpbmRXaGVyZVxubW9kdWxlLmV4cG9ydHMuaGFzS2V5cyAgID0gaGFzS2V5c1xuXG4vLzo6IFt7fV0gLT4gU3RyaW5nIC0+IE1heWJlIEFcbmZ1bmN0aW9uIGZpbmRXaGVyZSAoa2V5LCBwcm9wZXJ0eSwgYXJyYXlPZk9iamVjdHMpIHtcbiAgbGV0IGxlbiAgID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoXG4gIGxldCBpICAgICA9IC0xXG4gIGxldCBmb3VuZCA9IG51bGxcblxuICB3aGlsZSAoICsraSA8IGxlbiApIHtcbiAgICBpZiAoYXJyYXlPZk9iamVjdHNbaV1ba2V5XSA9PT0gcHJvcGVydHkpIHtcbiAgICAgIGZvdW5kID0gYXJyYXlPZk9iamVjdHNbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuXG5mdW5jdGlvbiBoYXNLZXlzIChrZXlzLCBvYmopIHtcbiAgbGV0IGkgPSAtMVxuICBcbiAgd2hpbGUgKGtleXNbKytpXSkgaWYgKCFvYmpba2V5c1tpXV0pIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxufVxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gQnVmZmVyIC0+IEludCAtPiBJbnQgLT4gRmxvYXQzMkFycmF5XG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxufVxuXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcbiAgXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG5cbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxuXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBzcmMpXG4gIHJldHVybiAgICAgICAgc2hhZGVyXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcblxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuICByZXR1cm4gdGV4dHVyZVxufVxuXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcbiIsImxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcbmxldCBTY2VuZSAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxubGV0IFRlc3RTY2VuZSAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxubGV0IEdhbWUgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBjYW52YXMgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG5sZXQgdmVydGV4U3JjICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJ0ZXhcIikudGV4dFxubGV0IGZyYWdTcmMgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJhZ21lbnRcIikudGV4dFxuXG4vL1RFU1RJTkcgRk9SIElOUFVUIE1BTkFHRVJcbmxldCBpbSA9IG5ldyBJbnB1dE1hbmFnZXIoZG9jdW1lbnQpXG5cbndpbmRvdy5pbSA9IGltXG5cbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDI1XG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXG5cbmxldCByZW5kZXJlck9wdHMgPSB7IG1heFNwcml0ZUNvdW50OiBNQVhfQ09VTlQgfVxubGV0IGVudGl0eVN0b3JlICA9IG5ldyBFbnRpdHlTdG9yZVxubGV0IGNhY2hlICAgICAgICA9IG5ldyBDYWNoZShbXCJzb3VuZHNcIiwgXCJ0ZXh0dXJlc1wiXSlcbmxldCBsb2FkZXIgICAgICAgPSBuZXcgTG9hZGVyXG5sZXQgcmVuZGVyZXIgICAgID0gbmV3IEdMUmVuZGVyZXIoY2FudmFzLCB2ZXJ0ZXhTcmMsIGZyYWdTcmMsIHJlbmRlcmVyT3B0cylcbmxldCBzY2VuZU1hbmFnZXIgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcbmxldCBnYW1lICAgICAgICAgPSBuZXcgR2FtZShjYWNoZSwgbG9hZGVyLCByZW5kZXJlciwgZW50aXR5U3RvcmUsIHNjZW5lTWFuYWdlcilcblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ2FtZSkge1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICBpbS50aWNrKClcbiAgICAvL2NvbnNvbGUubG9nKGltLmV2ZW50UXVldWUpXG4gICAgaW0uZmx1c2goKVxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZSgpXG4gIH1cbn1cblxuY29uc29sZS5sb2coaW0pXG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XG4gIGxldCBzdG9yZSAgICAgICAgICA9IGdhbWUuZW50aXR5U3RvcmVcbiAgbGV0IHIgICAgICAgICAgICAgID0gZ2FtZS5yZW5kZXJlclxuICBsZXQgY29tcG9uZW50TmFtZXMgPSBbXCJyZW5kZXJhYmxlXCIsIFwicGh5c2ljc1wiXVxuXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICBsZXQgcmVuZGVyYWJsZXMgPSBzdG9yZS5xdWVyeShjb21wb25lbnROYW1lcylcblxuICAgIHIucmVuZGVyKHJlbmRlcmFibGVzKVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSAgXG4gIH1cbn1cblxud2luZG93LmdhbWUgPSBnYW1lXG5cbmZ1bmN0aW9uIHNldHVwRG9jdW1lbnQgKGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdykge1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgfSlcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuICBzZXR1cERvY3VtZW50KGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdylcbiAgZ2FtZS5zdGFydCgpXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZShnYW1lKSwgVVBEQVRFX0lOVEVSVkFMKVxufSlcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXG5tb2R1bGUuZXhwb3J0cy5jaGVja1ZhbHVlVHlwZSA9IGNoZWNrVmFsdWVUeXBlXG5cbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBjdG9yKSkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBiZSBvZiB0eXBlIFwiICsgY3Rvci5uYW1lKVxufVxuXG5mdW5jdGlvbiBjaGVja1ZhbHVlVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhpbnN0YW5jZSlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIGNoZWNrVHlwZShpbnN0YW5jZVtrZXlzW2ldXSwgY3Rvcilcbn1cbiJdfQ==
