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

var STATE_LENGTH = 3;
var KEY_COUNT = 256;
var QUEUE_LENGTH = 24;

//[up/down, justDown, justUp]
var isDown = function (states, keyCode) {
  return states[keyCode * STATE_LENGTH];
};
var justDown = function (states, keyCode) {
  return states[keyCode * STATE_LENGTH + 1];
};
var justUp = function (states, keyCode) {
  return states[keyCode * STATE_LENGTH + 2];
};
var setDown = function (states, keyCode, val) {
  return states[keyCode * STATE_LENGTH] = val;
};
var setJustDown = function (states, keyCode, val) {
  return states[keyCode * STATE_LENGTH + 1] = val;
};
var setJustUp = function (states, keyCode, val) {
  return states[keyCode * STATE_LENGTH + 2] = val;
};
var setState = function (states, keyCode, isDown, justDown, justUp) {
  states[keyCode * STATE_LENGTH] = isDown;
  states[keyCode * STATE_LENGTH + 1] = justDown;
  states[keyCode * STATE_LENGTH + 2] = justUp;
};

function InputManager(document) {
  var downQueue = [];
  var justDownQueue = [];
  var justUpQueue = [];
  var states = new Int8Array(KEY_COUNT * STATE_LENGTH);

  var handleKeyDown = function (_ref) {
    var keyCode = _ref.keyCode;
    var alreadyDown = isDown(states, keyCode);

    setDown(states, keyCode, 1);
    if (!alreadyDown) setJustDown(states, keyCode, 1);
  };

  var handleKeyUp = function (_ref2) {
    var keyCode = _ref2.keyCode;
    setDown(states, keyCode, 0);
    setJustUp(states, keyCode, 1);
  };

  this.states = states;
  this.downQueue = downQueue;
  this.justDownQueue = justDownQueue;
  this.justUpQueue = justUpQueue;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

InputManager.prototype.tick = function (dT) {
  this.downQueue = [];
  this.justDownQueue = [];
  this.justUpQueue = [];

  for (var i = 0, len = this.states.length; i < len; ++i) {
    if (isDown(this.states, i)) this.downQueue.push(i);
    if (justDown(this.states, i)) this.justDownQueue.push(i);
    if (justUp(this.states, i)) this.justUpQueue.push(i);
    setJustDown(this.states, i, 0);
    setJustUp(this.states, i, 0);
  }
  console.log("justDown", this.justDownQueue);
};

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


//TODO: temporary value for input testing
//const UPDATE_INTERVAL = 25
var UPDATE_INTERVAL = 1000;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvSW5wdXRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvTG9hZGVyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLLENBQUUsUUFBUSxFQUFFO0FBQ3pDLE1BQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO0FBQzVELE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDakUsQ0FBQTs7Ozs7O0FDRkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLE1BQU0sR0FBSSxFQUFFLENBQUE7Ozs7O1dDRHRCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQWpDLE9BQU8sUUFBUCxPQUFPOzs7QUFFWixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQTs7QUFFNUIsU0FBUyxXQUFXLENBQUUsR0FBRyxFQUFPO01BQVYsR0FBRyxnQkFBSCxHQUFHLEdBQUMsSUFBSTtBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFJLEVBQUUsQ0FBQTtBQUNuQixNQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM3QyxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDckIsU0FBTyxFQUFFLENBQUE7Q0FDVixDQUFBOztBQUVELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsY0FBYyxFQUFFO0FBQ3RELE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxNQUFNLENBQUE7O0FBRVYsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFVBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFFBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUNqRTtBQUNELFNBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtDQUN0QixDQUFBOzs7OztXQzNCZ0MsT0FBTyxDQUFDLFlBQVksQ0FBQzs7SUFBakQsTUFBTSxRQUFOLE1BQU07SUFBRSxPQUFPLFFBQVAsT0FBTztJQUFFLE9BQU8sUUFBUCxPQUFPO1lBQ1IsT0FBTyxDQUFDLGFBQWEsQ0FBQzs7SUFBdEMsWUFBWSxTQUFaLFlBQVk7OztBQUVqQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQTs7QUFFM0IsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFBO0FBQ3pCLElBQU0sY0FBYyxHQUFJLENBQUMsQ0FBQTtBQUN6QixJQUFNLFVBQVUsR0FBUSxlQUFlLEdBQUcsY0FBYyxDQUFBOztBQUV4RCxTQUFTLE1BQU0sQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QyxNQUFJLENBQUMsR0FBSSxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQzNCLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDZCxNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVkLFVBQVEsQ0FBQyxDQUFDLENBQUMsR0FBTSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7O0FBRW5CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ3BCOztBQUVELFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUN4QixTQUFPLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTtDQUM1Qzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUU7QUFDM0IsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFO0FBQzFCLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTs7QUFFN0MsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFH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QzVDLFlBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7R0FDdkQsQ0FBQyxDQUFBO0NBQ0g7O0FBRUQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLFlBQVk7QUFDeEQsZUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDdkMsTUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ1osdUJBQXFCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDeEMsYUFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQTtDQUMvQyxDQUFDLENBQUE7Ozs7O0FDbkVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFRLFNBQVMsQ0FBQTtBQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7O0FBRTlDLFNBQVMsU0FBUyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDbEMsTUFBSSxDQUFDLENBQUMsUUFBUSxZQUFZLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0NBQ2pGOztBQUVELFNBQVMsY0FBYyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6RSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENhY2hlIChrZXlOYW1lcykge1xuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XG59XG4iLCIvL3RoaXMgZG9lcyBsaXRlcmFsbHkgbm90aGluZy4gIGl0J3MgYSBzaGVsbCB0aGF0IGhvbGRzIGNvbXBvbmVudHNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcblxuZnVuY3Rpb24gRW50aXR5U3RvcmUgKG1heD0xMDAwKSB7XG4gIHRoaXMuZW50aXRpZXMgID0gW11cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcbiAgbGV0IGlkID0gdGhpcy5lbnRpdGllcy5sZW5ndGhcblxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcbiAgcmV0dXJuIGlkXG59XG5cbkVudGl0eVN0b3JlLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChjb21wb25lbnROYW1lcykge1xuICBsZXQgaSA9IC0xXG4gIGxldCBlbnRpdHlcblxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXG5cbiAgd2hpbGUgKHRoaXMuZW50aXRpZXNbKytpXSkge1xuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXG4gIH1cbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XG59XG4iLCJsZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxuXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgeCwgeSwgdywgaCkge1xuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcbiAgbGV0IHgxID0geFxuICBsZXQgeTEgPSB5IFxuICBsZXQgeDIgPSB4ICsgd1xuICBsZXQgeTIgPSB5ICsgaFxuXG4gIGJveEFycmF5W2ldICAgID0geDFcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxuICBib3hBcnJheVtpKzJdICA9IHgyXG4gIGJveEFycmF5W2krM10gID0geTFcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxuICBib3hBcnJheVtpKzVdICA9IHkyXG5cbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxuICBib3hBcnJheVtpKzddICA9IHkyXG4gIGJveEFycmF5W2krOF0gID0geDJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxuICBib3hBcnJheVtpKzEwXSA9IHgyXG4gIGJveEFycmF5W2krMTFdID0geTJcbn1cblxuZnVuY3Rpb24gQm94QXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIFJvdGF0aW9uQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG59XG5cbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xuICAgIGFyW2ldICAgID0gMFxuICAgIGFyW2krMV0gID0gMFxuICAgIGFyW2krMl0gID0gMVxuICAgIGFyW2krM10gID0gMFxuICAgIGFyW2krNF0gID0gMFxuICAgIGFyW2krNV0gID0gMVxuXG4gICAgYXJbaSs2XSAgPSAwXG4gICAgYXJbaSs3XSAgPSAxXG4gICAgYXJbaSs4XSAgPSAxXG4gICAgYXJbaSs5XSAgPSAwXG4gICAgYXJbaSsxMF0gPSAxXG4gICAgYXJbaSsxMV0gPSAxXG4gIH0gXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcbiAgbGV0IHttYXhTcHJpdGVDb3VudCwgd2lkdGgsIGhlaWdodH0gPSBvcHRpb25zXG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IG1heFNwcml0ZUNvdW50IHx8IDEwMFxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxuICBsZXQgdnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICBsZXQgcHJvZ3JhbSAgICAgICAgPSBQcm9ncmFtKGdsLCB2cywgZnMpXG5cbiAgLy9pbmRleCBmb3IgdHJhY2tpbmcgdGhlIGN1cnJlbnQgYXZhaWxhYmxlIHBvc2l0aW9uIHRvIGluc3RhbnRpYXRlIGZyb21cbiAgbGV0IGZyZWVJbmRleCAgICAgPSAwXG4gIGxldCBhY3RpdmVTcHJpdGVzID0gMFxuXG4gIC8vdmlld3Mgb3ZlciBjcHUgYnVmZmVycyBmb3IgZGF0YVxuICBsZXQgYm94ZXMgICAgID0gQm94QXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCBjZW50ZXJzICAgPSBDZW50ZXJBcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHNjYWxlcyAgICA9IFNjYWxlQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCByb3RhdGlvbnMgPSBSb3RhdGlvbkFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgdGV4Q29vcmRzID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkobWF4U3ByaXRlQ291bnQpXG5cbiAgLy9oYW5kbGVzIHRvIEdQVSBidWZmZXJzXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcblxuICAvL1VuaWZvcm0gbG9jYXRpb25zXG4gIGxldCB3b3JsZFNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG5cbiAgLy9UT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBmb3IgdGVzdGluZyB0aGUgc2luZ2xlIHRleHR1cmUgY2FzZVxuICBsZXQgb25seVRleHR1cmUgPSBUZXh0dXJlKGdsKVxuICBsZXQgbG9hZGVkICAgICAgPSBmYWxzZVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG5cbiAgdGhpcy5kaW1lbnNpb25zID0ge1xuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXG4gICAgaGVpZ2h0OiBoZWlnaHQgfHwgMTA4MFxuICB9XG5cbiAgLy9UT0RPOiBUaGlzIHNob3VsZCBub3QgYmUgcHVibGljIGFwaS4gIGVudGl0aWVzIGNvbnRhaW4gcmVmZXJlbmNlc1xuICAvL3RvIHRoZWlyIGltYWdlIHdoaWNoIHNob3VsZCBiZSBXZWFrbWFwIHN0b3JlZCB3aXRoIGEgdGV4dHVyZSBhbmQgdXNlZFxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcbiAgICAvL1RPRE86IFRlbXBvcmFyeSB5dWNreSB0aGluZ1xuICAgIGxvYWRlZCA9IHRydWVcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKTsgXG4gIH1cblxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxuXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcbiAgfVxuXG4gIHRoaXMuYWRkU3ByaXRlID0gKCkgPT4ge31cblxuICAvL1RISU5LIE9GIE5BTUU/XG4gIC8vdGhpcy5yZXNldCA9IFxuICAvL3RoaXMuZmx1c2hcblxuICB0aGlzLnJlbmRlciA9IChlbnRpdGllcykgPT4ge1xuICAgIC8vcmVzZXQgdGhlc2UgdmFsdWVzIG9uIGV2ZXJ5IGNhbGw/XG4gICAgZnJlZUluZGV4ICAgICA9IDBcbiAgICBhY3RpdmVTcHJpdGVzID0gMFxuICAgIHdpbmRvdy5ib3hlcyA9IGJveGVzXG5cbiAgICBpZiAoIWxvYWRlZCAmJiBlbnRpdGllc1swXSkgdGhpcy5hZGRUZXh0dXJlKGVudGl0aWVzWzBdLnJlbmRlcmFibGUuaW1hZ2UpXG5cbiAgICAvL1RPRE86IGluaXRpYWwgdmVyc2lvbiBvZiB0aGlzIGxvb3AgdXNlcyBjb21tb25seSBzaGFyZWQgcGFkZGxlIHRleHR1cmVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBzZXRCb3goXG4gICAgICAgIGJveGVzLCBcbiAgICAgICAgZnJlZUluZGV4KyssIFxuICAgICAgICBlbnRpdGllc1tpXS5waHlzaWNzLngsIFxuICAgICAgICBlbnRpdGllc1tpXS5waHlzaWNzLnksIFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLndpZHRoLFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLmhlaWdodFxuICAgICAgKVxuICAgICAgYWN0aXZlU3ByaXRlcysrXG4gICAgfVxuXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGNlbnRlckJ1ZmZlciwgY2VudGVyTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgY2VudGVycylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIHRleENvb3JkQnVmZmVyLCB0ZXhDb29yZExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHRleENvb3JkcylcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYWN0aXZlU3ByaXRlcyAqIFBPSU5UU19QRVJfQk9YKVxuICB9XG59XG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVcblxuLy86OiBDYWNoZSAtPiBMb2FkZXIgLT4gR0xSZW5kZXJlciAtPiBFbnRpdHlTdG9yZSAtPiBTY2VuZU1hbmFnZXJcbmZ1bmN0aW9uIEdhbWUgKGNhY2hlLCBsb2FkZXIsIHJlbmRlcmVyLCBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XG4gIGNoZWNrVHlwZShjYWNoZSwgQ2FjaGUpXG4gIGNoZWNrVHlwZShsb2FkZXIsIExvYWRlcilcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxuICBjaGVja1R5cGUoZW50aXR5U3RvcmUsIEVudGl0eVN0b3JlKVxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXG5cbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmVudGl0eVN0b3JlICA9IGVudGl0eVN0b3JlXG4gIHRoaXMuc2NlbmVNYW5hZ2VyID0gc2NlbmVNYW5hZ2VyXG5cbiAgLy9JbnRyb2R1Y2UgYmktZGlyZWN0aW9uYWwgcmVmZXJlbmNlIHRvIGdhbWUgb2JqZWN0IG9udG8gZWFjaCBzY2VuZVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXG4gIH1cbn1cblxuR2FtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGFydFNjZW5lID0gdGhpcy5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmVcblxuICBjb25zb2xlLmxvZyhcImNhbGxpbmcgc2V0dXAgZm9yIFwiICsgc3RhcnRTY2VuZS5uYW1lKVxuICBzdGFydFNjZW5lLnNldHVwKChlcnIpID0+IGNvbnNvbGUubG9nKFwic2V0dXAgY29tcGxldGVkXCIpKVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5wdXRNYW5hZ2VyXG5cbmNvbnN0IFNUQVRFX0xFTkdUSCA9IDNcbmNvbnN0IEtFWV9DT1VOVCAgICA9IDI1NlxuY29uc3QgUVVFVUVfTEVOR1RIID0gMjRcblxuLy9bdXAvZG93biwganVzdERvd24sIGp1c3RVcF1cbmxldCBpc0Rvd24gICAgICA9IChzdGF0ZXMsIGtleUNvZGUpID0+IHN0YXRlc1trZXlDb2RlKlNUQVRFX0xFTkdUSF1cbmxldCBqdXN0RG93biAgICA9IChzdGF0ZXMsIGtleUNvZGUpID0+IHN0YXRlc1trZXlDb2RlKlNUQVRFX0xFTkdUSCsxXVxubGV0IGp1c3RVcCAgICAgID0gKHN0YXRlcywga2V5Q29kZSkgPT4gc3RhdGVzW2tleUNvZGUqU1RBVEVfTEVOR1RIKzJdXG5sZXQgc2V0RG93biAgICAgPSAoc3RhdGVzLCBrZXlDb2RlLCB2YWwpID0+IHN0YXRlc1trZXlDb2RlKlNUQVRFX0xFTkdUSF0gPSB2YWxcbmxldCBzZXRKdXN0RG93biA9IChzdGF0ZXMsIGtleUNvZGUsIHZhbCkgPT4gc3RhdGVzW2tleUNvZGUqU1RBVEVfTEVOR1RIKzFdID0gdmFsXG5sZXQgc2V0SnVzdFVwICAgPSAoc3RhdGVzLCBrZXlDb2RlLCB2YWwpID0+IHN0YXRlc1trZXlDb2RlKlNUQVRFX0xFTkdUSCsyXSA9IHZhbFxubGV0IHNldFN0YXRlICAgID0gKHN0YXRlcywga2V5Q29kZSwgaXNEb3duLCBqdXN0RG93biwganVzdFVwKSA9PiB7XG4gIHN0YXRlc1trZXlDb2RlKlNUQVRFX0xFTkdUSF0gICA9IGlzRG93blxuICBzdGF0ZXNba2V5Q29kZSpTVEFURV9MRU5HVEgrMV0gPSBqdXN0RG93blxuICBzdGF0ZXNba2V5Q29kZSpTVEFURV9MRU5HVEgrMl0gPSBqdXN0VXBcbn1cblxuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChkb2N1bWVudCkge1xuICBsZXQgZG93blF1ZXVlICAgICA9IFtdXG4gIGxldCBqdXN0RG93blF1ZXVlID0gW11cbiAgbGV0IGp1c3RVcFF1ZXVlICAgPSBbXVxuICBsZXQgc3RhdGVzICAgICAgICA9IG5ldyBJbnQ4QXJyYXkoS0VZX0NPVU5UICogU1RBVEVfTEVOR1RIKVxuICBcbiAgbGV0IGhhbmRsZUtleURvd24gPSAoe2tleUNvZGV9KSA9PiB7XG4gICAgbGV0IGFscmVhZHlEb3duID0gaXNEb3duKHN0YXRlcywga2V5Q29kZSlcblxuICAgIHNldERvd24oc3RhdGVzLCBrZXlDb2RlLCAxKVxuICAgIGlmICghYWxyZWFkeURvd24pIHNldEp1c3REb3duKHN0YXRlcywga2V5Q29kZSwgMSlcbiAgfVxuXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcbiAgICBzZXREb3duKHN0YXRlcywga2V5Q29kZSwgMClcbiAgICBzZXRKdXN0VXAoc3RhdGVzLCBrZXlDb2RlLCAxKVxuICB9XG5cbiAgdGhpcy5zdGF0ZXMgICAgICAgID0gc3RhdGVzXG4gIHRoaXMuZG93blF1ZXVlICAgICA9IGRvd25RdWV1ZVxuICB0aGlzLmp1c3REb3duUXVldWUgPSBqdXN0RG93blF1ZXVlXG4gIHRoaXMuanVzdFVwUXVldWUgICA9IGp1c3RVcFF1ZXVlXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bilcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGhhbmRsZUtleVVwKVxufVxuXG5JbnB1dE1hbmFnZXIucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbiAoZFQpIHtcbiAgdGhpcy5kb3duUXVldWUgICAgID0gW11cbiAgdGhpcy5qdXN0RG93blF1ZXVlID0gW11cbiAgdGhpcy5qdXN0VXBRdWV1ZSAgID0gW11cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zdGF0ZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoaXNEb3duKHRoaXMuc3RhdGVzLCBpKSkgICB0aGlzLmRvd25RdWV1ZS5wdXNoKGkpXG4gICAgaWYgKGp1c3REb3duKHRoaXMuc3RhdGVzLCBpKSkgdGhpcy5qdXN0RG93blF1ZXVlLnB1c2goaSlcbiAgICBpZiAoanVzdFVwKHRoaXMuc3RhdGVzLCBpKSkgICB0aGlzLmp1c3RVcFF1ZXVlLnB1c2goaSlcbiAgICBzZXRKdXN0RG93bih0aGlzLnN0YXRlcywgaSwgMClcbiAgICBzZXRKdXN0VXAodGhpcy5zdGF0ZXMsIGksIDApXG4gIH0gICAgXG4gIGNvbnNvbGUubG9nKFwianVzdERvd25cIiwgdGhpcy5qdXN0RG93blF1ZXVlKVxufVxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcbiAgbGV0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dFxuXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICBpZiAoIXBhdGgpIHJldHVybiBjYihuZXcgRXJyb3IoXCJObyBwYXRoIHByb3ZpZGVkXCIpKVxuXG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0IFxuXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxuICAgICAgeGhyLm9ubG9hZCAgICAgICA9ICgpID0+IGNiKG51bGwsIHhoci5yZXNwb25zZSlcbiAgICAgIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcbiAgICAgIHhoci5zZW5kKG51bGwpXG4gICAgfSBcbiAgfVxuXG4gIGxldCBsb2FkQnVmZmVyID0gbG9hZFhIUihcImFycmF5YnVmZmVyXCIpXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxuXG4gIHRoaXMubG9hZFNoYWRlciA9IGxvYWRTdHJpbmdcblxuICB0aGlzLmxvYWRUZXh0dXJlID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbGV0IGkgICAgICAgPSBuZXcgSW1hZ2VcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXG4gICAgbGV0IG9uZXJyb3IgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICAgIFxuICAgIGkub25sb2FkICA9IG9ubG9hZFxuICAgIGkub25lcnJvciA9IG9uZXJyb3JcbiAgICBpLnNyYyAgICAgPSBwYXRoXG4gIH1cblxuICB0aGlzLmxvYWRTb3VuZCA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XG4gICAgICBsZXQgZGVjb2RlU3VjY2VzcyA9IChidWZmZXIpID0+IGNiKG51bGwsIGJ1ZmZlcikgICBcbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gY2JcblxuICAgICAgYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeSwgZGVjb2RlU3VjY2VzcywgZGVjb2RlRmFpbHVyZSlcbiAgICB9KSBcbiAgfVxuXG4gIHRoaXMubG9hZEFzc2V0cyA9ICh7c291bmRzLCB0ZXh0dXJlcywgc2hhZGVyc30sIGNiKSA9PiB7XG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcbiAgICBsZXQgdGV4dHVyZUtleXMgID0gT2JqZWN0LmtleXModGV4dHVyZXMgfHwge30pXG4gICAgbGV0IHNoYWRlcktleXMgICA9IE9iamVjdC5rZXlzKHNoYWRlcnMgfHwge30pXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcbiAgICBsZXQgdGV4dHVyZUNvdW50ID0gdGV4dHVyZUtleXMubGVuZ3RoXG4gICAgbGV0IHNoYWRlckNvdW50ICA9IHNoYWRlcktleXMubGVuZ3RoXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXG4gICAgbGV0IGogICAgICAgICAgICA9IC0xXG4gICAgbGV0IGsgICAgICAgICAgICA9IC0xXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcbiAgICAgIHNvdW5kczp7fSwgdGV4dHVyZXM6IHt9LCBzaGFkZXJzOiB7fSBcbiAgICB9XG5cbiAgICBsZXQgY2hlY2tEb25lID0gKCkgPT4ge1xuICAgICAgaWYgKHNvdW5kQ291bnQgPD0gMCAmJiB0ZXh0dXJlQ291bnQgPD0gMCAmJiBzaGFkZXJDb3VudCA8PSAwKSBjYihudWxsLCBvdXQpIFxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNvdW5kID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNvdW5kQ291bnQtLVxuICAgICAgb3V0LnNvdW5kc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyVGV4dHVyZSA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICB0ZXh0dXJlQ291bnQtLVxuICAgICAgb3V0LnRleHR1cmVzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTaGFkZXIgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc2hhZGVyQ291bnQtLVxuICAgICAgb3V0LnNoYWRlcnNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIHdoaWxlIChzb3VuZEtleXNbKytpXSkge1xuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxuXG4gICAgICB0aGlzLmxvYWRTb3VuZChzb3VuZHNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XG4gICAgICBsZXQga2V5ID0gdGV4dHVyZUtleXNbal1cblxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyVGV4dHVyZShrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAoc2hhZGVyS2V5c1srK2tdKSB7XG4gICAgICBsZXQga2V5ID0gc2hhZGVyS2V5c1trXVxuXG4gICAgICB0aGlzLmxvYWRTaGFkZXIoc2hhZGVyc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU2hhZGVyKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9hZGVyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyaW5nU3lzdGVtXG5cbmZ1bmN0aW9uIFJlbmRlcmluZ1N5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJyZW5kZXJhYmxlXCJdKVxufVxuXG4vL1RPRE86IFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlIHNjZW5lIHRoYXQgb3ducyB1cyFcbi8vYW5kIGJ5IGV4dGVuc2lvbiwgaWYgbmVlZGVkLCB3ZSB3aWxsIGhhdmUgYSByZWZlcmVuY2Vcbi8vdG8gdGhlIGdhbWUgaXRzZWxmXG5SZW5kZXJpbmdTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChlbnRpdGllcykge1xuICAvL2xldCB7cmVuZGVyZXJ9ID0gdGhpcy5zY2VuZS5nYW1lXG5cbiAgLy9yZW5kZXJlci5yZXNldCgpXG4gIC8vZW50aXRpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50aXR5KSB7XG4gIC8vICByZW5kZXJlci5hZGRTcHJpdGUoLy9wcm9wZXJ0aWVzIHRoYXQgaXQgY2FyZXMgYWJvdXQpIFxuICAvL30pICAgXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXG5cbi8qIEdBTUVcbiAqICAgIFJFTkRFUkVSXG4gKiAgICBBVURJTyBUSElOR1xuICogICAgSU5QVVQgVEhJTkdcbiAqICAgIEFTU0VUIExPQURFUlxuICogICAgQVNTRVQgQ0FDSEVcbiAqICAgIEVOVElUWSBTVE9SRSAtLSBhdCBzaW1wbGVzdCwgdGhpcyBpcyBhbiBhcnJheSBvZiBlbnRpdGllc1xuICogICAgU0NFTkVNQU5BR0VSXG4gKiAgICAgIFtTQ0VORVNdICAtLSBhbmFsb2dzIHRvIHByb2dyYW1zLiAgT25lIHByb2dyYW0gZXhlY3V0ZXMgYXQgYSB0aW1lXG4gKiAgICAgICAgU1lTVEVNU1xuICovXG5cbmZ1bmN0aW9uIFNjZW5lIChuYW1lLCBzeXN0ZW1zKSB7XG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXG5cbiAgdGhpcy5uYW1lICAgID0gbmFtZVxuICB0aGlzLnN5c3RlbXMgPSBzeXN0ZW1zXG4gIHRoaXMuZ2FtZSAgICA9IG51bGxcbn1cblxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XG4gIGNiKG51bGwsIG51bGwpICBcbn1cblxuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IHN5c3RlbVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXG4gICAgc3lzdGVtLnJ1bihzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxuICB9XG59XG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcblxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxuXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xuXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxuXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxuXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxuICB9XG5cbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxuXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXG5cbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXG59XG5cblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGVudGl0aWVzKSB7XG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XG59XG4iLCJsZXQge1BhZGRsZX0gPSByZXF1aXJlKFwiLi9hc3NlbWJsYWdlc1wiKVxubGV0IFJlbmRlcmluZ1N5c3RlbSA9IHJlcXVpcmUoXCIuL1JlbmRlcmluZ1N5c3RlbVwiKVxubGV0IFNjZW5lICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVGVzdFNjZW5lXG5cbmZ1bmN0aW9uIFRlc3RTY2VuZSAoKSB7XG4gIGxldCBzeXN0ZW1zID0gW25ldyBSZW5kZXJpbmdTeXN0ZW1dXG5cbiAgU2NlbmUuY2FsbCh0aGlzLCBcInRlc3RcIiwgc3lzdGVtcylcbn1cblxuVGVzdFNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2NlbmUucHJvdG90eXBlKVxuXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XG4gIGxldCB7Y2FjaGUsIGxvYWRlciwgZW50aXR5U3RvcmV9ID0gdGhpcy5nYW1lIFxuICBsZXQgYXNzZXRzID0ge1xuICAgIHRleHR1cmVzOiB7IHBhZGRsZTogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIgfSxcbiAgfVxuXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcblxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgUGFkZGxlKHRleHR1cmVzLnBhZGRsZSwgMTEyLCAyNSwgNDAwLCA0MDApKVxuICAgIGNiKG51bGwpXG4gIH0pXG59XG4iLCJsZXQge1JlbmRlcmFibGUsIFBoeXNpY3N9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IEVudGl0eSA9IHJlcXVpcmUoXCIuL0VudGl0eVwiKVxuXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgPSBQYWRkbGVcblxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5SZW5kZXJhYmxlID0gUmVuZGVyYWJsZVxubW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICA9IFBoeXNpY3NcblxuZnVuY3Rpb24gUmVuZGVyYWJsZSAoZSwgaW1hZ2UsIHdpZHRoLCBoZWlnaHQpIHtcbiAgZS5yZW5kZXJhYmxlID0ge1xuICAgIGltYWdlLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICByb3RhdGlvbjogMCxcbiAgICBjZW50ZXI6IHtcbiAgICAgIHg6IHdpZHRoIC8gMixcbiAgICAgIHk6IGhlaWdodCAvIDIgXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDEgXG4gICAgfVxuICB9IFxuICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XG4gIGUucGh5c2ljcyA9IHtcbiAgICB3aWR0aCwgXG4gICAgaGVpZ2h0LCBcbiAgICB4LCBcbiAgICB5LCBcbiAgICBkeDogIDAsIFxuICAgIGR5OiAgMCwgXG4gICAgZGR4OiAwLCBcbiAgICBkZHk6IDBcbiAgfVxuICByZXR1cm4gZVxufVxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXG5cbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IGZvdW5kID0gbnVsbFxuXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kXG59XG5cbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xuICBsZXQgaSA9IC0xXG4gIFxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXG59XG5cbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXG5mdW5jdGlvbiBTaGFkZXIgKGdsLCB0eXBlLCBzcmMpIHtcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxuICBcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcblxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXG5cbiAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgdmFsaWQgc2hhZGVyOiBcXG5cIiArIHNyYylcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XG4gIGxldCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSh2cywgZnMpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcbmZ1bmN0aW9uIFRleHR1cmUgKGdsKSB7XG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIHJldHVybiB0ZXh0dXJlXG59XG5cbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXG5tb2R1bGUuZXhwb3J0cy5UZXh0dXJlID0gVGV4dHVyZVxuIiwibGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxubGV0IFNjZW5lICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXG5sZXQgVGVzdFNjZW5lICAgID0gcmVxdWlyZShcIi4vVGVzdFNjZW5lXCIpXG5sZXQgR2FtZSAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxubGV0IElucHV0TWFuYWdlciA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxubGV0IGNhbnZhcyAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbmxldCB2ZXJ0ZXhTcmMgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZlcnRleFwiKS50ZXh0XG5sZXQgZnJhZ1NyYyAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcmFnbWVudFwiKS50ZXh0XG5cbi8vVEVTVElORyBGT1IgSU5QVVQgTUFOQUdFUlxubGV0IGltID0gbmV3IElucHV0TWFuYWdlcihkb2N1bWVudClcblxud2luZG93LmltID0gaW1cblxuXG4vL1RPRE86IHRlbXBvcmFyeSB2YWx1ZSBmb3IgaW5wdXQgdGVzdGluZ1xuLy9jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMTAwMFxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQgcmVuZGVyZXJPcHRzID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cbmxldCBlbnRpdHlTdG9yZSAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjYWNoZSAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXG5sZXQgbG9hZGVyICAgICAgID0gbmV3IExvYWRlclxubGV0IHJlbmRlcmVyICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgdmVydGV4U3JjLCBmcmFnU3JjLCByZW5kZXJlck9wdHMpXG5sZXQgc2NlbmVNYW5hZ2VyID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXG5sZXQgZ2FtZSAgICAgICAgID0gbmV3IEdhbWUoY2FjaGUsIGxvYWRlciwgcmVuZGVyZXIsIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpXG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gICAgaW0udGljaygpXG4gICAgZ2FtZS5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmUudXBkYXRlKClcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2FtZSkge1xuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXG4gIGxldCByICAgICAgICAgICAgICA9IGdhbWUucmVuZGVyZXJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cblxuICByZXR1cm4gZnVuY3Rpb24gYW5pbWF0ZSAoKSB7XG4gICAgbGV0IHJlbmRlcmFibGVzID0gc3RvcmUucXVlcnkoY29tcG9uZW50TmFtZXMpXG5cbiAgICByLnJlbmRlcihyZW5kZXJhYmxlcylcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgIFxuICB9XG59XG5cbndpbmRvdy5nYW1lID0gZ2FtZVxuXG5mdW5jdGlvbiBzZXR1cERvY3VtZW50IChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpIHtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIH0pXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgc2V0dXBEb2N1bWVudChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpXG4gIGdhbWUuc3RhcnQoKVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSksIFVQREFURV9JTlRFUlZBTClcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxuXG5mdW5jdGlvbiBjaGVja1R5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgY3RvcikpIHRocm93IG5ldyBFcnJvcihcIk11c3QgYmUgb2YgdHlwZSBcIiArIGN0b3IubmFtZSlcbn1cblxuZnVuY3Rpb24gY2hlY2tWYWx1ZVR5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSBjaGVja1R5cGUoaW5zdGFuY2Vba2V5c1tpXV0sIGN0b3IpXG59XG4iXX0=
