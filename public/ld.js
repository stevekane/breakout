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
var QUEUE_LENGTH = 20;
var KEYDOWN = 0;
var JUSTDOWN = 1;
var JUSTUP = 2;

function fill(value, array) {
  var len = array.length;
  var i = -1;

  while (++i < len) array[i] = value;
}

function EventQueue() {
  var queue = new Uint8Array(QUEUE_LENGTH * EVENT_SIZE);

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
  var states = new Uint8Array(KEY_COUNT);
  var justDowns = new Uint8Array(KEY_COUNT);
  var justUps = new Uint8Array(KEY_COUNT);

  var handleKeyDown = function (_ref) {
    var keyCode = _ref.keyCode;
    if (!states[keyCode]) queueEvent(eventQueue, keyCode, JUSTDOWN);
    justDowns[keyCode] = !states[keyCode];
    states[keyCode] = true;
  };

  var handleKeyUp = function (_ref2) {
    var keyCode = _ref2.keyCode;
    queueEvent(eventQueue, keyCode, JUSTUP);
    justUps[keyCode] = true;
    justDowns[keyCode] = false;
    states[keyCode] = false;
  };

  var handleBlur = function () {
    var i = -1;
    var len = states.length;

    while (++i < KEY_COUNT) {
      states[i] = 0;
      justDowns[i] = 0;
      justUps[i] = 0;
    }
  };

  Object.defineProperty(this, "eventQueue", {
    get: function () {
      return eventQueue;
    }
  });

  this.isJustDown = function (keyCode) {
    return justDowns[keyCode];
  };
  this.isJustUp = function (keyCode) {
    return justUps[keyCode];
  };
  this.isDown = function (keyCode) {
    return states[keyCode];
  };

  this.tick = function (dT) {
    var i = -1;
    var len = states.length;

    while (++i < len) if (states[i]) queueEvent(eventQueue, i, KEYDOWN);
  };

  this.flush = function () {
    var i = -1;
    var len = eventQueue.length;

    //flip justDown and justUps bits to false
    fill(false, justDowns);
    fill(false, justUps);

    //flush eventQueue
    while (++i < len) eventQueue[i] = 0;
    eventQueue.index = QUEUE_LENGTH - 1;
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("blur", handleBlur);
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
    //console.log(im.isJustDown(37))
    //console.log(im.eventQueue)
    im.flush();
    game.sceneManager.activeScene.update();
  };
}

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvSW5wdXRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvTG9hZGVyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLLENBQUUsUUFBUSxFQUFFO0FBQ3pDLE1BQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO0FBQzVELE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDakUsQ0FBQTs7Ozs7O0FDRkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLE1BQU0sR0FBSSxFQUFFLENBQUE7Ozs7O1dDRHRCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQWpDLE9BQU8sUUFBUCxPQUFPOzs7QUFFWixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQTs7QUFFNUIsU0FBUyxXQUFXLENBQUUsR0FBRyxFQUFPO01BQVYsR0FBRyxnQkFBSCxHQUFHLEdBQUMsSUFBSTtBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFJLEVBQUUsQ0FBQTtBQUNuQixNQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM3QyxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDckIsU0FBTyxFQUFFLENBQUE7Q0FDVixDQUFBOztBQUVELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsY0FBYyxFQUFFO0FBQ3RELE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxNQUFNLENBQUE7O0FBRVYsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFVBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFFBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUNqRTtBQUNELFNBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtDQUN0QixDQUFBOzs7OztXQzNCZ0MsT0FBTyxDQUFDLFlBQVksQ0FBQzs7SUFBakQsTUFBTSxRQUFOLE1BQU07SUFBRSxPQUFPLFFBQVAsT0FBTztJQUFFLE9BQU8sUUFBUCxPQUFPO1lBQ1IsT0FBTyxDQUFDLGFBQWEsQ0FBQzs7SUFBdEMsWUFBWSxTQUFaLFlBQVk7OztBQUVqQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQTs7QUFFM0IsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFBO0FBQ3pCLElBQU0sY0FBYyxHQUFJLENBQUMsQ0FBQTtBQUN6QixJQUFNLFVBQVUsR0FBUSxlQUFlLEdBQUcsY0FBYyxDQUFBOztBQUV4RCxTQUFTLE1BQU0sQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QyxNQUFJLENBQUMsR0FBSSxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQzNCLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDZCxNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVkLFVBQVEsQ0FBQyxDQUFDLENBQUMsR0FBTSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7O0FBRW5CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ3BCOztBQUVELFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUN4QixTQUFPLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTtDQUM1Qzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUU7QUFDM0IsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFO0FBQzFCLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTs7QUFFN0MsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFH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USxDQUFDLENBQUE7O0FBRWhDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlOYW1lcy5sZW5ndGg7ICsraSkgdGhpc1trZXlOYW1lc1tpXV0gPSB7fVxufVxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXG5cbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xuICB0aGlzLmVudGl0aWVzICA9IFtdXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXG4gIHJldHVybiBpZFxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcbiAgbGV0IGkgPSAtMVxuICBsZXQgZW50aXR5XG5cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxuXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxuICB9XG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxufVxuIiwibGV0IHtTaGFkZXIsIFByb2dyYW0sIFRleHR1cmV9ID0gcmVxdWlyZShcIi4vZ2wtdHlwZXNcIilcbmxldCB7dXBkYXRlQnVmZmVyfSA9IHJlcXVpcmUoXCIuL2dsLWJ1ZmZlclwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdMUmVuZGVyZXJcblxuY29uc3QgUE9JTlRfRElNRU5TSU9OID0gMlxuY29uc3QgUE9JTlRTX1BFUl9CT1ggID0gNlxuY29uc3QgQk9YX0xFTkdUSCAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcblxuZnVuY3Rpb24gc2V0Qm94IChib3hBcnJheSwgaW5kZXgsIHgsIHksIHcsIGgpIHtcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XG4gIGxldCB4MSA9IHhcbiAgbGV0IHkxID0geSBcbiAgbGV0IHgyID0geCArIHdcbiAgbGV0IHkyID0geSArIGhcblxuICBib3hBcnJheVtpXSAgICA9IHgxXG4gIGJveEFycmF5W2krMV0gID0geTFcbiAgYm94QXJyYXlbaSsyXSAgPSB4MlxuICBib3hBcnJheVtpKzNdICA9IHkxXG4gIGJveEFycmF5W2krNF0gID0geDFcbiAgYm94QXJyYXlbaSs1XSAgPSB5MlxuXG4gIGJveEFycmF5W2krNl0gID0geDFcbiAgYm94QXJyYXlbaSs3XSAgPSB5MlxuICBib3hBcnJheVtpKzhdICA9IHgyXG4gIGJveEFycmF5W2krOV0gID0geTFcbiAgYm94QXJyYXlbaSsxMF0gPSB4MlxuICBib3hBcnJheVtpKzExXSA9IHkyXG59XG5cbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIFNjYWxlQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47ICsraSkgYXJbaV0gPSAxXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxufVxuXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpICBcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcbiAgICBhcltpXSAgICA9IDBcbiAgICBhcltpKzFdICA9IDBcbiAgICBhcltpKzJdICA9IDFcbiAgICBhcltpKzNdICA9IDBcbiAgICBhcltpKzRdICA9IDBcbiAgICBhcltpKzVdICA9IDFcblxuICAgIGFyW2krNl0gID0gMFxuICAgIGFyW2krN10gID0gMVxuICAgIGFyW2krOF0gID0gMVxuICAgIGFyW2krOV0gID0gMFxuICAgIGFyW2krMTBdID0gMVxuICAgIGFyW2krMTFdID0gMVxuICB9IFxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB2U3JjLCBmU3JjLCBvcHRpb25zPXt9KSB7XG4gIGxldCB7bWF4U3ByaXRlQ291bnQsIHdpZHRoLCBoZWlnaHR9ID0gb3B0aW9uc1xuICBsZXQgbWF4U3ByaXRlQ291bnQgPSBtYXhTcHJpdGVDb3VudCB8fCAxMDBcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXG4gIGxldCBnbCAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgICAgICBcbiAgbGV0IHZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxuICBsZXQgZnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcbiAgbGV0IHByb2dyYW0gICAgICAgID0gUHJvZ3JhbShnbCwgdnMsIGZzKVxuXG4gIC8vaW5kZXggZm9yIHRyYWNraW5nIHRoZSBjdXJyZW50IGF2YWlsYWJsZSBwb3NpdGlvbiB0byBpbnN0YW50aWF0ZSBmcm9tXG4gIGxldCBmcmVlSW5kZXggICAgID0gMFxuICBsZXQgYWN0aXZlU3ByaXRlcyA9IDBcblxuICAvL3ZpZXdzIG92ZXIgY3B1IGJ1ZmZlcnMgZm9yIGRhdGFcbiAgbGV0IGJveGVzICAgICA9IEJveEFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgY2VudGVycyAgID0gQ2VudGVyQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCBzY2FsZXMgICAgPSBTY2FsZUFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgcm90YXRpb25zID0gUm90YXRpb25BcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHRleENvb3JkcyA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KG1heFNwcml0ZUNvdW50KVxuXG4gIC8vaGFuZGxlcyB0byBHUFUgYnVmZmVyc1xuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgY2VudGVyQnVmZmVyICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgc2NhbGVCdWZmZXIgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgdGV4Q29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuXG4gIC8vR1BVIGJ1ZmZlciBsb2NhdGlvbnNcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIilcbiAgLy9sZXQgY2VudGVyTG9jYXRpb24gICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jZW50ZXJcIilcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXG4gIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3RleENvb3JkXCIpXG5cbiAgLy9Vbmlmb3JtIGxvY2F0aW9uc1xuICBsZXQgd29ybGRTaXplTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxuXG4gIC8vVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgZm9yIHRlc3RpbmcgdGhlIHNpbmdsZSB0ZXh0dXJlIGNhc2VcbiAgbGV0IG9ubHlUZXh0dXJlID0gVGV4dHVyZShnbClcbiAgbGV0IGxvYWRlZCAgICAgID0gZmFsc2VcblxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXG4gIGdsLmNsZWFyQ29sb3IoMS4wLCAxLjAsIDEuMCwgMC4wKVxuICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSlcbiAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKVxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcbiAgICB3aWR0aDogIHdpZHRoIHx8IDE5MjAsIFxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcbiAgfVxuXG4gIC8vVE9ETzogVGhpcyBzaG91bGQgbm90IGJlIHB1YmxpYyBhcGkuICBlbnRpdGllcyBjb250YWluIHJlZmVyZW5jZXNcbiAgLy90byB0aGVpciBpbWFnZSB3aGljaCBzaG91bGQgYmUgV2Vha21hcCBzdG9yZWQgd2l0aCBhIHRleHR1cmUgYW5kIHVzZWRcbiAgdGhpcy5hZGRUZXh0dXJlID0gKGltYWdlKSA9PiB7XG4gICAgLy9UT0RPOiBUZW1wb3JhcnkgeXVja3kgdGhpbmdcbiAgICBsb2FkZWQgPSB0cnVlXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgb25seVRleHR1cmUpXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7IFxuICB9XG5cbiAgdGhpcy5yZXNpemUgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xuICAgIGxldCByYXRpbyAgICAgICA9IHRoaXMuZGltZW5zaW9ucy53aWR0aCAvIHRoaXMuZGltZW5zaW9ucy5oZWlnaHRcbiAgICBsZXQgdGFyZ2V0UmF0aW8gPSB3aWR0aCAvIGhlaWdodFxuICAgIGxldCB1c2VXaWR0aCAgICA9IHJhdGlvID49IHRhcmdldFJhdGlvXG4gICAgbGV0IG5ld1dpZHRoICAgID0gdXNlV2lkdGggPyB3aWR0aCA6IChoZWlnaHQgKiByYXRpbykgXG4gICAgbGV0IG5ld0hlaWdodCAgID0gdXNlV2lkdGggPyAod2lkdGggLyByYXRpbykgOiBoZWlnaHRcblxuICAgIGNhbnZhcy53aWR0aCAgPSBuZXdXaWR0aCBcbiAgICBjYW52YXMuaGVpZ2h0ID0gbmV3SGVpZ2h0IFxuICAgIGdsLnZpZXdwb3J0KDAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHQpXG4gIH1cblxuICB0aGlzLmFkZFNwcml0ZSA9ICgpID0+IHt9XG5cbiAgLy9USElOSyBPRiBOQU1FP1xuICAvL3RoaXMucmVzZXQgPSBcbiAgLy90aGlzLmZsdXNoXG5cbiAgdGhpcy5yZW5kZXIgPSAoZW50aXRpZXMpID0+IHtcbiAgICAvL3Jlc2V0IHRoZXNlIHZhbHVlcyBvbiBldmVyeSBjYWxsP1xuICAgIGZyZWVJbmRleCAgICAgPSAwXG4gICAgYWN0aXZlU3ByaXRlcyA9IDBcbiAgICB3aW5kb3cuYm94ZXMgPSBib3hlc1xuXG4gICAgaWYgKCFsb2FkZWQgJiYgZW50aXRpZXNbMF0pIHRoaXMuYWRkVGV4dHVyZShlbnRpdGllc1swXS5yZW5kZXJhYmxlLmltYWdlKVxuXG4gICAgLy9UT0RPOiBpbml0aWFsIHZlcnNpb24gb2YgdGhpcyBsb29wIHVzZXMgY29tbW9ubHkgc2hhcmVkIHBhZGRsZSB0ZXh0dXJlXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7ICsraSkge1xuICAgICAgc2V0Qm94KFxuICAgICAgICBib3hlcywgXG4gICAgICAgIGZyZWVJbmRleCsrLCBcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy54LCBcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy55LCBcbiAgICAgICAgZW50aXRpZXNbaV0ucmVuZGVyYWJsZS53aWR0aCxcbiAgICAgICAgZW50aXRpZXNbaV0ucmVuZGVyYWJsZS5oZWlnaHRcbiAgICAgIClcbiAgICAgIGFjdGl2ZVNwcml0ZXMrK1xuICAgIH1cblxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgb25seVRleHR1cmUpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBib3hCdWZmZXIsIGJveExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJveGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgcm90YXRpb25CdWZmZXIsIHJvdExvY2F0aW9uLCAxLCByb3RhdGlvbnMpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCB0ZXhDb29yZHMpXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplTG9jYXRpb24sIDE5MjAsIDEwODApXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGFjdGl2ZVNwcml0ZXMgKiBQT0lOVFNfUEVSX0JPWClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXG5cbi8vOjogQ2FjaGUgLT4gTG9hZGVyIC0+IEdMUmVuZGVyZXIgLT4gRW50aXR5U3RvcmUgLT4gU2NlbmVNYW5hZ2VyXG5mdW5jdGlvbiBHYW1lIChjYWNoZSwgbG9hZGVyLCByZW5kZXJlciwgZW50aXR5U3RvcmUsIHNjZW5lTWFuYWdlcikge1xuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXG4gIHRoaXMucmVuZGVyZXIgICAgID0gcmVuZGVyZXJcbiAgdGhpcy5lbnRpdHlTdG9yZSAgPSBlbnRpdHlTdG9yZVxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxuXG4gIC8vSW50cm9kdWNlIGJpLWRpcmVjdGlvbmFsIHJlZmVyZW5jZSB0byBnYW1lIG9iamVjdCBvbnRvIGVhY2ggc2NlbmVcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lc1tpXS5nYW1lID0gdGhpc1xuICB9XG59XG5cbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXG5cbiAgY29uc29sZS5sb2coXCJjYWxsaW5nIHNldHVwIGZvciBcIiArIHN0YXJ0U2NlbmUubmFtZSlcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcbn1cblxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgLy93aGF0IGRvZXMgdGhpcyBldmVuIG1lYW4/XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IElucHV0TWFuYWdlclxuXG5jb25zdCBFVkVOVF9TSVpFICAgPSAyXG5jb25zdCBLRVlfQ09VTlQgICAgPSAyNTZcbmNvbnN0IFFVRVVFX0xFTkdUSCA9IDIwXG5jb25zdCBLRVlET1dOICAgICAgPSAwXG5jb25zdCBKVVNURE9XTiAgICAgPSAxXG5jb25zdCBKVVNUVVAgICAgICAgPSAyXG5cbmZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBhcnJheSkge1xuICBsZXQgbGVuID0gYXJyYXkubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIGFycmF5W2ldID0gdmFsdWVcbn1cblxuZnVuY3Rpb24gRXZlbnRRdWV1ZSAoKSB7XG4gIGxldCBxdWV1ZSA9IG5ldyBVaW50OEFycmF5KFFVRVVFX0xFTkdUSCAqIEVWRU5UX1NJWkUpXG5cbiAgcXVldWUuaW5kZXggPSBRVUVVRV9MRU5HVEggLSAxXG4gIHJldHVybiBxdWV1ZVxufVxuXG4vL3R5cGUgaXMgRU5VTSBzZWUgYWJvdmUgZm9yIGRlZnNcbmZ1bmN0aW9uIHF1ZXVlRXZlbnQgKHF1ZXVlLCBrZXlDb2RlLCB0eXBlKSB7XG4gIHF1ZXVlW3F1ZXVlLmluZGV4KjJdICAgPSBrZXlDb2RlXG4gIHF1ZXVlW3F1ZXVlLmluZGV4KjIrMV0gPSB0eXBlXG4gIHF1ZXVlLmluZGV4LS1cbn1cblxuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChkb2N1bWVudCkge1xuICBsZXQgZXZlbnRRdWV1ZSA9IG5ldyBFdmVudFF1ZXVlXG4gIGxldCBzdGF0ZXMgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQganVzdERvd25zICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3RVcHMgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIFxuICBsZXQgaGFuZGxlS2V5RG93biA9ICh7a2V5Q29kZX0pID0+IHtcbiAgICBpZiAoIXN0YXRlc1trZXlDb2RlXSkgcXVldWVFdmVudChldmVudFF1ZXVlLCBrZXlDb2RlLCBKVVNURE9XTilcbiAgICBqdXN0RG93bnNba2V5Q29kZV0gPSAhc3RhdGVzW2tleUNvZGVdXG4gICAgc3RhdGVzW2tleUNvZGVdICAgID0gdHJ1ZVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIHF1ZXVlRXZlbnQoZXZlbnRRdWV1ZSwga2V5Q29kZSwgSlVTVFVQKVxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcbiAgICBqdXN0RG93bnNba2V5Q29kZV0gPSBmYWxzZVxuICAgIHN0YXRlc1trZXlDb2RlXSAgICA9IGZhbHNlXG4gIH1cblxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcbiAgICBsZXQgaSAgID0gLTFcbiAgICBsZXQgbGVuID0gc3RhdGVzLmxlbmd0aFxuXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xuICAgICAgc3RhdGVzW2ldICAgID0gMFxuICAgICAganVzdERvd25zW2ldID0gMFxuICAgICAganVzdFVwc1tpXSAgID0gMFxuICAgIH1cbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImV2ZW50UXVldWVcIiwge1xuICAgIGdldCAoKSB7IHJldHVybiBldmVudFF1ZXVlIH0gXG4gIH0pXG5cbiAgdGhpcy5pc0p1c3REb3duID0gKGtleUNvZGUpID0+IGp1c3REb3duc1trZXlDb2RlXVxuICB0aGlzLmlzSnVzdFVwICAgPSAoa2V5Q29kZSkgPT4ganVzdFVwc1trZXlDb2RlXVxuICB0aGlzLmlzRG93biAgICAgPSAoa2V5Q29kZSkgPT4gc3RhdGVzW2tleUNvZGVdXG5cbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XG4gICAgbGV0IGkgICA9IC0xXG4gICAgbGV0IGxlbiA9IHN0YXRlcy5sZW5ndGhcblxuICAgIHdoaWxlICgrK2kgPCBsZW4pIGlmIChzdGF0ZXNbaV0pIHF1ZXVlRXZlbnQoZXZlbnRRdWV1ZSwgaSwgS0VZRE9XTilcbiAgfVxuXG4gIHRoaXMuZmx1c2ggPSAoKSA9PiB7XG4gICAgbGV0IGkgICA9IC0xXG4gICAgbGV0IGxlbiA9IGV2ZW50UXVldWUubGVuZ3RoXG5cbiAgICAvL2ZsaXAganVzdERvd24gYW5kIGp1c3RVcHMgYml0cyB0byBmYWxzZVxuICAgIGZpbGwoZmFsc2UsIGp1c3REb3ducykgXG4gICAgZmlsbChmYWxzZSwganVzdFVwcylcbiAgICBcbiAgICAvL2ZsdXNoIGV2ZW50UXVldWVcbiAgICB3aGlsZSAoKytpIDwgbGVuKSBldmVudFF1ZXVlW2ldID0gMFxuICAgIGV2ZW50UXVldWUuaW5kZXggPSBRVUVVRV9MRU5HVEggLSAxXG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXG59XG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XG5cbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXG5cbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXG5cbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICAgICAgeGhyLnNlbmQobnVsbClcbiAgICB9IFxuICB9XG5cbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXG5cbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xuXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxuICAgIGkuc3JjICAgICA9IHBhdGhcbiAgfVxuXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pIFxuICB9XG5cbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzIHx8IHt9KVxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycyB8fCB7fSlcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxuICAgIH1cblxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc291bmRDb3VudC0tXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHRleHR1cmVDb3VudC0tXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzaGFkZXJDb3VudC0tXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXG5cbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxuXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXG5cbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cblxuZnVuY3Rpb24gUmVuZGVyaW5nU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXG59XG5cbi8vVE9ETzogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGUgc2NlbmUgdGhhdCBvd25zIHVzIVxuLy9hbmQgYnkgZXh0ZW5zaW9uLCBpZiBuZWVkZWQsIHdlIHdpbGwgaGF2ZSBhIHJlZmVyZW5jZVxuLy90byB0aGUgZ2FtZSBpdHNlbGZcblJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGVudGl0aWVzKSB7XG4gIC8vbGV0IHtyZW5kZXJlcn0gPSB0aGlzLnNjZW5lLmdhbWVcblxuICAvL3JlbmRlcmVyLnJlc2V0KClcbiAgLy9lbnRpdGllcy5mb3JFYWNoKGZ1bmN0aW9uIChlbnRpdHkpIHtcbiAgLy8gIHJlbmRlcmVyLmFkZFNwcml0ZSgvL3Byb3BlcnRpZXMgdGhhdCBpdCBjYXJlcyBhYm91dCkgXG4gIC8vfSkgICBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU2NlbmVcblxuLyogR0FNRVxuICogICAgUkVOREVSRVJcbiAqICAgIEFVRElPIFRISU5HXG4gKiAgICBJTlBVVCBUSElOR1xuICogICAgQVNTRVQgTE9BREVSXG4gKiAgICBBU1NFVCBDQUNIRVxuICogICAgRU5USVRZIFNUT1JFIC0tIGF0IHNpbXBsZXN0LCB0aGlzIGlzIGFuIGFycmF5IG9mIGVudGl0aWVzXG4gKiAgICBTQ0VORU1BTkFHRVJcbiAqICAgICAgW1NDRU5FU10gIC0tIGFuYWxvZ3MgdG8gcHJvZ3JhbXMuICBPbmUgcHJvZ3JhbSBleGVjdXRlcyBhdCBhIHRpbWVcbiAqICAgICAgICBTWVNURU1TXG4gKi9cblxuZnVuY3Rpb24gU2NlbmUgKG5hbWUsIHN5c3RlbXMpIHtcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWVcIilcblxuICB0aGlzLm5hbWUgICAgPSBuYW1lXG4gIHRoaXMuc3lzdGVtcyA9IHN5c3RlbXNcbiAgdGhpcy5nYW1lICAgID0gbnVsbFxufVxuXG5TY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgY2IobnVsbCwgbnVsbCkgIFxufVxuXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICBsZXQgc3RvcmUgPSB0aGlzLmdhbWUuZW50aXR5U3RvcmVcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxuICBsZXQgaSAgICAgPSAtMVxuICBsZXQgc3lzdGVtXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXSBcbiAgICBzeXN0ZW0ucnVuKHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXG4gIH1cbn1cbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lTWFuYWdlclxuXG5mdW5jdGlvbiBTY2VuZU1hbmFnZXIgKHNjZW5lcz1bXSkge1xuICBpZiAoc2NlbmVzLmxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgb25lIG9yIG1vcmUgc2NlbmVzXCIpXG5cbiAgbGV0IGFjdGl2ZVNjZW5lSW5kZXggPSAwXG4gIGxldCBzY2VuZXMgICAgICAgICAgID0gc2NlbmVzXG5cbiAgdGhpcy5zY2VuZXMgICAgICA9IHNjZW5lc1xuICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXhdXG5cbiAgdGhpcy50cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiAoc2NlbmVOYW1lKSB7XG4gICAgbGV0IHNjZW5lID0gZmluZFdoZXJlKFwibmFtZVwiLCBzY2VuZU5hbWUsIHNjZW5lcylcblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihzY2VuZU5hbWUgKyBcIiBpcyBub3QgYSB2YWxpZCBzY2VuZSBuYW1lXCIpXG5cbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lXG4gIH1cblxuICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXggKyAxXVxuXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9yZSBzY2VuZXMhXCIpXG5cbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1cblxuZnVuY3Rpb24gU3lzdGVtIChjb21wb25lbnROYW1lcz1bXSkge1xuICB0aGlzLmNvbXBvbmVudE5hbWVzID0gY29tcG9uZW50TmFtZXNcbn1cblxuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoZW50aXRpZXMpIHtcbiAgLy9kb2VzIHNvbWV0aGluZyB3LyB0aGUgbGlzdCBvZiBlbnRpdGllcyBwYXNzZWQgdG8gaXRcbn1cbiIsImxldCB7UGFkZGxlfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXG5sZXQgUmVuZGVyaW5nU3lzdGVtID0gcmVxdWlyZShcIi4vUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgU2NlbmUgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcblxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcbiAgbGV0IHN5c3RlbXMgPSBbbmV3IFJlbmRlcmluZ1N5c3RlbV1cblxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxufVxuXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXG5cblRlc3RTY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZX0gPSB0aGlzLmdhbWUgXG4gIGxldCBhc3NldHMgPSB7XG4gICAgdGV4dHVyZXM6IHsgcGFkZGxlOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIiB9LFxuICB9XG5cbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxuXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBQYWRkbGUodGV4dHVyZXMucGFkZGxlLCAxMTIsIDI1LCA0MDAsIDQwMCkpXG4gICAgY2IobnVsbClcbiAgfSlcbn1cbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljc30gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQgRW50aXR5ID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXG5cbm1vZHVsZS5leHBvcnRzLlBhZGRsZSA9IFBhZGRsZVxuXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzLlJlbmRlcmFibGUgPSBSZW5kZXJhYmxlXG5tb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgID0gUGh5c2ljc1xuXG5mdW5jdGlvbiBSZW5kZXJhYmxlIChlLCBpbWFnZSwgd2lkdGgsIGhlaWdodCkge1xuICBlLnJlbmRlcmFibGUgPSB7XG4gICAgaW1hZ2UsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIHJvdGF0aW9uOiAwLFxuICAgIGNlbnRlcjoge1xuICAgICAgeDogd2lkdGggLyAyLFxuICAgICAgeTogaGVpZ2h0IC8gMiBcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiAxLFxuICAgICAgeTogMSBcbiAgICB9XG4gIH0gXG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgZS5waHlzaWNzID0ge1xuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHgsIFxuICAgIHksIFxuICAgIGR4OiAgMCwgXG4gICAgZHk6ICAwLCBcbiAgICBkZHg6IDAsIFxuICAgIGRkeTogMFxuICB9XG4gIHJldHVybiBlXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcblxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XG4gIGxldCBsZW4gICA9IGFycmF5T2ZPYmplY3RzLmxlbmd0aFxuICBsZXQgaSAgICAgPSAtMVxuICBsZXQgZm91bmQgPSBudWxsXG5cbiAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XG4gICAgICBmb3VuZCA9IGFycmF5T2ZPYmplY3RzW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cblxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XG4gIGxldCBpID0gLTFcbiAgXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcbn1cbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbn1cblxubW9kdWxlLmV4cG9ydHMudXBkYXRlQnVmZmVyID0gdXBkYXRlQnVmZmVyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xuICBsZXQgc2hhZGVyICA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKVxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXG4gIFxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuXG4gIGlzVmFsaWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUylcblxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgc3JjKVxuICByZXR1cm4gICAgICAgIHNoYWRlclxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBWZXJ0ZXhTaGFkZXIgLT4gRnJhZ21lbnRTaGFkZXJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcblxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcbiAgbGV0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG5cbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgcmV0dXJuIHRleHR1cmVcbn1cblxubW9kdWxlLmV4cG9ydHMuU2hhZGVyICA9IFNoYWRlclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXG4iLCJsZXQgTG9hZGVyICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5sZXQgU2NlbmUgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcbmxldCBUZXN0U2NlbmUgICAgPSByZXF1aXJlKFwiLi9UZXN0U2NlbmVcIilcbmxldCBHYW1lICAgICAgICAgPSByZXF1aXJlKFwiLi9HYW1lXCIpXG5sZXQgSW5wdXRNYW5hZ2VyID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXG5sZXQgY2FudmFzICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxubGV0IHZlcnRleFNyYyAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmVydGV4XCIpLnRleHRcbmxldCBmcmFnU3JjICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZyYWdtZW50XCIpLnRleHRcblxuLy9URVNUSU5HIEZPUiBJTlBVVCBNQU5BR0VSXG5sZXQgaW0gPSBuZXcgSW5wdXRNYW5hZ2VyKGRvY3VtZW50KVxuXG53aW5kb3cuaW0gPSBpbVxuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQgcmVuZGVyZXJPcHRzID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cbmxldCBlbnRpdHlTdG9yZSAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjYWNoZSAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXG5sZXQgbG9hZGVyICAgICAgID0gbmV3IExvYWRlclxubGV0IHJlbmRlcmVyICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgdmVydGV4U3JjLCBmcmFnU3JjLCByZW5kZXJlck9wdHMpXG5sZXQgc2NlbmVNYW5hZ2VyID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXG5sZXQgZ2FtZSAgICAgICAgID0gbmV3IEdhbWUoY2FjaGUsIGxvYWRlciwgcmVuZGVyZXIsIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpXG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gICAgaW0udGljaygpXG4gICAgLy9jb25zb2xlLmxvZyhpbS5pc0p1c3REb3duKDM3KSlcbiAgICAvL2NvbnNvbGUubG9nKGltLmV2ZW50UXVldWUpXG4gICAgaW0uZmx1c2goKVxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZSgpXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdhbWUpIHtcbiAgbGV0IHN0b3JlICAgICAgICAgID0gZ2FtZS5lbnRpdHlTdG9yZVxuICBsZXQgciAgICAgICAgICAgICAgPSBnYW1lLnJlbmRlcmVyXG4gIGxldCBjb21wb25lbnROYW1lcyA9IFtcInJlbmRlcmFibGVcIiwgXCJwaHlzaWNzXCJdXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIGxldCByZW5kZXJhYmxlcyA9IHN0b3JlLnF1ZXJ5KGNvbXBvbmVudE5hbWVzKVxuXG4gICAgci5yZW5kZXIocmVuZGVyYWJsZXMpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcbiAgfVxufVxuXG53aW5kb3cuZ2FtZSA9IGdhbWVcblxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxuICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB9KVxufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxuICBnYW1lLnN0YXJ0KClcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdhbWUpKVxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXG59KVxuIiwibW9kdWxlLmV4cG9ydHMuY2hlY2tUeXBlICAgICAgPSBjaGVja1R5cGVcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcblxuZnVuY3Rpb24gY2hlY2tUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXG59XG5cbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKGluc3RhbmNlKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxufVxuIl19
