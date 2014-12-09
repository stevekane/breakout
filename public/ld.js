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

},{"./functions":12}],4:[function(require,module,exports){
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

  //TODO: Super dirty and possibly not robust...
  this.addTexture = function (image) {
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };

  //TODO: stupid.  temporary and will be removed from API
  this.addSprite = function (x, y, w, h) {
    setBox(boxes, freeIndex++, x, y, w, h);
    activeSprites++;
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

  this.render = function (entities) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture);
    updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes);
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, texCoords);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080);
    gl.drawArrays(gl.TRIANGLES, 0, activeSprites * POINTS_PER_BOX);
  };
}

},{"./gl-buffer":13,"./gl-types":14}],5:[function(require,module,exports){
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

},{"./Cache":1,"./EntityStore-Simple":3,"./GLRenderer":4,"./Loader":6,"./SceneManager":8,"./utils":16}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
"use strict";

module.exports = Scene;

function Scene(name) {
  if (!name) throw new Error("Scene constructor requires a name");

  this.name = name;
  this.game = null;
}

Scene.prototype.setup = function (game, cb) {
  cb(null, null);
};

Scene.prototype.update = function (game) {
  console.log("updating wow, really impressive");
};

},{}],8:[function(require,module,exports){
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

},{"./functions":12}],9:[function(require,module,exports){
"use strict";

var _ref = require("./assemblages");

var Paddle = _ref.Paddle;
var Scene = require("./Scene");

module.exports = TestScene;

function TestScene() {
  Scene.call(this, "test");
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

},{"./Scene":7,"./assemblages":10}],10:[function(require,module,exports){
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

},{"./Entity":2,"./components":11}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
"use strict";

module.exports.findWhere = findWhere;
module.exports.hasKeys = hasKeys;

//:: [{}] -> String -> Maybe A
function findWhere(key, property, arrayOfObjects) {
  var len = arrayOfObjects.length;
  var i = -1;
  var found = null;

  while (++i < len && !found) {
    if (arrayOfObjects[i][key] === property) {
      found = arrayOfObjects[i];
    }
  }
  return found;
}

function hasKeys(keys, obj) {
  var i = -1;

  while (keys[++i]) if (!obj[keys[i]]) return false;
  return true;
}

},{}],13:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
"use strict";

var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var EntityStore = require("./EntityStore-Simple");
var Cache = require("./Cache");
var SceneManager = require("./SceneManager");
var Scene = require("./Scene");
var TestScene = require("./TestScene");
var Game = require("./Game");
var canvas = document.createElement("canvas");
var vertexSrc = document.getElementById("vertex").text;
var fragSrc = document.getElementById("fragment").text;

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var rendererOpts = { maxSpriteCount: MAX_COUNT };
var entityStore = new EntityStore();
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts);
var sceneManager = new SceneManager([new TestScene()]);
var game = new Game(cache, loader, renderer, entityStore, sceneManager);

function makeUpdate() {
  return function update() {};
}

function makeAnimate() {
  return function animate() {
    renderer.render();
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
});

},{"./Cache":1,"./EntityStore-Simple":3,"./GLRenderer":4,"./Game":5,"./Loader":6,"./Scene":7,"./SceneManager":8,"./TestScene":9}],16:[function(require,module,exports){
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

},{}]},{},[15])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvTG9hZGVyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FB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LENBQUE7R0FDdkQsQ0FBQyxDQUFBO0NBQ0g7O0FBRUQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLFlBQVk7QUFDeEQsZUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDdkMsTUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO0NBQ2IsQ0FBQyxDQUFBOzs7OztBQy9DRixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBUSxTQUFTLENBQUE7QUFDekMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFBOztBQUU5QyxTQUFTLFNBQVMsQ0FBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0FBQ2xDLE1BQUksQ0FBQyxDQUFDLFFBQVEsWUFBWSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUNqRjs7QUFFRCxTQUFTLGNBQWMsQ0FBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLE1BQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7O0FBRWhDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlOYW1lcy5sZW5ndGg7ICsraSkgdGhpc1trZXlOYW1lc1tpXV0gPSB7fVxufVxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXG5cbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xuICB0aGlzLmVudGl0aWVzICA9IFtdXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXG4gIHJldHVybiBpZFxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcbiAgbGV0IGkgPSAtMVxuICBsZXQgZW50aXR5XG5cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxuXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxuICAgfVxuICByZXR1cm4gdGhpcy5sYXN0UXVlcnlcbn1cbiIsImxldCB7U2hhZGVyLCBQcm9ncmFtLCBUZXh0dXJlfSA9IHJlcXVpcmUoXCIuL2dsLXR5cGVzXCIpXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBHTFJlbmRlcmVyXG5cbmNvbnN0IFBPSU5UX0RJTUVOU0lPTiA9IDJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICA9IDZcbmNvbnN0IEJPWF9MRU5HVEggICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXG5cbmZ1bmN0aW9uIHNldEJveCAoYm94QXJyYXksIGluZGV4LCB4LCB5LCB3LCBoKSB7XG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxuICBsZXQgeDEgPSB4XG4gIGxldCB5MSA9IHkgXG4gIGxldCB4MiA9IHggKyB3XG4gIGxldCB5MiA9IHkgKyBoXG5cbiAgYm94QXJyYXlbaV0gICAgPSB4MVxuICBib3hBcnJheVtpKzFdICA9IHkxXG4gIGJveEFycmF5W2krMl0gID0geDJcbiAgYm94QXJyYXlbaSszXSAgPSB5MVxuICBib3hBcnJheVtpKzRdICA9IHgxXG4gIGJveEFycmF5W2krNV0gID0geTJcblxuICBib3hBcnJheVtpKzZdICA9IHgxXG4gIGJveEFycmF5W2krN10gID0geTJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxuICBib3hBcnJheVtpKzldICA9IHkxXG4gIGJveEFycmF5W2krMTBdID0geDJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MlxufVxuXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBDZW50ZXJBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBQT0lOVFNfUEVSX0JPWClcbn1cblxuZnVuY3Rpb24gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgaSArPSBCT1hfTEVOR1RIKSB7XG4gICAgYXJbaV0gICAgPSAwXG4gICAgYXJbaSsxXSAgPSAwXG4gICAgYXJbaSsyXSAgPSAxXG4gICAgYXJbaSszXSAgPSAwXG4gICAgYXJbaSs0XSAgPSAwXG4gICAgYXJbaSs1XSAgPSAxXG5cbiAgICBhcltpKzZdICA9IDBcbiAgICBhcltpKzddICA9IDFcbiAgICBhcltpKzhdICA9IDFcbiAgICBhcltpKzldICA9IDBcbiAgICBhcltpKzEwXSA9IDFcbiAgICBhcltpKzExXSA9IDFcbiAgfSBcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIEdMUmVuZGVyZXIgKGNhbnZhcywgdlNyYywgZlNyYywgb3B0aW9ucz17fSkge1xuICBsZXQge21heFNwcml0ZUNvdW50LCB3aWR0aCwgaGVpZ2h0fSA9IG9wdGlvbnNcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gbWF4U3ByaXRlQ291bnQgfHwgMTAwXG4gIGxldCB2aWV3ICAgICAgICAgICA9IGNhbnZhc1xuICBsZXQgZ2wgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpICAgICAgXG4gIGxldCB2cyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcbiAgbGV0IGZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZTcmMpXG4gIGxldCBwcm9ncmFtICAgICAgICA9IFByb2dyYW0oZ2wsIHZzLCBmcylcblxuICAvL2luZGV4IGZvciB0cmFja2luZyB0aGUgY3VycmVudCBhdmFpbGFibGUgcG9zaXRpb24gdG8gaW5zdGFudGlhdGUgZnJvbVxuICBsZXQgZnJlZUluZGV4ICAgICA9IDBcbiAgbGV0IGFjdGl2ZVNwcml0ZXMgPSAwXG5cbiAgLy92aWV3cyBvdmVyIGNwdSBidWZmZXJzIGZvciBkYXRhXG4gIGxldCBib3hlcyAgICAgPSBCb3hBcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IGNlbnRlcnMgICA9IENlbnRlckFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgc2NhbGVzICAgID0gU2NhbGVBcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHJvdGF0aW9ucyA9IFJvdGF0aW9uQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCB0ZXhDb29yZHMgPSBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheShtYXhTcHJpdGVDb3VudClcblxuICAvL2hhbmRsZXMgdG8gR1BVIGJ1ZmZlcnNcbiAgbGV0IGJveEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IGNlbnRlckJ1ZmZlciAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHJvdGF0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcblxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcbiAgLy9sZXQgcm90TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9yb3RhdGlvblwiKVxuICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV90ZXhDb29yZFwiKVxuXG4gIC8vVW5pZm9ybSBsb2NhdGlvbnNcbiAgbGV0IHdvcmxkU2l6ZUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV93b3JsZFNpemVcIilcblxuICAvL1RPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGZvciB0ZXN0aW5nIHRoZSBzaW5nbGUgdGV4dHVyZSBjYXNlXG4gIGxldCBvbmx5VGV4dHVyZSA9IFRleHR1cmUoZ2wpXG5cbiAgZ2wuZW5hYmxlKGdsLkJMRU5EKVxuICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKVxuICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDAuMClcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXG4gIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSlcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcblxuICB0aGlzLmRpbWVuc2lvbnMgPSB7XG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcbiAgICBoZWlnaHQ6IGhlaWdodCB8fCAxMDgwXG4gIH1cblxuICAvL1RPRE86IFN1cGVyIGRpcnR5IGFuZCBwb3NzaWJseSBub3Qgcm9idXN0Li4uXG4gIHRoaXMuYWRkVGV4dHVyZSA9IChpbWFnZSkgPT4ge1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG9ubHlUZXh0dXJlKVxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpOyBcbiAgfVxuXG4gIC8vVE9ETzogc3R1cGlkLiAgdGVtcG9yYXJ5IGFuZCB3aWxsIGJlIHJlbW92ZWQgZnJvbSBBUElcbiAgdGhpcy5hZGRTcHJpdGUgPSAoeCwgeSwgdywgaCkgPT4ge1xuICAgIHNldEJveChib3hlcywgZnJlZUluZGV4KyssIHgsIHksIHcsIGgpXG4gICAgYWN0aXZlU3ByaXRlcysrXG4gIH1cblxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxuXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcbiAgfVxuXG4gIHRoaXMucmVuZGVyID0gKGVudGl0aWVzKSA9PiB7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCB0ZXhDb29yZHMpXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplTG9jYXRpb24sIDE5MjAsIDEwODApXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGFjdGl2ZVNwcml0ZXMgKiBQT0lOVFNfUEVSX0JPWClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXG5cbi8vOjogQ2FjaGUgLT4gTG9hZGVyIC0+IEdMUmVuZGVyZXIgLT4gRW50aXR5U3RvcmUgLT4gU2NlbmVNYW5hZ2VyXG5mdW5jdGlvbiBHYW1lIChjYWNoZSwgbG9hZGVyLCByZW5kZXJlciwgZW50aXR5U3RvcmUsIHNjZW5lTWFuYWdlcikge1xuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXG4gIHRoaXMucmVuZGVyZXIgICAgID0gcmVuZGVyZXJcbiAgdGhpcy5lbnRpdHlTdG9yZSAgPSBlbnRpdHlTdG9yZVxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxuXG4gIC8vSW50cm9kdWNlIGJpLWRpcmVjdGlvbmFsIHJlZmVyZW5jZSB0byBnYW1lIG9iamVjdCBvbnRvIGVhY2ggc2NlbmVcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lc1tpXS5nYW1lID0gdGhpc1xuICB9XG59XG5cbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXG5cbiAgY29uc29sZS5sb2coXCJjYWxsaW5nIHNldHVwIGZvciBcIiArIHN0YXJ0U2NlbmUubmFtZSlcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcbn1cblxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgLy93aGF0IGRvZXMgdGhpcyBldmVuIG1lYW4/XG59XG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XG5cbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXG5cbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXG5cbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICAgICAgeGhyLnNlbmQobnVsbClcbiAgICB9IFxuICB9XG5cbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXG5cbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xuXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxuICAgIGkuc3JjICAgICA9IHBhdGhcbiAgfVxuXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pIFxuICB9XG5cbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzIHx8IHt9KVxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycyB8fCB7fSlcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxuICAgIH1cblxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc291bmRDb3VudC0tXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHRleHR1cmVDb3VudC0tXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzaGFkZXJDb3VudC0tXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXG5cbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxuXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXG5cbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcbiIsIm1vZHVsZS5leHBvcnRzID0gU2NlbmVcblxuZnVuY3Rpb24gU2NlbmUgKG5hbWUpIHtcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWVcIilcblxuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMuZ2FtZSA9IG51bGxcbn1cblxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGdhbWUsIGNiKSB7XG4gIGNiKG51bGwsIG51bGwpICBcbn1cblxuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChnYW1lKSB7XG4gIGNvbnNvbGUubG9nKFwidXBkYXRpbmcgd293LCByZWFsbHkgaW1wcmVzc2l2ZVwiKSAgXG59XG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcblxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxuXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xuXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxuXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxuXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxuICB9XG5cbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxuXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXG4gIH1cbn1cbiIsImxldCB7UGFkZGxlfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXG5sZXQgU2NlbmUgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxuXG5mdW5jdGlvbiBUZXN0U2NlbmUgKCkge1xuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiKVxufVxuXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXG5cblRlc3RTY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZX0gPSB0aGlzLmdhbWUgXG4gIGxldCBhc3NldHMgPSB7XG4gICAgdGV4dHVyZXM6IHsgcGFkZGxlOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIiB9LFxuICB9XG5cbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxuXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBQYWRkbGUodGV4dHVyZXMucGFkZGxlLCAxMTIsIDI1LCA0MDAsIDQwMCkpXG4gICAgY2IobnVsbClcbiAgfSlcbn1cbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljc30gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQgRW50aXR5ID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXG5cbm1vZHVsZS5leHBvcnRzLlBhZGRsZSA9IFBhZGRsZVxuXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzLlJlbmRlcmFibGUgPSBSZW5kZXJhYmxlXG5tb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgID0gUGh5c2ljc1xuXG5mdW5jdGlvbiBSZW5kZXJhYmxlIChlLCBpbWFnZSwgd2lkdGgsIGhlaWdodCkge1xuICBlLnJlbmRlcmFibGUgPSB7XG4gICAgaW1hZ2UsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIHJvdGF0aW9uOiAwLFxuICAgIGNlbnRlcjoge1xuICAgICAgeDogd2lkdGggLyAyLFxuICAgICAgeTogaGVpZ2h0IC8gMiBcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiAxLFxuICAgICAgeTogMSBcbiAgICB9XG4gIH0gXG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgZS5waHlzaWNzID0ge1xuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHgsIFxuICAgIHksIFxuICAgIGR4OiAgMCwgXG4gICAgZHk6ICAwLCBcbiAgICBkZHg6IDAsIFxuICAgIGRkeTogMFxuICB9XG4gIHJldHVybiBlXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcblxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XG4gIGxldCBsZW4gICA9IGFycmF5T2ZPYmplY3RzLmxlbmd0aFxuICBsZXQgaSAgICAgPSAtMVxuICBsZXQgZm91bmQgPSBudWxsXG5cbiAgd2hpbGUgKCArK2kgPCBsZW4gJiYgIWZvdW5kKSB7XG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XG4gICAgICBmb3VuZCA9IGFycmF5T2ZPYmplY3RzW2ldXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuXG5mdW5jdGlvbiBoYXNLZXlzIChrZXlzLCBvYmopIHtcbiAgbGV0IGkgPSAtMVxuICBcbiAgd2hpbGUgKGtleXNbKytpXSkgaWYgKCFvYmpba2V5c1tpXV0pIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxufVxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gQnVmZmVyIC0+IEludCAtPiBJbnQgLT4gRmxvYXQzMkFycmF5XG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxufVxuXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcbiAgXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG5cbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxuXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBzcmMpXG4gIHJldHVybiAgICAgICAgc2hhZGVyXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcblxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuICByZXR1cm4gdGV4dHVyZVxufVxuXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcbiIsImxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcbmxldCBTY2VuZSAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxubGV0IFRlc3RTY2VuZSAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxubGV0IEdhbWUgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcbmxldCBjYW52YXMgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG5sZXQgdmVydGV4U3JjICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJ0ZXhcIikudGV4dFxubGV0IGZyYWdTcmMgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJhZ21lbnRcIikudGV4dFxuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQgcmVuZGVyZXJPcHRzID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cbmxldCBlbnRpdHlTdG9yZSAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjYWNoZSAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXG5sZXQgbG9hZGVyICAgICAgID0gbmV3IExvYWRlclxubGV0IHJlbmRlcmVyICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgdmVydGV4U3JjLCBmcmFnU3JjLCByZW5kZXJlck9wdHMpXG5sZXQgc2NlbmVNYW5hZ2VyID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXG5sZXQgZ2FtZSAgICAgICAgID0gbmV3IEdhbWUoY2FjaGUsIGxvYWRlciwgcmVuZGVyZXIsIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpXG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKCkge1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHt9XG59XG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIHJlbmRlcmVyLnJlbmRlcigpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcbiAgfVxufVxuXG53aW5kb3cuZ2FtZSA9IGdhbWVcblxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxuICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB9KVxufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxuICBnYW1lLnN0YXJ0KClcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxuXG5mdW5jdGlvbiBjaGVja1R5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgY3RvcikpIHRocm93IG5ldyBFcnJvcihcIk11c3QgYmUgb2YgdHlwZSBcIiArIGN0b3IubmFtZSlcbn1cblxuZnVuY3Rpb24gY2hlY2tWYWx1ZVR5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSBjaGVja1R5cGUoaW5zdGFuY2Vba2V5c1tpXV0sIGN0b3IpXG59XG4iXX0=
