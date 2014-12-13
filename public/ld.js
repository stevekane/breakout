(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";

module.exports = function Cache(keyNames) {
  if (!keyNames) throw new Error("Must provide some keyNames");
  for (var i = 0; i < keyNames.length; ++i) this[keyNames[i]] = {};
};

},{}],3:[function(require,module,exports){
"use strict";

//this does literally nothing.  it's a shell that holds components
module.exports = function Entity() {};

},{}],4:[function(require,module,exports){
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

},{"./functions":16}],5:[function(require,module,exports){
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

},{"./gl-buffer":17,"./gl-types":18}],6:[function(require,module,exports){
"use strict";

var _ref = require("./utils");

var checkType = _ref.checkType;
var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var AudioSystem = require("./AudioSystem");
var Cache = require("./Cache");
var EntityStore = require("./EntityStore-Simple");
var SceneManager = require("./SceneManager");

module.exports = Game;

//:: Cache -> Loader -> GLRenderer -> AudioSystem -> EntityStore -> SceneManager
function Game(cache, loader, renderer, audioSystem, entityStore, sceneManager) {
  checkType(cache, Cache);
  checkType(loader, Loader);
  checkType(renderer, GLRenderer);
  checkType(audioSystem, AudioSystem);
  checkType(entityStore, EntityStore);
  checkType(sceneManager, SceneManager);

  this.cache = cache;
  this.loader = loader;
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

},{"./AudioSystem":1,"./Cache":2,"./EntityStore-Simple":4,"./GLRenderer":5,"./Loader":8,"./SceneManager":11,"./utils":20}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./System":12}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"./functions":16}],12:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

System.prototype.run = function (entities) {};

},{}],13:[function(require,module,exports){
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
  var audioSystem = this.game.audioSystem;
  var bg = audioSystem.channels.bg;
  var assets = {
    sounds: { bgMusic: "/public/sounds/bgm1.mp3" },
    textures: { paddle: "/public/spritesheets/paddle.png" }
  };

  loader.loadAssets(assets, function (err, loadedAssets) {
    var textures = loadedAssets.textures;
    var sounds = loadedAssets.sounds;


    window.bg = bg;

    cache.sounds = sounds;
    cache.textures = textures;
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400));
    bg.volume = 0.1;
    bg.loop(cache.sounds.bgMusic);
    cb(null);
  });
};

},{"./RenderingSystem":9,"./Scene":10,"./assemblages":14}],14:[function(require,module,exports){
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

},{"./Entity":3,"./components":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
"use strict";

var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var EntityStore = require("./EntityStore-Simple");
var Cache = require("./Cache");
var SceneManager = require("./SceneManager");
var Scene = require("./Scene");
var TestScene = require("./TestScene");
var Game = require("./Game");
var KeyboardManager = require("./KeyboardManager");
var AudioSystem = require("./AudioSystem");
var canvas = document.createElement("canvas");
var vertexSrc = document.getElementById("vertex").text;
var fragSrc = document.getElementById("fragment").text;

//TESTING FOR INPUT MANAGER
var kbManager = new KeyboardManager(document);

window.kbManager = kbManager;

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var rendererOpts = { maxSpriteCount: MAX_COUNT };
var entityStore = new EntityStore();
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts);
var audioSystem = new AudioSystem(["main", "bg"]);
var sceneManager = new SceneManager([new TestScene()]);
var game = new Game(cache, loader, renderer, audioSystem, entityStore, sceneManager);

function makeUpdate(game) {
  var store = game.entityStore;
  var newTime = Date.now();
  var oldTime = newTime;
  var dT = newTime - oldTime;
  var componentNames = ["renderable", "physics"];

  return function update() {
    var moveSpeed = 1;
    var paddle = store.query(componentNames)[0];

    oldTime = newTime;
    newTime = Date.now();
    dT = newTime - oldTime;

    if (kbManager.isDowns[37]) paddle.physics.x -= dT * moveSpeed;
    if (kbManager.isDowns[39]) paddle.physics.x += dT * moveSpeed;
    kbManager.tick(dT);
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

},{"./AudioSystem":1,"./Cache":2,"./EntityStore-Simple":4,"./GLRenderer":5,"./Game":6,"./KeyboardManager":7,"./Loader":8,"./Scene":10,"./SceneManager":11,"./TestScene":13}],20:[function(require,module,exports){
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

},{}]},{},[19])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BdWRpb1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2FjaGUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9LZXlib2FyZE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9TY2VuZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmVNYW5hZ2VyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1Rlc3RTY2VuZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvYXNzZW1ibGFnZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2NvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Z1bmN0aW9ucy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtYnVmZmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9nbC10eXBlcy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvbGQuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxTQUFTLE9BQU8sQ0FBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQy9CLE1BQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQTs7QUFFbEMsTUFBSSxhQUFhLEdBQUcsVUFBVSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUMvQyxPQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ25CLFVBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7R0FDckIsQ0FBQTs7QUFFRCxNQUFJLFFBQVEsR0FBRyxVQUFVLE9BQU8sRUFBSztRQUFaLE9BQU8sZ0JBQVAsT0FBTyxHQUFDLEVBQUU7QUFDakMsUUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUE7O0FBRXRDLFdBQU8sVUFBVSxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQy9CLFVBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTs7QUFFOUMsVUFBSSxNQUFNLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUEsS0FDbkMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTs7QUFFaEMsU0FBRyxDQUFDLElBQUksR0FBSyxVQUFVLENBQUE7QUFDdkIsU0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDbkIsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNaLGFBQU8sR0FBRyxDQUFBO0tBQ1gsQ0FBQTtHQUNGLENBQUE7O0FBRUQsU0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBRXBDLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxjQUFVLEVBQUUsSUFBSTtBQUNoQixPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUE7S0FBRTtBQUNuQyxPQUFHLEVBQUEsVUFBQyxLQUFLLEVBQUU7QUFBRSxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7S0FBRTtHQUMxQyxDQUFDLENBQUE7O0FBRUYsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xDLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxPQUFPLENBQUE7S0FBRTtHQUN6QixDQUFDLENBQUE7O0FBRUYsTUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7QUFDaEIsTUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtBQUNsQyxNQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsRUFBRSxDQUFBO0NBQ3ZCOztBQUVELFNBQVMsV0FBVyxDQUFFLFlBQVksRUFBRTtBQUNsQyxNQUFJLE9BQU8sR0FBSSxJQUFJLFlBQVksRUFBQSxDQUFBO0FBQy9CLE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNqQixNQUFJLENBQUMsR0FBVSxDQUFDLENBQUMsQ0FBQTs7QUFFakIsU0FBTyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUN4QixZQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2xFO0FBQ0QsTUFBSSxDQUFDLE9BQU8sR0FBSSxPQUFPLENBQUE7QUFDdkIsTUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7Q0FDekI7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUE7Ozs7O0FDdEQ1QixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsS0FBSyxDQUFFLFFBQVEsRUFBRTtBQUN6QyxNQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtBQUM1RCxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ2pFLENBQUE7Ozs7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxNQUFNLEdBQUksRUFBRSxDQUFBOzs7OztXQ0R0QixPQUFPLENBQUMsYUFBYSxDQUFDOztJQUFqQyxPQUFPLFFBQVAsT0FBTzs7O0FBRVosTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUE7O0FBRTVCLFNBQVMsV0FBVyxDQUFFLEdBQUcsRUFBTztNQUFWLEdBQUcsZ0JBQUgsR0FBRyxHQUFDLElBQUk7QUFDNUIsTUFBSSxDQUFDLFFBQVEsR0FBSSxFQUFFLENBQUE7QUFDbkIsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7Q0FDcEI7O0FBRUQsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLEVBQUU7QUFDN0MsTUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUE7O0FBRTdCLE1BQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3JCLFNBQU8sRUFBRSxDQUFBO0NBQ1YsQ0FBQTs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFVLGNBQWMsRUFBRTtBQUN0RCxNQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNWLE1BQUksTUFBTSxDQUFBOztBQUVWLE1BQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBOztBQUVuQixTQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUN6QixVQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN6QixRQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7R0FDakU7QUFDRCxTQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7Q0FDdEIsQ0FBQTs7Ozs7V0MzQmdDLE9BQU8sQ0FBQyxZQUFZLENBQUM7O0lBQWpELE1BQU0sUUFBTixNQUFNO0lBQUUsT0FBTyxRQUFQLE9BQU87SUFBRSxPQUFPLFFBQVAsT0FBTztZQUNSLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQXRDLFlBQVksU0FBWixZQUFZOzs7QUFFakIsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUE7O0FBRTNCLElBQU0sZUFBZSxHQUFHLENBQUMsQ0FBQTtBQUN6QixJQUFNLGNBQWMsR0FBSSxDQUFDLENBQUE7QUFDekIsSUFBTSxVQUFVLEdBQVEsZUFBZSxHQUFHLGNBQWMsQ0FBQTs7QUFFeEQsU0FBUyxNQUFNLENBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDNUMsTUFBSSxDQUFDLEdBQUksVUFBVSxHQUFHLEtBQUssQ0FBQTtBQUMzQixNQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2QsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFZCxVQUFRLENBQUMsQ0FBQyxDQUFDLEdBQU0sRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBOztBQUVuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxTQUFTLFFBQVEsQ0FBRSxLQUFLLEVBQUU7QUFDeEIsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxXQUFXLENBQUUsS0FBSyxFQUFFO0FBQzNCLFNBQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFBO0NBQzVDOztBQUVELFNBQVMsVUFBVSxDQUFFLEtBQUssRUFBRTtBQUMxQixN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QUUsSUFBSSxDQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQ2hhbm5lbCAoY29udGV4dCwgbmFtZSkge1xyXG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcclxuICBcclxuICBsZXQgY29ubmVjdFBhbm5lciA9IGZ1bmN0aW9uIChzcmMsIHBhbm5lciwgY2hhbikge1xyXG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxyXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXHJcbiAgfVxyXG5cclxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xyXG4gICAgbGV0IHNob3VsZExvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2VcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XHJcbiAgICAgIGxldCBzcmMgPSBjaGFubmVsLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkgXHJcblxyXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxyXG4gICAgICBlbHNlICAgICAgICBzcmMuY29ubmVjdChjaGFubmVsKVxyXG5cclxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcclxuICAgICAgc3JjLmJ1ZmZlciA9IGJ1ZmZlclxyXG4gICAgICBzcmMuc3RhcnQoMClcclxuICAgICAgcmV0dXJuIHNyY1xyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGNoYW5uZWwuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxyXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cclxuICB9KVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cclxuICB9KVxyXG5cclxuICB0aGlzLm5hbWUgPSBuYW1lXHJcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxyXG4gIHRoaXMucGxheSA9IGJhc2VQbGF5KClcclxufVxyXG5cclxuZnVuY3Rpb24gQXVkaW9TeXN0ZW0gKGNoYW5uZWxOYW1lcykge1xyXG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcclxuICBsZXQgY2hhbm5lbHMgPSB7fVxyXG4gIGxldCBpICAgICAgICA9IC0xXHJcblxyXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xyXG4gICAgY2hhbm5lbHNbY2hhbm5lbE5hbWVzW2ldXSA9IG5ldyBDaGFubmVsKGNvbnRleHQsIGNoYW5uZWxOYW1lc1tpXSlcclxuICB9XHJcbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXHJcbiAgdGhpcy5jaGFubmVscyA9IGNoYW5uZWxzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXVkaW9TeXN0ZW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcclxuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cclxufVxyXG4iLCIvL3RoaXMgZG9lcyBsaXRlcmFsbHkgbm90aGluZy4gIGl0J3MgYSBzaGVsbCB0aGF0IGhvbGRzIGNvbXBvbmVudHNcclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbnRpdHkgKCkge31cclxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdHlTdG9yZVxyXG5cclxuZnVuY3Rpb24gRW50aXR5U3RvcmUgKG1heD0xMDAwKSB7XHJcbiAgdGhpcy5lbnRpdGllcyAgPSBbXVxyXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cclxufVxyXG5cclxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgbGV0IGlkID0gdGhpcy5lbnRpdGllcy5sZW5ndGhcclxuXHJcbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXHJcbiAgcmV0dXJuIGlkXHJcbn1cclxuXHJcbkVudGl0eVN0b3JlLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChjb21wb25lbnROYW1lcykge1xyXG4gIGxldCBpID0gLTFcclxuICBsZXQgZW50aXR5XHJcblxyXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cclxuXHJcbiAgd2hpbGUgKHRoaXMuZW50aXRpZXNbKytpXSkge1xyXG4gICAgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxyXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxyXG4gIH1cclxuICByZXR1cm4gdGhpcy5sYXN0UXVlcnlcclxufVxyXG4iLCJsZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxyXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxyXG5cclxuY29uc3QgUE9JTlRfRElNRU5TSU9OID0gMlxyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgPSA2XHJcbmNvbnN0IEJPWF9MRU5HVEggICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXHJcblxyXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgeCwgeSwgdywgaCkge1xyXG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxyXG4gIGxldCB4MSA9IHhcclxuICBsZXQgeTEgPSB5IFxyXG4gIGxldCB4MiA9IHggKyB3XHJcbiAgbGV0IHkyID0geSArIGhcclxuXHJcbiAgYm94QXJyYXlbaV0gICAgPSB4MVxyXG4gIGJveEFycmF5W2krMV0gID0geTFcclxuICBib3hBcnJheVtpKzJdICA9IHgyXHJcbiAgYm94QXJyYXlbaSszXSAgPSB5MVxyXG4gIGJveEFycmF5W2krNF0gID0geDFcclxuICBib3hBcnJheVtpKzVdICA9IHkyXHJcblxyXG4gIGJveEFycmF5W2krNl0gID0geDFcclxuICBib3hBcnJheVtpKzddICA9IHkyXHJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxyXG4gIGJveEFycmF5W2krOV0gID0geTFcclxuICBib3hBcnJheVtpKzEwXSA9IHgyXHJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MlxyXG59XHJcblxyXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxyXG59XHJcblxyXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcclxuICAgIGFyW2ldICAgID0gMFxyXG4gICAgYXJbaSsxXSAgPSAwXHJcbiAgICBhcltpKzJdICA9IDFcclxuICAgIGFyW2krM10gID0gMFxyXG4gICAgYXJbaSs0XSAgPSAwXHJcbiAgICBhcltpKzVdICA9IDFcclxuXHJcbiAgICBhcltpKzZdICA9IDBcclxuICAgIGFyW2krN10gID0gMVxyXG4gICAgYXJbaSs4XSAgPSAxXHJcbiAgICBhcltpKzldICA9IDBcclxuICAgIGFyW2krMTBdID0gMVxyXG4gICAgYXJbaSsxMV0gPSAxXHJcbiAgfSBcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB2U3JjLCBmU3JjLCBvcHRpb25zPXt9KSB7XHJcbiAgbGV0IHttYXhTcHJpdGVDb3VudCwgd2lkdGgsIGhlaWdodH0gPSBvcHRpb25zXHJcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gbWF4U3ByaXRlQ291bnQgfHwgMTAwXHJcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXHJcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxyXG4gIGxldCB2cyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcclxuICBsZXQgZnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcclxuICBsZXQgcHJvZ3JhbSAgICAgICAgPSBQcm9ncmFtKGdsLCB2cywgZnMpXHJcblxyXG4gIC8vaW5kZXggZm9yIHRyYWNraW5nIHRoZSBjdXJyZW50IGF2YWlsYWJsZSBwb3NpdGlvbiB0byBpbnN0YW50aWF0ZSBmcm9tXHJcbiAgbGV0IGZyZWVJbmRleCAgICAgPSAwXHJcbiAgbGV0IGFjdGl2ZVNwcml0ZXMgPSAwXHJcblxyXG4gIC8vdmlld3Mgb3ZlciBjcHUgYnVmZmVycyBmb3IgZGF0YVxyXG4gIGxldCBib3hlcyAgICAgPSBCb3hBcnJheShtYXhTcHJpdGVDb3VudClcclxuICBsZXQgY2VudGVycyAgID0gQ2VudGVyQXJyYXkobWF4U3ByaXRlQ291bnQpXHJcbiAgbGV0IHNjYWxlcyAgICA9IFNjYWxlQXJyYXkobWF4U3ByaXRlQ291bnQpXHJcbiAgbGV0IHJvdGF0aW9ucyA9IFJvdGF0aW9uQXJyYXkobWF4U3ByaXRlQ291bnQpXHJcbiAgbGV0IHRleENvb3JkcyA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KG1heFNwcml0ZUNvdW50KVxyXG5cclxuICAvL2hhbmRsZXMgdG8gR1BVIGJ1ZmZlcnNcclxuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcblxyXG4gIC8vR1BVIGJ1ZmZlciBsb2NhdGlvbnNcclxuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxyXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXHJcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxyXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcclxuICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV90ZXhDb29yZFwiKVxyXG5cclxuICAvL1VuaWZvcm0gbG9jYXRpb25zXHJcbiAgbGV0IHdvcmxkU2l6ZUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV93b3JsZFNpemVcIilcclxuXHJcbiAgLy9UT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBmb3IgdGVzdGluZyB0aGUgc2luZ2xlIHRleHR1cmUgY2FzZVxyXG4gIGxldCBvbmx5VGV4dHVyZSA9IFRleHR1cmUoZ2wpXHJcbiAgbGV0IGxvYWRlZCAgICAgID0gZmFsc2VcclxuXHJcbiAgZ2wuZW5hYmxlKGdsLkJMRU5EKVxyXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXHJcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXHJcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXHJcbiAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKVxyXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXHJcblxyXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcclxuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXHJcbiAgICBoZWlnaHQ6IGhlaWdodCB8fCAxMDgwXHJcbiAgfVxyXG5cclxuICAvL1RPRE86IFRoaXMgc2hvdWxkIG5vdCBiZSBwdWJsaWMgYXBpLiAgZW50aXRpZXMgY29udGFpbiByZWZlcmVuY2VzXHJcbiAgLy90byB0aGVpciBpbWFnZSB3aGljaCBzaG91bGQgYmUgV2Vha21hcCBzdG9yZWQgd2l0aCBhIHRleHR1cmUgYW5kIHVzZWRcclxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcclxuICAgIC8vVE9ETzogVGVtcG9yYXJ5IHl1Y2t5IHRoaW5nXHJcbiAgICBsb2FkZWQgPSB0cnVlXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpOyBcclxuICB9XHJcblxyXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcclxuICAgIGxldCByYXRpbyAgICAgICA9IHRoaXMuZGltZW5zaW9ucy53aWR0aCAvIHRoaXMuZGltZW5zaW9ucy5oZWlnaHRcclxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XHJcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xyXG4gICAgbGV0IG5ld1dpZHRoICAgID0gdXNlV2lkdGggPyB3aWR0aCA6IChoZWlnaHQgKiByYXRpbykgXHJcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxyXG5cclxuICAgIGNhbnZhcy53aWR0aCAgPSBuZXdXaWR0aCBcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXHJcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRTcHJpdGUgPSAoKSA9PiB7fVxyXG5cclxuICAvL1RISU5LIE9GIE5BTUU/XHJcbiAgLy90aGlzLnJlc2V0ID0gXHJcbiAgLy90aGlzLmZsdXNoXHJcblxyXG4gIHRoaXMucmVuZGVyID0gKGVudGl0aWVzKSA9PiB7XHJcbiAgICAvL3Jlc2V0IHRoZXNlIHZhbHVlcyBvbiBldmVyeSBjYWxsP1xyXG4gICAgZnJlZUluZGV4ICAgICA9IDBcclxuICAgIGFjdGl2ZVNwcml0ZXMgPSAwXHJcbiAgICB3aW5kb3cuYm94ZXMgPSBib3hlc1xyXG5cclxuICAgIGlmICghbG9hZGVkICYmIGVudGl0aWVzWzBdKSB0aGlzLmFkZFRleHR1cmUoZW50aXRpZXNbMF0ucmVuZGVyYWJsZS5pbWFnZSlcclxuXHJcbiAgICAvL1RPRE86IGluaXRpYWwgdmVyc2lvbiBvZiB0aGlzIGxvb3AgdXNlcyBjb21tb25seSBzaGFyZWQgcGFkZGxlIHRleHR1cmVcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgc2V0Qm94KFxyXG4gICAgICAgIGJveGVzLCBcclxuICAgICAgICBmcmVlSW5kZXgrKywgXHJcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy54LCBcclxuICAgICAgICBlbnRpdGllc1tpXS5waHlzaWNzLnksIFxyXG4gICAgICAgIGVudGl0aWVzW2ldLnJlbmRlcmFibGUud2lkdGgsXHJcbiAgICAgICAgZW50aXRpZXNbaV0ucmVuZGVyYWJsZS5oZWlnaHRcclxuICAgICAgKVxyXG4gICAgICBhY3RpdmVTcHJpdGVzKytcclxuICAgIH1cclxuXHJcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgb25seVRleHR1cmUpXHJcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYm94ZXMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgY2VudGVyQnVmZmVyLCBjZW50ZXJMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBjZW50ZXJzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgdGV4Q29vcmRCdWZmZXIsIHRleENvb3JkTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgdGV4Q29vcmRzKVxyXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcclxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcclxuICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBhY3RpdmVTcHJpdGVzICogUE9JTlRTX1BFUl9CT1gpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcclxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcclxubGV0IEF1ZGlvU3lzdGVtICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXHJcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxyXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXHJcbmxldCBTY2VuZU1hbmFnZXIgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2FtZVxyXG5cclxuLy86OiBDYWNoZSAtPiBMb2FkZXIgLT4gR0xSZW5kZXJlciAtPiBBdWRpb1N5c3RlbSAtPiBFbnRpdHlTdG9yZSAtPiBTY2VuZU1hbmFnZXJcclxuZnVuY3Rpb24gR2FtZSAoY2FjaGUsIGxvYWRlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcclxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXHJcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxyXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXHJcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcclxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXHJcblxyXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXHJcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXHJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcclxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxyXG5cclxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXHJcblxyXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXHJcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxyXG5cclxuY29uc3QgS0VZX0NPVU5UID0gMjU2XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XHJcbiAgbGV0IGlzRG93bnMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGRvd25EdXJhdGlvbnMgPSBuZXcgVWludDMyQXJyYXkoS0VZX0NPVU5UKVxyXG4gIFxyXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdERvd25zW2tleUNvZGVdID0gIWlzRG93bnNba2V5Q29kZV1cclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcclxuICAgICAganVzdERvd25zW2ldID0gMFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXHJcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xyXG4gIHRoaXMuanVzdERvd25zICAgICA9IGp1c3REb3duc1xyXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcclxuXHJcbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcclxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcclxuICAgICAgaWYgKGlzRG93bnNbaV0pIGRvd25EdXJhdGlvbnNbaV0gKz0gZFRcclxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxyXG59XHJcbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XHJcbiAgbGV0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dFxyXG5cclxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XHJcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXHJcblxyXG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0IFxyXG5cclxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcclxuICAgICAgeGhyLm9ubG9hZCAgICAgICA9ICgpID0+IGNiKG51bGwsIHhoci5yZXNwb25zZSlcclxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXHJcbiAgICAgIHhoci5zZW5kKG51bGwpXHJcbiAgICB9IFxyXG4gIH1cclxuXHJcbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcclxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcclxuXHJcbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xyXG5cclxuICB0aGlzLmxvYWRUZXh0dXJlID0gKHBhdGgsIGNiKSA9PiB7XHJcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxyXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxyXG4gICAgbGV0IG9uZXJyb3IgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxyXG4gICAgXHJcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcclxuICAgIGkub25lcnJvciA9IG9uZXJyb3JcclxuICAgIGkuc3JjICAgICA9IHBhdGhcclxuICB9XHJcblxyXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XHJcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xyXG4gICAgICBsZXQgZGVjb2RlU3VjY2VzcyA9IChidWZmZXIpID0+IGNiKG51bGwsIGJ1ZmZlcikgICBcclxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxyXG5cclxuICAgICAgYXVkaW9DdHguZGVjb2RlQXVkaW9EYXRhKGJpbmFyeSwgZGVjb2RlU3VjY2VzcywgZGVjb2RlRmFpbHVyZSlcclxuICAgIH0pIFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcclxuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXHJcbiAgICBsZXQgdGV4dHVyZUtleXMgID0gT2JqZWN0LmtleXModGV4dHVyZXMgfHwge30pXHJcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycyB8fCB7fSlcclxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXHJcbiAgICBsZXQgdGV4dHVyZUNvdW50ID0gdGV4dHVyZUtleXMubGVuZ3RoXHJcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcclxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IGogICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XHJcbiAgICAgIHNvdW5kczp7fSwgdGV4dHVyZXM6IHt9LCBzaGFkZXJzOiB7fSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2hlY2tEb25lID0gKCkgPT4ge1xyXG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICBzb3VuZENvdW50LS1cclxuICAgICAgb3V0LnNvdW5kc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgdGV4dHVyZUNvdW50LS1cclxuICAgICAgb3V0LnRleHR1cmVzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNoYWRlckNvdW50LS1cclxuICAgICAgb3V0LnNoYWRlcnNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XHJcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cclxuXHJcbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xyXG4gICAgICBsZXQga2V5ID0gdGV4dHVyZUtleXNbal1cclxuXHJcbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyVGV4dHVyZShrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB3aGlsZSAoc2hhZGVyS2V5c1srK2tdKSB7XHJcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXHJcblxyXG4gICAgICB0aGlzLmxvYWRTaGFkZXIoc2hhZGVyc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXHJcbn1cclxuXHJcbi8vVE9ETzogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGUgc2NlbmUgdGhhdCBvd25zIHVzIVxyXG4vL2FuZCBieSBleHRlbnNpb24sIGlmIG5lZWRlZCwgd2Ugd2lsbCBoYXZlIGEgcmVmZXJlbmNlXHJcbi8vdG8gdGhlIGdhbWUgaXRzZWxmXHJcblJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGVudGl0aWVzKSB7XHJcbiAgLy9sZXQge3JlbmRlcmVyfSA9IHRoaXMuc2NlbmUuZ2FtZVxyXG5cclxuICAvL3JlbmRlcmVyLnJlc2V0KClcclxuICAvL2VudGl0aWVzLmZvckVhY2goZnVuY3Rpb24gKGVudGl0eSkge1xyXG4gIC8vICByZW5kZXJlci5hZGRTcHJpdGUoLy9wcm9wZXJ0aWVzIHRoYXQgaXQgY2FyZXMgYWJvdXQpIFxyXG4gIC8vfSkgICBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXHJcblxyXG4vKiBHQU1FXHJcbiAqICAgIFJFTkRFUkVSXHJcbiAqICAgIEFVRElPIFRISU5HXHJcbiAqICAgIElOUFVUIFRISU5HXHJcbiAqICAgIEFTU0VUIExPQURFUlxyXG4gKiAgICBBU1NFVCBDQUNIRVxyXG4gKiAgICBFTlRJVFkgU1RPUkUgLS0gYXQgc2ltcGxlc3QsIHRoaXMgaXMgYW4gYXJyYXkgb2YgZW50aXRpZXNcclxuICogICAgU0NFTkVNQU5BR0VSXHJcbiAqICAgICAgW1NDRU5FU10gIC0tIGFuYWxvZ3MgdG8gcHJvZ3JhbXMuICBPbmUgcHJvZ3JhbSBleGVjdXRlcyBhdCBhIHRpbWVcclxuICogICAgICAgIFNZU1RFTVNcclxuICovXHJcblxyXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xyXG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXHJcblxyXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcclxuICB0aGlzLnN5c3RlbXMgPSBzeXN0ZW1zXHJcbiAgdGhpcy5nYW1lICAgID0gbnVsbFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBjYihudWxsLCBudWxsKSAgXHJcbn1cclxuXHJcblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IHN5c3RlbVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXHJcbiAgICBzeXN0ZW0ucnVuKHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcclxuXHJcbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XHJcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxyXG5cclxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcclxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xyXG5cclxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXHJcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxyXG5cclxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcclxuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcclxuXHJcbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcclxuICB9XHJcblxyXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcclxuXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cclxuICB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcclxuICB0aGlzLmNvbXBvbmVudE5hbWVzID0gY29tcG9uZW50TmFtZXNcclxufVxyXG5cclxuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoZW50aXRpZXMpIHtcclxuICAvL2RvZXMgc29tZXRoaW5nIHcvIHRoZSBsaXN0IG9mIGVudGl0aWVzIHBhc3NlZCB0byBpdFxyXG59XHJcbiIsImxldCB7UGFkZGxlfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXHJcbmxldCBSZW5kZXJpbmdTeXN0ZW0gPSByZXF1aXJlKFwiLi9SZW5kZXJpbmdTeXN0ZW1cIilcclxubGV0IFNjZW5lICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxyXG5cclxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcclxuICBsZXQgc3lzdGVtcyA9IFtuZXcgUmVuZGVyaW5nU3lzdGVtXVxyXG5cclxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxyXG59XHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZSwgYXVkaW9TeXN0ZW19ID0gdGhpcy5nYW1lIFxyXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcclxuICBsZXQgYXNzZXRzID0ge1xyXG4gICAgc291bmRzOiB7IGJnTXVzaWM6IFwiL3B1YmxpYy9zb3VuZHMvYmdtMS5tcDNcIiB9LFxyXG4gICAgdGV4dHVyZXM6IHsgcGFkZGxlOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIiB9XHJcbiAgfVxyXG5cclxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xyXG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcclxuXHJcbiAgICB3aW5kb3cuYmcgPSBiZ1xyXG5cclxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXHJcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcclxuICAgIGJnLnZvbHVtZSA9IC4xXHJcbiAgICBiZy5sb29wKGNhY2hlLnNvdW5kcy5iZ011c2ljKVxyXG4gICAgY2IobnVsbClcclxuICB9KVxyXG59XHJcbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljc30gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXHJcbmxldCBFbnRpdHkgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzLlBhZGRsZSA9IFBhZGRsZVxyXG5cclxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuUmVuZGVyYWJsZSA9IFJlbmRlcmFibGVcclxubW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICA9IFBoeXNpY3NcclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmFibGUgKGUsIGltYWdlLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgZS5yZW5kZXJhYmxlID0ge1xyXG4gICAgaW1hZ2UsXHJcbiAgICB3aWR0aCxcclxuICAgIGhlaWdodCxcclxuICAgIHJvdGF0aW9uOiAwLFxyXG4gICAgY2VudGVyOiB7XHJcbiAgICAgIHg6IHdpZHRoIC8gMixcclxuICAgICAgeTogaGVpZ2h0IC8gMiBcclxuICAgIH0sXHJcbiAgICBzY2FsZToge1xyXG4gICAgICB4OiAxLFxyXG4gICAgICB5OiAxIFxyXG4gICAgfVxyXG4gIH0gXHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGh5c2ljcyAoZSwgd2lkdGgsIGhlaWdodCwgeCwgeSkge1xyXG4gIGUucGh5c2ljcyA9IHtcclxuICAgIHdpZHRoLCBcclxuICAgIGhlaWdodCwgXHJcbiAgICB4LCBcclxuICAgIHksIFxyXG4gICAgZHg6ICAwLCBcclxuICAgIGR5OiAgMCwgXHJcbiAgICBkZHg6IDAsIFxyXG4gICAgZGR5OiAwXHJcbiAgfVxyXG4gIHJldHVybiBlXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXHJcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcclxuXHJcbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxyXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XHJcbiAgbGV0IGxlbiAgID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoXHJcbiAgbGV0IGkgICAgID0gLTFcclxuICBsZXQgZm91bmQgPSBudWxsXHJcblxyXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xyXG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XHJcbiAgICAgIGZvdW5kID0gYXJyYXlPZk9iamVjdHNbaV1cclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZvdW5kXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xyXG4gIGxldCBpID0gLTFcclxuICBcclxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXHJcbiAgcmV0dXJuIHRydWVcclxufVxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcclxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xyXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXHJcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcclxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXHJcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXHJcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xyXG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXHJcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxyXG4gIFxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcclxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcclxuXHJcbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxyXG5cclxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgc3JjKVxyXG4gIHJldHVybiAgICAgICAgc2hhZGVyXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XHJcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcclxuXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxyXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcclxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxyXG4gIHJldHVybiBwcm9ncmFtXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcclxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcclxuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICByZXR1cm4gdGV4dHVyZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXHJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXHJcbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXHJcbiIsImxldCBMb2FkZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcclxubGV0IEdMUmVuZGVyZXIgICAgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcclxubGV0IEVudGl0eVN0b3JlICAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxyXG5sZXQgQ2FjaGUgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5sZXQgU2NlbmUgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcclxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxyXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcbmxldCBBdWRpb1N5c3RlbSAgICAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxyXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxyXG5sZXQgdmVydGV4U3JjICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJ0ZXhcIikudGV4dFxyXG5sZXQgZnJhZ1NyYyAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcmFnbWVudFwiKS50ZXh0XHJcblxyXG4vL1RFU1RJTkcgRk9SIElOUFVUIE1BTkFHRVJcclxubGV0IGtiTWFuYWdlciA9IG5ldyBLZXlib2FyZE1hbmFnZXIoZG9jdW1lbnQpXHJcblxyXG53aW5kb3cua2JNYW5hZ2VyID0ga2JNYW5hZ2VyXHJcblxyXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxyXG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXHJcblxyXG5sZXQgcmVuZGVyZXJPcHRzID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cclxubGV0IGVudGl0eVN0b3JlICA9IG5ldyBFbnRpdHlTdG9yZVxyXG5sZXQgY2FjaGUgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxyXG5sZXQgbG9hZGVyICAgICAgID0gbmV3IExvYWRlclxyXG5sZXQgcmVuZGVyZXIgICAgID0gbmV3IEdMUmVuZGVyZXIoY2FudmFzLCB2ZXJ0ZXhTcmMsIGZyYWdTcmMsIHJlbmRlcmVyT3B0cylcclxubGV0IGF1ZGlvU3lzdGVtICA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXHJcbmxldCBzY2VuZU1hbmFnZXIgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcclxubGV0IGdhbWUgICAgICAgICA9IG5ldyBHYW1lKGNhY2hlLCBsb2FkZXIsIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgZW50aXR5U3RvcmUsIHNjZW5lTWFuYWdlcilcclxuXHJcbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICA9IGdhbWUuZW50aXR5U3RvcmVcclxuICBsZXQgbmV3VGltZSA9IERhdGUubm93KClcclxuICBsZXQgb2xkVGltZSA9IG5ld1RpbWVcclxuICBsZXQgZFQgICAgICA9IG5ld1RpbWUgLSBvbGRUaW1lXHJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XHJcbiAgICBsZXQgbW92ZVNwZWVkID0gMVxyXG4gICAgbGV0IHBhZGRsZSAgICA9IHN0b3JlLnF1ZXJ5KGNvbXBvbmVudE5hbWVzKVswXVxyXG5cclxuICAgIG9sZFRpbWUgPSBuZXdUaW1lXHJcbiAgICBuZXdUaW1lID0gRGF0ZS5ub3coKVxyXG4gICAgZFQgICAgICA9IG5ld1RpbWUgLSBvbGRUaW1lXHJcblxyXG4gICAgaWYgKGtiTWFuYWdlci5pc0Rvd25zWzM3XSkgcGFkZGxlLnBoeXNpY3MueCAtPSBkVCAqIG1vdmVTcGVlZFxyXG4gICAgaWYgKGtiTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBkVCAqIG1vdmVTcGVlZFxyXG4gICAga2JNYW5hZ2VyLnRpY2soZFQpXHJcbiAgICBnYW1lLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZS51cGRhdGUoKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IHIgICAgICAgICAgICAgID0gZ2FtZS5yZW5kZXJlclxyXG4gIGxldCBjb21wb25lbnROYW1lcyA9IFtcInJlbmRlcmFibGVcIiwgXCJwaHlzaWNzXCJdXHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcclxuICAgIGxldCByZW5kZXJhYmxlcyA9IHN0b3JlLnF1ZXJ5KGNvbXBvbmVudE5hbWVzKVxyXG5cclxuICAgIHIucmVuZGVyKHJlbmRlcmFibGVzKVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5nYW1lID0gZ2FtZVxyXG5cclxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgfSlcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxyXG4gIGdhbWUuc3RhcnQoKVxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcclxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXHJcbn0pXHJcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXHJcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcbiJdfQ==
