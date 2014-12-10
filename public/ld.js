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

function makeUpdate(game) {
  return function update() {
    //TODO: this?  hrmm
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvTG9hZGVyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FB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Q0FBQTs7Ozs7QUN6REYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQVEsU0FBUyxDQUFBO0FBQ3pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTs7QUFFOUMsU0FBUyxTQUFTLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUNsQyxNQUFJLENBQUMsQ0FBQyxRQUFRLFlBQVksSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDakY7O0FBRUQsU0FBUyxjQUFjLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUN2QyxNQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVoQyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0NBQ3pFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FjaGUgKGtleU5hbWVzKSB7XG4gIGlmICgha2V5TmFtZXMpIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBzb21lIGtleU5hbWVzXCIpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cbn1cbiIsIi8vdGhpcyBkb2VzIGxpdGVyYWxseSBub3RoaW5nLiAgaXQncyBhIHNoZWxsIHRoYXQgaG9sZHMgY29tcG9uZW50c1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbnRpdHkgKCkge31cbiIsImxldCB7aGFzS2V5c30gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdHlTdG9yZVxuXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAobWF4PTEwMDApIHtcbiAgdGhpcy5lbnRpdGllcyAgPSBbXVxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXG59XG5cbkVudGl0eVN0b3JlLnByb3RvdHlwZS5hZGRFbnRpdHkgPSBmdW5jdGlvbiAoZSkge1xuICBsZXQgaWQgPSB0aGlzLmVudGl0aWVzLmxlbmd0aFxuXG4gIHRoaXMuZW50aXRpZXMucHVzaChlKVxuICByZXR1cm4gaWRcbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKGNvbXBvbmVudE5hbWVzKSB7XG4gIGxldCBpID0gLTFcbiAgbGV0IGVudGl0eVxuXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cblxuICB3aGlsZSAodGhpcy5lbnRpdGllc1srK2ldKSB7XG4gICAgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxuICAgIGlmIChoYXNLZXlzKGNvbXBvbmVudE5hbWVzLCBlbnRpdHkpKSB0aGlzLmxhc3RRdWVyeS5wdXNoKGVudGl0eSlcbiAgIH1cbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XG59XG4iLCJsZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxuXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgeCwgeSwgdywgaCkge1xuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcbiAgbGV0IHgxID0geFxuICBsZXQgeTEgPSB5IFxuICBsZXQgeDIgPSB4ICsgd1xuICBsZXQgeTIgPSB5ICsgaFxuXG4gIGJveEFycmF5W2ldICAgID0geDFcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxuICBib3hBcnJheVtpKzJdICA9IHgyXG4gIGJveEFycmF5W2krM10gID0geTFcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxuICBib3hBcnJheVtpKzVdICA9IHkyXG5cbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxuICBib3hBcnJheVtpKzddICA9IHkyXG4gIGJveEFycmF5W2krOF0gID0geDJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxuICBib3hBcnJheVtpKzEwXSA9IHgyXG4gIGJveEFycmF5W2krMTFdID0geTJcbn1cblxuZnVuY3Rpb24gQm94QXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIFJvdGF0aW9uQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG59XG5cbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xuICAgIGFyW2ldICAgID0gMFxuICAgIGFyW2krMV0gID0gMFxuICAgIGFyW2krMl0gID0gMVxuICAgIGFyW2krM10gID0gMFxuICAgIGFyW2krNF0gID0gMFxuICAgIGFyW2krNV0gID0gMVxuXG4gICAgYXJbaSs2XSAgPSAwXG4gICAgYXJbaSs3XSAgPSAxXG4gICAgYXJbaSs4XSAgPSAxXG4gICAgYXJbaSs5XSAgPSAwXG4gICAgYXJbaSsxMF0gPSAxXG4gICAgYXJbaSsxMV0gPSAxXG4gIH0gXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcbiAgbGV0IHttYXhTcHJpdGVDb3VudCwgd2lkdGgsIGhlaWdodH0gPSBvcHRpb25zXG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IG1heFNwcml0ZUNvdW50IHx8IDEwMFxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxuICBsZXQgdnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICBsZXQgcHJvZ3JhbSAgICAgICAgPSBQcm9ncmFtKGdsLCB2cywgZnMpXG5cbiAgLy9pbmRleCBmb3IgdHJhY2tpbmcgdGhlIGN1cnJlbnQgYXZhaWxhYmxlIHBvc2l0aW9uIHRvIGluc3RhbnRpYXRlIGZyb21cbiAgbGV0IGZyZWVJbmRleCAgICAgPSAwXG4gIGxldCBhY3RpdmVTcHJpdGVzID0gMFxuXG4gIC8vdmlld3Mgb3ZlciBjcHUgYnVmZmVycyBmb3IgZGF0YVxuICBsZXQgYm94ZXMgICAgID0gQm94QXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCBjZW50ZXJzICAgPSBDZW50ZXJBcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHNjYWxlcyAgICA9IFNjYWxlQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCByb3RhdGlvbnMgPSBSb3RhdGlvbkFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgdGV4Q29vcmRzID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkobWF4U3ByaXRlQ291bnQpXG5cbiAgLy9oYW5kbGVzIHRvIEdQVSBidWZmZXJzXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcblxuICAvL1VuaWZvcm0gbG9jYXRpb25zXG4gIGxldCB3b3JsZFNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG5cbiAgLy9UT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBmb3IgdGVzdGluZyB0aGUgc2luZ2xlIHRleHR1cmUgY2FzZVxuICBsZXQgb25seVRleHR1cmUgPSBUZXh0dXJlKGdsKVxuICBsZXQgbG9hZGVkICAgICAgPSBmYWxzZVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG5cbiAgdGhpcy5kaW1lbnNpb25zID0ge1xuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXG4gICAgaGVpZ2h0OiBoZWlnaHQgfHwgMTA4MFxuICB9XG5cbiAgLy9UT0RPOiBUaGlzIHNob3VsZCBub3QgYmUgcHVibGljIGFwaS4gIGVudGl0aWVzIGNvbnRhaW4gcmVmZXJlbmNlc1xuICAvL3RvIHRoZWlyIGltYWdlIHdoaWNoIHNob3VsZCBiZSBXZWFrbWFwIHN0b3JlZCB3aXRoIGEgdGV4dHVyZSBhbmQgdXNlZFxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcbiAgICAvL1RPRE86IFRlbXBvcmFyeSB5dWNreSB0aGluZ1xuICAgIGxvYWRlZCA9IHRydWVcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKTsgXG4gIH1cblxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxuXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcbiAgfVxuXG4gIHRoaXMucmVuZGVyID0gKGVudGl0aWVzKSA9PiB7XG4gICAgLy9yZXNldCB0aGVzZSB2YWx1ZXMgb24gZXZlcnkgY2FsbD9cbiAgICBmcmVlSW5kZXggICAgID0gMFxuICAgIGFjdGl2ZVNwcml0ZXMgPSAwXG4gICAgd2luZG93LmJveGVzID0gYm94ZXNcblxuICAgIGlmICghbG9hZGVkICYmIGVudGl0aWVzWzBdKSB0aGlzLmFkZFRleHR1cmUoZW50aXRpZXNbMF0ucmVuZGVyYWJsZS5pbWFnZSlcblxuICAgIC8vVE9ETzogaW5pdGlhbCB2ZXJzaW9uIG9mIHRoaXMgbG9vcCB1c2VzIGNvbW1vbmx5IHNoYXJlZCBwYWRkbGUgdGV4dHVyZVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHNldEJveChcbiAgICAgICAgYm94ZXMsIFxuICAgICAgICBmcmVlSW5kZXgrKywgXG4gICAgICAgIGVudGl0aWVzW2ldLnBoeXNpY3MueCwgXG4gICAgICAgIGVudGl0aWVzW2ldLnBoeXNpY3MueSwgXG4gICAgICAgIGVudGl0aWVzW2ldLnJlbmRlcmFibGUud2lkdGgsXG4gICAgICAgIGVudGl0aWVzW2ldLnJlbmRlcmFibGUuaGVpZ2h0XG4gICAgICApXG4gICAgICBhY3RpdmVTcHJpdGVzKytcbiAgICB9XG5cbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG9ubHlUZXh0dXJlKVxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgYm94QnVmZmVyLCBib3hMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBib3hlcylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgY2VudGVyQnVmZmVyLCBjZW50ZXJMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBjZW50ZXJzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBzY2FsZUJ1ZmZlciwgc2NhbGVMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBzY2FsZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHJvdGF0aW9uQnVmZmVyLCByb3RMb2NhdGlvbiwgMSwgcm90YXRpb25zKVxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgdGV4Q29vcmRCdWZmZXIsIHRleENvb3JkTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgdGV4Q29vcmRzKVxuICAgIC8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXG4gICAgZ2wudW5pZm9ybTJmKHdvcmxkU2l6ZUxvY2F0aW9uLCAxOTIwLCAxMDgwKVxuICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBhY3RpdmVTcHJpdGVzICogUE9JTlRTX1BFUl9CT1gpXG4gIH1cbn1cbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5sZXQgTG9hZGVyICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZVxuXG4vLzo6IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxuZnVuY3Rpb24gR2FtZSAoY2FjaGUsIGxvYWRlciwgcmVuZGVyZXIsIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcbiAgY2hlY2tUeXBlKGxvYWRlciwgTG9hZGVyKVxuICBjaGVja1R5cGUocmVuZGVyZXIsIEdMUmVuZGVyZXIpXG4gIGNoZWNrVHlwZShlbnRpdHlTdG9yZSwgRW50aXR5U3RvcmUpXG4gIGNoZWNrVHlwZShzY2VuZU1hbmFnZXIsIFNjZW5lTWFuYWdlcilcblxuICB0aGlzLmNhY2hlICAgICAgICA9IGNhY2hlIFxuICB0aGlzLmxvYWRlciAgICAgICA9IGxvYWRlclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcblxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcbiAgfVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxuXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXG59XG5cbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xufVxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcbiAgbGV0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dFxuXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICBpZiAoIXBhdGgpIHJldHVybiBjYihuZXcgRXJyb3IoXCJObyBwYXRoIHByb3ZpZGVkXCIpKVxuXG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0IFxuXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxuICAgICAgeGhyLm9ubG9hZCAgICAgICA9ICgpID0+IGNiKG51bGwsIHhoci5yZXNwb25zZSlcbiAgICAgIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcbiAgICAgIHhoci5zZW5kKG51bGwpXG4gICAgfSBcbiAgfVxuXG4gIGxldCBsb2FkQnVmZmVyID0gbG9hZFhIUihcImFycmF5YnVmZmVyXCIpXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxuXG4gIHRoaXMubG9hZFNoYWRlciA9IGxvYWRTdHJpbmdcblxuICB0aGlzLmxvYWRUZXh0dXJlID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbGV0IGkgICAgICAgPSBuZXcgSW1hZ2VcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXG4gICAgbGV0IG9uZXJyb3IgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxuICAgIFxuICAgIGkub25sb2FkICA9IG9ubG9hZFxuICAgIGkub25lcnJvciA9IG9uZXJyb3JcbiAgICBpLnNyYyAgICAgPSBwYXRoXG4gIH1cblxuICB0aGlzLmxvYWRTb3VuZCA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XG4gICAgICBsZXQgZGVjb2RlU3VjY2VzcyA9IChidWZmZXIpID0+IGNiKG51bGwsIGJ1ZmZlcikgICBcbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gY2JcblxuICAgICAgYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeSwgZGVjb2RlU3VjY2VzcywgZGVjb2RlRmFpbHVyZSlcbiAgICB9KSBcbiAgfVxuXG4gIHRoaXMubG9hZEFzc2V0cyA9ICh7c291bmRzLCB0ZXh0dXJlcywgc2hhZGVyc30sIGNiKSA9PiB7XG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcbiAgICBsZXQgdGV4dHVyZUtleXMgID0gT2JqZWN0LmtleXModGV4dHVyZXMgfHwge30pXG4gICAgbGV0IHNoYWRlcktleXMgICA9IE9iamVjdC5rZXlzKHNoYWRlcnMgfHwge30pXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcbiAgICBsZXQgdGV4dHVyZUNvdW50ID0gdGV4dHVyZUtleXMubGVuZ3RoXG4gICAgbGV0IHNoYWRlckNvdW50ICA9IHNoYWRlcktleXMubGVuZ3RoXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXG4gICAgbGV0IGogICAgICAgICAgICA9IC0xXG4gICAgbGV0IGsgICAgICAgICAgICA9IC0xXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcbiAgICAgIHNvdW5kczp7fSwgdGV4dHVyZXM6IHt9LCBzaGFkZXJzOiB7fSBcbiAgICB9XG5cbiAgICBsZXQgY2hlY2tEb25lID0gKCkgPT4ge1xuICAgICAgaWYgKHNvdW5kQ291bnQgPD0gMCAmJiB0ZXh0dXJlQ291bnQgPD0gMCAmJiBzaGFkZXJDb3VudCA8PSAwKSBjYihudWxsLCBvdXQpIFxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNvdW5kID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNvdW5kQ291bnQtLVxuICAgICAgb3V0LnNvdW5kc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyVGV4dHVyZSA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICB0ZXh0dXJlQ291bnQtLVxuICAgICAgb3V0LnRleHR1cmVzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTaGFkZXIgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc2hhZGVyQ291bnQtLVxuICAgICAgb3V0LnNoYWRlcnNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIHdoaWxlIChzb3VuZEtleXNbKytpXSkge1xuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxuXG4gICAgICB0aGlzLmxvYWRTb3VuZChzb3VuZHNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XG4gICAgICBsZXQga2V5ID0gdGV4dHVyZUtleXNbal1cblxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyVGV4dHVyZShrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAoc2hhZGVyS2V5c1srK2tdKSB7XG4gICAgICBsZXQga2V5ID0gc2hhZGVyS2V5c1trXVxuXG4gICAgICB0aGlzLmxvYWRTaGFkZXIoc2hhZGVyc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU2hhZGVyKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9hZGVyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXG5cbmZ1bmN0aW9uIFNjZW5lIChuYW1lKSB7XG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXG5cbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLmdhbWUgPSBudWxsXG59XG5cblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChnYW1lLCBjYikge1xuICBjYihudWxsLCBudWxsKSAgXG59XG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZ2FtZSkge1xuICBjb25zb2xlLmxvZyhcInVwZGF0aW5nIHdvdywgcmVhbGx5IGltcHJlc3NpdmVcIikgIFxufVxuIiwibGV0IHtmaW5kV2hlcmV9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmVNYW5hZ2VyXG5cbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XG4gIGlmIChzY2VuZXMubGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBvbmUgb3IgbW9yZSBzY2VuZXNcIilcblxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcbiAgbGV0IHNjZW5lcyAgICAgICAgICAgPSBzY2VuZXNcblxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXG4gIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleF1cblxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcbiAgICBsZXQgc2NlbmUgPSBmaW5kV2hlcmUoXCJuYW1lXCIsIHNjZW5lTmFtZSwgc2NlbmVzKVxuXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcblxuICAgIGFjdGl2ZVNjZW5lSW5kZXggPSBzY2VuZXMuaW5kZXhPZihzY2VuZSlcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcbiAgfVxuXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleCArIDFdXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcblxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbKythY3RpdmVTY2VuZUluZGV4XVxuICB9XG59XG4iLCJsZXQge1BhZGRsZX0gPSByZXF1aXJlKFwiLi9hc3NlbWJsYWdlc1wiKVxubGV0IFNjZW5lID0gcmVxdWlyZShcIi4vU2NlbmVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcblxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcbiAgU2NlbmUuY2FsbCh0aGlzLCBcInRlc3RcIilcbn1cblxuVGVzdFNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2NlbmUucHJvdG90eXBlKVxuXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XG4gIGxldCB7Y2FjaGUsIGxvYWRlciwgZW50aXR5U3RvcmV9ID0gdGhpcy5nYW1lIFxuICBsZXQgYXNzZXRzID0ge1xuICAgIHRleHR1cmVzOiB7IHBhZGRsZTogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIgfSxcbiAgfVxuXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcblxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgUGFkZGxlKHRleHR1cmVzLnBhZGRsZSwgMTEyLCAyNSwgNDAwLCA0MDApKVxuICAgIGNiKG51bGwpXG4gIH0pXG59XG4iLCJsZXQge1JlbmRlcmFibGUsIFBoeXNpY3N9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IEVudGl0eSA9IHJlcXVpcmUoXCIuL0VudGl0eVwiKVxuXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgPSBQYWRkbGVcblxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5SZW5kZXJhYmxlID0gUmVuZGVyYWJsZVxubW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICA9IFBoeXNpY3NcblxuZnVuY3Rpb24gUmVuZGVyYWJsZSAoZSwgaW1hZ2UsIHdpZHRoLCBoZWlnaHQpIHtcbiAgZS5yZW5kZXJhYmxlID0ge1xuICAgIGltYWdlLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICByb3RhdGlvbjogMCxcbiAgICBjZW50ZXI6IHtcbiAgICAgIHg6IHdpZHRoIC8gMixcbiAgICAgIHk6IGhlaWdodCAvIDIgXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDEgXG4gICAgfVxuICB9IFxuICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XG4gIGUucGh5c2ljcyA9IHtcbiAgICB3aWR0aCwgXG4gICAgaGVpZ2h0LCBcbiAgICB4LCBcbiAgICB5LCBcbiAgICBkeDogIDAsIFxuICAgIGR5OiAgMCwgXG4gICAgZGR4OiAwLCBcbiAgICBkZHk6IDBcbiAgfVxuICByZXR1cm4gZVxufVxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXG5cbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IGZvdW5kID0gbnVsbFxuXG4gIHdoaWxlICggKytpIDwgbGVuICYmICFmb3VuZCkge1xuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cblxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XG4gIGxldCBpID0gLTFcbiAgXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcbn1cbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbn1cblxubW9kdWxlLmV4cG9ydHMudXBkYXRlQnVmZmVyID0gdXBkYXRlQnVmZmVyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xuICBsZXQgc2hhZGVyICA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKVxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXG4gIFxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuXG4gIGlzVmFsaWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUylcblxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgc3JjKVxuICByZXR1cm4gICAgICAgIHNoYWRlclxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBWZXJ0ZXhTaGFkZXIgLT4gRnJhZ21lbnRTaGFkZXJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcblxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcbiAgbGV0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG5cbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgcmV0dXJuIHRleHR1cmVcbn1cblxubW9kdWxlLmV4cG9ydHMuU2hhZGVyICA9IFNoYWRlclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXG4iLCJsZXQgTG9hZGVyICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5sZXQgU2NlbmUgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcbmxldCBUZXN0U2NlbmUgICAgPSByZXF1aXJlKFwiLi9UZXN0U2NlbmVcIilcbmxldCBHYW1lICAgICAgICAgPSByZXF1aXJlKFwiLi9HYW1lXCIpXG5sZXQgY2FudmFzICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxubGV0IHZlcnRleFNyYyAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmVydGV4XCIpLnRleHRcbmxldCBmcmFnU3JjICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZyYWdtZW50XCIpLnRleHRcblxuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMjVcbmNvbnN0IE1BWF9DT1VOVCAgICAgICA9IDEwMDBcblxubGV0IHJlbmRlcmVyT3B0cyA9IHsgbWF4U3ByaXRlQ291bnQ6IE1BWF9DT1VOVCB9XG5sZXQgZW50aXR5U3RvcmUgID0gbmV3IEVudGl0eVN0b3JlXG5sZXQgY2FjaGUgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxubGV0IGxvYWRlciAgICAgICA9IG5ldyBMb2FkZXJcbmxldCByZW5kZXJlciAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIHZlcnRleFNyYywgZnJhZ1NyYywgcmVuZGVyZXJPcHRzKVxubGV0IHNjZW5lTWFuYWdlciA9IG5ldyBTY2VuZU1hbmFnZXIoW25ldyBUZXN0U2NlbmVdKVxubGV0IGdhbWUgICAgICAgICA9IG5ldyBHYW1lKGNhY2hlLCBsb2FkZXIsIHJlbmRlcmVyLCBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKVxuXG5mdW5jdGlvbiBtYWtlVXBkYXRlIChnYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIC8vVE9ETzogdGhpcz8gIGhybW1cbiAgICBnYW1lLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZS51cGRhdGUoKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XG4gIGxldCBzdG9yZSAgICAgICAgICA9IGdhbWUuZW50aXR5U3RvcmVcbiAgbGV0IHIgICAgICAgICAgICAgID0gZ2FtZS5yZW5kZXJlclxuICBsZXQgY29tcG9uZW50TmFtZXMgPSBbXCJyZW5kZXJhYmxlXCIsIFwicGh5c2ljc1wiXVxuXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICBsZXQgcmVuZGVyYWJsZXMgPSBzdG9yZS5xdWVyeShjb21wb25lbnROYW1lcylcblxuICAgIHIucmVuZGVyKHJlbmRlcmFibGVzKVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSAgXG4gIH1cbn1cblxud2luZG93LmdhbWUgPSBnYW1lXG5cbmZ1bmN0aW9uIHNldHVwRG9jdW1lbnQgKGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdykge1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgfSlcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuICBzZXR1cERvY3VtZW50KGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdylcbiAgZ2FtZS5zdGFydCgpXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxuXG5mdW5jdGlvbiBjaGVja1R5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgY3RvcikpIHRocm93IG5ldyBFcnJvcihcIk11c3QgYmUgb2YgdHlwZSBcIiArIGN0b3IubmFtZSlcbn1cblxuZnVuY3Rpb24gY2hlY2tWYWx1ZVR5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSBjaGVja1R5cGUoaW5zdGFuY2Vba2V5c1tpXV0sIGN0b3IpXG59XG4iXX0=
