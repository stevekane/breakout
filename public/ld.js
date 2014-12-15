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

function Frame(aabb, duration) {
  this.aabb = aabb;
  this.duration = duration;
}

//rate is in ms.  This is the time per frame (42 ~ 24fps)
module.exports = function Animation(w, h, x, y, count, doesLoop, rate) {
  if (rate === undefined) rate = 42;
  var frames = [];
  var i = -1;
  var eachX;
  var aabb;

  while (++i < count) {
    eachX = x + count * w;
    aabb = new AABB(w, h, eachX, y);
    frames.push(new Frame(aabb, rate));
  }

  this.loop = doesLoop;
  this.rate = rate;
  this.frames = frames;
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

  this.addEntities = function (entities) {
    if (!loaded && entities[0]) _this.addTexture(entities[0].renderable.image);
    for (var i = 0; i < entities.length; ++i) {
      setBox(boxes, freeIndex++, entities[i].physics.x, entities[i].physics.y, entities[i].renderable.width, entities[i].renderable.height);
      activeSprites++;
    }
  };

  this.flush = function () {
    freeIndex = 0;
    activeSprites = 0;
  };

  this.render = function () {
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

},{"./gl-buffer":23,"./gl-types":24}],9:[function(require,module,exports){
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./InputManager":10,"./Loader":13,"./SceneManager":17,"./utils":26}],10:[function(require,module,exports){
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

},{"./KeyboardManager":11,"./utils":26}],11:[function(require,module,exports){
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

var System = require("./System");

module.exports = RenderingSystem;

function RenderingSystem() {
  System.call(this, ["physics", "renderable"]);
}

RenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;


  renderer.flush();
  renderer.addEntities(entities);
};

},{"./System":18}],16:[function(require,module,exports){
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
      blocks: "/public/spritesheets/blocks.png"
    }
  };

  loader.loadAssets(assets, function (err, loadedAssets) {
    var textures = loadedAssets.textures;
    var sounds = loadedAssets.sounds;


    cache.sounds = sounds;
    cache.textures = textures;
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400));
    entityStore.addEntity(new Block(textures.blocks, 44, 22, 800, 800));
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
    idle: new Animation(44, 22, 0, 0, 3, true, 1000)
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

},{}],25:[function(require,module,exports){
"use strict";

var Loader = require("./Loader");
var GLRenderer = require("./GLRenderer");
var EntityStore = require("./EntityStore-Simple");
var Clock = require("./Clock");
var Cache = require("./Cache");
var SceneManager = require("./SceneManager");
var Scene = require("./Scene");
var TestScene = require("./TestScene");
var Game = require("./Game");
var InputManager = require("./InputManager");
var KeyboardManager = require("./KeyboardManager");
var AudioSystem = require("./AudioSystem");
var canvas = document.createElement("canvas");
var vertexSrc = document.getElementById("vertex").text;
var fragSrc = document.getElementById("fragment").text;

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var keyboardManager = new KeyboardManager(document);
var inputManager = new InputManager(keyboardManager);
var rendererOpts = { maxSpriteCount: MAX_COUNT };
var entityStore = new EntityStore();
var clock = new Clock(Date.now);
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts);
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./Game":9,"./InputManager":10,"./KeyboardManager":11,"./Loader":13,"./Scene":16,"./SceneManager":17,"./TestScene":19}],26:[function(require,module,exports){
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

},{}]},{},[25])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FB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QUFZO0FBQ1osMkNBQXdDO0FBQ3hDLGlEQUE4QztHQUM5Qzs7Ozs7QUNwRUYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQVEsU0FBUyxDQUFBO0FBQ3pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTs7QUFFOUMsU0FBUyxTQUFTLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUNsQyxNQUFJLENBQUMsQ0FBQyxRQUFRLFlBQVksSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDakY7O0FBRUQsU0FBUyxjQUFjLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUN2QyxNQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVoQyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0NBQ3pFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQUFCQiAodywgaCwgeCwgeSkge1xyXG4gIHRoaXMueCA9IHhcclxuICB0aGlzLnkgPSB5XHJcbiAgdGhpcy53ID0gd1xyXG4gIHRoaXMuaCA9IGhcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx4XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHggfSBcclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseVwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB5IH0gXHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnhcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geCArIHcgfVxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ5XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHkgKyBoIH1cclxuICB9KVxyXG59XHJcbiIsImxldCBBQUJCID0gcmVxdWlyZShcIi4vQUFCQlwiKVxyXG5cclxuZnVuY3Rpb24gRnJhbWUgKGFhYmIsIGR1cmF0aW9uKSB7XHJcbiAgdGhpcy5hYWJiICAgICA9IGFhYmJcclxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cclxufVxyXG5cclxuLy9yYXRlIGlzIGluIG1zLiAgVGhpcyBpcyB0aGUgdGltZSBwZXIgZnJhbWUgKDQyIH4gMjRmcHMpXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQW5pbWF0aW9uICh3LCBoLCB4LCB5LCBjb3VudCwgZG9lc0xvb3AsIHJhdGU9NDIpIHtcclxuICBsZXQgZnJhbWVzID0gW11cclxuICBsZXQgaSAgICAgID0gLTFcclxuICBsZXQgZWFjaFhcclxuICBsZXQgYWFiYlxyXG5cclxuICB3aGlsZSAoKytpIDwgY291bnQpIHtcclxuICAgIGVhY2hYID0geCArIGNvdW50ICogd1xyXG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcclxuICAgIGZyYW1lcy5wdXNoKG5ldyBGcmFtZShhYWJiLCByYXRlKSlcclxuICB9XHJcblxyXG4gIHRoaXMubG9vcCAgID0gZG9lc0xvb3BcclxuICB0aGlzLnJhdGUgICA9IHJhdGVcclxuICB0aGlzLmZyYW1lcyA9IGZyYW1lc1xyXG59XHJcbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcclxuICBsZXQgY2hhbm5lbCA9IGNvbnRleHQuY3JlYXRlR2FpbigpXHJcbiAgXHJcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcclxuICAgIHNyYy5jb25uZWN0KHBhbm5lcilcclxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxyXG4gIH1cclxuXHJcbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcclxuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xyXG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxyXG5cclxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcclxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcclxuXHJcbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXHJcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcclxuICAgICAgc3JjLnN0YXJ0KDApXHJcbiAgICAgIHJldHVybiBzcmNcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsLmdhaW4udmFsdWUgfSxcclxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XHJcbiAgfSlcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbCB9XHJcbiAgfSlcclxuXHJcbiAgdGhpcy5uYW1lID0gbmFtZVxyXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcclxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcclxuICBsZXQgY29udGV4dCAgPSBuZXcgQXVkaW9Db250ZXh0XHJcbiAgbGV0IGNoYW5uZWxzID0ge31cclxuICBsZXQgaSAgICAgICAgPSAtMVxyXG5cclxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcclxuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXHJcbiAgfVxyXG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxyXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FjaGUgKGtleU5hbWVzKSB7XHJcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBDbG9ja1xyXG5cclxuZnVuY3Rpb24gQ2xvY2sgKHRpbWVGbj1EYXRlLm5vdykge1xyXG4gIHRoaXMub2xkVGltZSA9IHRpbWVGbigpXHJcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcclxuICB0aGlzLmRUID0gMFxyXG4gIHRoaXMudGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxyXG4gICAgdGhpcy5uZXdUaW1lID0gdGltZUZuKCkgIFxyXG4gICAgdGhpcy5kVCAgICAgID0gdGhpcy5uZXdUaW1lIC0gdGhpcy5vbGRUaW1lXHJcbiAgfVxyXG59XHJcbiIsIi8vdGhpcyBkb2VzIGxpdGVyYWxseSBub3RoaW5nLiAgaXQncyBhIHNoZWxsIHRoYXQgaG9sZHMgY29tcG9uZW50c1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxyXG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXHJcblxyXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAobWF4PTEwMDApIHtcclxuICB0aGlzLmVudGl0aWVzICA9IFtdXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcclxuICBsZXQgaWQgPSB0aGlzLmVudGl0aWVzLmxlbmd0aFxyXG5cclxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcclxuICByZXR1cm4gaWRcclxufVxyXG5cclxuRW50aXR5U3RvcmUucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKGNvbXBvbmVudE5hbWVzKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIGxldCBlbnRpdHlcclxuXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG5cclxuICB3aGlsZSAodGhpcy5lbnRpdGllc1srK2ldKSB7XHJcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXHJcbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXHJcbiAgfVxyXG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxyXG59XHJcbiIsImxldCB7U2hhZGVyLCBQcm9ncmFtLCBUZXh0dXJlfSA9IHJlcXVpcmUoXCIuL2dsLXR5cGVzXCIpXHJcbmxldCB7dXBkYXRlQnVmZmVyfSA9IHJlcXVpcmUoXCIuL2dsLWJ1ZmZlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHTFJlbmRlcmVyXHJcblxyXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXHJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcclxuXHJcbmZ1bmN0aW9uIHNldEJveCAoYm94QXJyYXksIGluZGV4LCB4LCB5LCB3LCBoKSB7XHJcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XHJcbiAgbGV0IHgxID0geFxyXG4gIGxldCB5MSA9IHkgXHJcbiAgbGV0IHgyID0geCArIHdcclxuICBsZXQgeTIgPSB5ICsgaFxyXG5cclxuICBib3hBcnJheVtpXSAgICA9IHgxXHJcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxyXG4gIGJveEFycmF5W2krMl0gID0geDJcclxuICBib3hBcnJheVtpKzNdICA9IHkxXHJcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxyXG4gIGJveEFycmF5W2krNV0gID0geTJcclxuXHJcbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxyXG4gIGJveEFycmF5W2krN10gID0geTJcclxuICBib3hBcnJheVtpKzhdICA9IHgyXHJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxyXG4gIGJveEFycmF5W2krMTBdID0geDJcclxuICBib3hBcnJheVtpKzExXSA9IHkyXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG59XHJcblxyXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xyXG4gICAgYXJbaV0gICAgPSAwXHJcbiAgICBhcltpKzFdICA9IDBcclxuICAgIGFyW2krMl0gID0gMVxyXG4gICAgYXJbaSszXSAgPSAwXHJcbiAgICBhcltpKzRdICA9IDBcclxuICAgIGFyW2krNV0gID0gMVxyXG5cclxuICAgIGFyW2krNl0gID0gMFxyXG4gICAgYXJbaSs3XSAgPSAxXHJcbiAgICBhcltpKzhdICA9IDFcclxuICAgIGFyW2krOV0gID0gMFxyXG4gICAgYXJbaSsxMF0gPSAxXHJcbiAgICBhcltpKzExXSA9IDFcclxuICB9IFxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcclxuICBsZXQge21heFNwcml0ZUNvdW50LCB3aWR0aCwgaGVpZ2h0fSA9IG9wdGlvbnNcclxuICBsZXQgbWF4U3ByaXRlQ291bnQgPSBtYXhTcHJpdGVDb3VudCB8fCAxMDBcclxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcclxuICBsZXQgZ2wgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpICAgICAgXHJcbiAgbGV0IHZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxyXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxyXG4gIGxldCBwcm9ncmFtICAgICAgICA9IFByb2dyYW0oZ2wsIHZzLCBmcylcclxuXHJcbiAgLy9pbmRleCBmb3IgdHJhY2tpbmcgdGhlIGN1cnJlbnQgYXZhaWxhYmxlIHBvc2l0aW9uIHRvIGluc3RhbnRpYXRlIGZyb21cclxuICBsZXQgZnJlZUluZGV4ICAgICA9IDBcclxuICBsZXQgYWN0aXZlU3ByaXRlcyA9IDBcclxuXHJcbiAgLy92aWV3cyBvdmVyIGNwdSBidWZmZXJzIGZvciBkYXRhXHJcbiAgbGV0IGJveGVzICAgICA9IEJveEFycmF5KG1heFNwcml0ZUNvdW50KVxyXG4gIGxldCBjZW50ZXJzICAgPSBDZW50ZXJBcnJheShtYXhTcHJpdGVDb3VudClcclxuICBsZXQgc2NhbGVzICAgID0gU2NhbGVBcnJheShtYXhTcHJpdGVDb3VudClcclxuICBsZXQgcm90YXRpb25zID0gUm90YXRpb25BcnJheShtYXhTcHJpdGVDb3VudClcclxuICBsZXQgdGV4Q29vcmRzID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkobWF4U3ByaXRlQ291bnQpXHJcblxyXG4gIC8vaGFuZGxlcyB0byBHUFUgYnVmZmVyc1xyXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IGNlbnRlckJ1ZmZlciAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgc2NhbGVCdWZmZXIgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuXHJcbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xyXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXHJcbiAgLy9sZXQgY2VudGVyTG9jYXRpb24gICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jZW50ZXJcIilcclxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXHJcbiAgLy9sZXQgcm90TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9yb3RhdGlvblwiKVxyXG4gIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3RleENvb3JkXCIpXHJcblxyXG4gIC8vVW5pZm9ybSBsb2NhdGlvbnNcclxuICBsZXQgd29ybGRTaXplTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxyXG5cclxuICAvL1RPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGZvciB0ZXN0aW5nIHRoZSBzaW5nbGUgdGV4dHVyZSBjYXNlXHJcbiAgbGV0IG9ubHlUZXh0dXJlID0gVGV4dHVyZShnbClcclxuICBsZXQgbG9hZGVkICAgICAgPSBmYWxzZVxyXG5cclxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXHJcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcclxuICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDAuMClcclxuICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSlcclxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuXHJcbiAgdGhpcy5kaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcclxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcclxuICB9XHJcblxyXG4gIC8vVE9ETzogVGhpcyBzaG91bGQgbm90IGJlIHB1YmxpYyBhcGkuICBlbnRpdGllcyBjb250YWluIHJlZmVyZW5jZXNcclxuICAvL3RvIHRoZWlyIGltYWdlIHdoaWNoIHNob3VsZCBiZSBXZWFrbWFwIHN0b3JlZCB3aXRoIGEgdGV4dHVyZSBhbmQgdXNlZFxyXG4gIHRoaXMuYWRkVGV4dHVyZSA9IChpbWFnZSkgPT4ge1xyXG4gICAgLy9UT0RPOiBUZW1wb3JhcnkgeXVja3kgdGhpbmdcclxuICAgIGxvYWRlZCA9IHRydWVcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG9ubHlUZXh0dXJlKVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7IFxyXG4gIH1cclxuXHJcbiAgdGhpcy5yZXNpemUgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xyXG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxyXG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcclxuICAgIGxldCB1c2VXaWR0aCAgICA9IHJhdGlvID49IHRhcmdldFJhdGlvXHJcbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcclxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XHJcblxyXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxyXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcclxuICAgIGdsLnZpZXdwb3J0KDAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHQpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZEVudGl0aWVzID0gKGVudGl0aWVzKSA9PiB7XHJcbiAgICBpZiAoIWxvYWRlZCAmJiBlbnRpdGllc1swXSkgdGhpcy5hZGRUZXh0dXJlKGVudGl0aWVzWzBdLnJlbmRlcmFibGUuaW1hZ2UpXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHNldEJveChcclxuICAgICAgICBib3hlcywgXHJcbiAgICAgICAgZnJlZUluZGV4KyssIFxyXG4gICAgICAgIGVudGl0aWVzW2ldLnBoeXNpY3MueCwgXHJcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy55LCBcclxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLndpZHRoLFxyXG4gICAgICAgIGVudGl0aWVzW2ldLnJlbmRlcmFibGUuaGVpZ2h0XHJcbiAgICAgIClcclxuICAgICAgYWN0aXZlU3ByaXRlcysrXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmZsdXNoID0gKCkgPT4ge1xyXG4gICAgZnJlZUluZGV4ICAgICA9IDBcclxuICAgIGFjdGl2ZVNwcml0ZXMgPSAwXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlbmRlciA9ICgpID0+IHtcclxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBvbmx5VGV4dHVyZSlcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgYm94QnVmZmVyLCBib3hMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBib3hlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHJvdGF0aW9uQnVmZmVyLCByb3RMb2NhdGlvbiwgMSwgcm90YXRpb25zKVxyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCB0ZXhDb29yZHMpXHJcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xyXG4gICAgZ2wudW5pZm9ybTJmKHdvcmxkU2l6ZUxvY2F0aW9uLCAxOTIwLCAxMDgwKVxyXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGFjdGl2ZVNwcml0ZXMgKiBQT0lOVFNfUEVSX0JPWClcclxuICB9XHJcbn1cclxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IElucHV0TWFuYWdlciA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgQ2xvY2sgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXHJcblxyXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxyXG5mdW5jdGlvbiBHYW1lIChjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLCByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIFxyXG4gICAgICAgICAgICAgICBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcclxuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxyXG4gIGNoZWNrVHlwZShpbnB1dE1hbmFnZXIsIElucHV0TWFuYWdlcilcclxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXHJcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxyXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXHJcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcclxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXHJcblxyXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcclxuICB0aGlzLmNhY2hlICAgICAgICA9IGNhY2hlIFxyXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXHJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXHJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcclxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxyXG5cclxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXHJcblxyXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXHJcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0TWFuYWdlclxyXG5cclxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xyXG5mdW5jdGlvbiBJbnB1dE1hbmFnZXIgKGtleWJvYXJkTWFuYWdlcikge1xyXG4gIGNoZWNrVHlwZShrZXlib2FyZE1hbmFnZXIsIEtleWJvYXJkTWFuYWdlcilcclxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxyXG5cclxuY29uc3QgS0VZX0NPVU5UID0gMjU2XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XHJcbiAgbGV0IGlzRG93bnMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGRvd25EdXJhdGlvbnMgPSBuZXcgVWludDMyQXJyYXkoS0VZX0NPVU5UKVxyXG4gIFxyXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdERvd25zW2tleUNvZGVdID0gIWlzRG93bnNba2V5Q29kZV1cclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcclxuICAgICAganVzdERvd25zW2ldID0gMFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXHJcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xyXG4gIHRoaXMuanVzdERvd25zICAgICA9IGp1c3REb3duc1xyXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcclxuXHJcbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcclxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcclxuICAgICAgaWYgKGlzRG93bnNbaV0pIGRvd25EdXJhdGlvbnNbaV0gKz0gZFRcclxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxyXG59XHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJyZW5kZXJhYmxlXCIsIFwiYW5pbWF0ZWRcIl0pXHJcbn1cclxuXHJcbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IGRUICA9IHNjZW5lLmdhbWUuY2xvY2suZFRcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCB0aW1lTGVmdFxyXG4gIGxldCBjdXJyZW50SW5kZXhcclxuICBsZXQgY3VycmVudEFuaW1cclxuICBsZXQgY3VycmVudEZyYW1lXHJcbiAgbGV0IG5leHRGcmFtZVxyXG4gIGxldCBvdmVyc2hvb3RcclxuICBsZXQgc2hvdWxkQWR2YW5jZVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBlbnQgICAgICAgICAgID0gZW50aXRpZXNbaV0gXHJcbiAgICBjdXJyZW50SW5kZXggID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleFxyXG4gICAgY3VycmVudEFuaW0gICA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uXHJcbiAgICBjdXJyZW50RnJhbWUgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleF1cclxuICAgIG5leHRGcmFtZSAgICAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4ICsgMV0gfHwgY3VycmVudEFuaW0uZnJhbWVzWzBdXHJcbiAgICB0aW1lTGVmdCAgICAgID0gZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lXHJcbiAgICBvdmVyc2hvb3QgICAgID0gdGltZUxlZnQgLSBkVCAgIFxyXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXHJcbiAgICAgIFxyXG4gICAgaWYgKHNob3VsZEFkdmFuY2UpIHtcclxuICAgICAgZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcclxuICAgICAgZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lICAgICA9IG5leHRGcmFtZS5kdXJhdGlvbiArIG92ZXJzaG9vdCBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcclxuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XHJcblxyXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcclxuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcclxuXHJcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXHJcblxyXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxyXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxyXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcclxuICAgICAgeGhyLnNlbmQobnVsbClcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxyXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxyXG5cclxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXHJcblxyXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXHJcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXHJcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICBcclxuICAgIGkub25sb2FkICA9IG9ubG9hZFxyXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxyXG4gICAgaS5zcmMgICAgID0gcGF0aFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XHJcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxyXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXHJcblxyXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxyXG4gICAgfSkgXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xyXG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcclxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcclxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxyXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcclxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcclxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxyXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcclxuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XHJcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNvdW5kQ291bnQtLVxyXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICB0ZXh0dXJlQ291bnQtLVxyXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc2hhZGVyQ291bnQtLVxyXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcclxuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XHJcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxyXG5cclxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcclxuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cclxuXHJcbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBQYWRkbGVNb3ZlclN5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXHJcbn1cclxuXHJcblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtjbG9jaywgaW5wdXRNYW5hZ2VyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQge2tleWJvYXJkTWFuYWdlcn0gPSBpbnB1dE1hbmFnZXJcclxuICBsZXQgbW92ZVNwZWVkID0gMVxyXG4gIGxldCBwYWRkbGUgICAgPSBlbnRpdGllc1swXVxyXG5cclxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcclxuICBpZiAoIXBhZGRsZSkgcmV0dXJuXHJcblxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzldKSBwYWRkbGUucGh5c2ljcy54ICs9IGNsb2NrLmRUICogbW92ZVNwZWVkXHJcbn1cclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXHJcbn1cclxuXHJcblJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxyXG5cclxuICByZW5kZXJlci5mbHVzaCgpXHJcbiAgcmVuZGVyZXIuYWRkRW50aXRpZXMoZW50aXRpZXMpXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxyXG5cclxuLyogR0FNRVxyXG4gKiAgICBSRU5ERVJFUlxyXG4gKiAgICBBVURJTyBUSElOR1xyXG4gKiAgICBJTlBVVCBUSElOR1xyXG4gKiAgICBBU1NFVCBMT0FERVJcclxuICogICAgQVNTRVQgQ0FDSEVcclxuICogICAgRU5USVRZIFNUT1JFIC0tIGF0IHNpbXBsZXN0LCB0aGlzIGlzIGFuIGFycmF5IG9mIGVudGl0aWVzXHJcbiAqICAgIFNDRU5FTUFOQUdFUlxyXG4gKiAgICAgIFtTQ0VORVNdICAtLSBhbmFsb2dzIHRvIHByb2dyYW1zLiAgT25lIHByb2dyYW0gZXhlY3V0ZXMgYXQgYSB0aW1lXHJcbiAqICAgICAgICBTWVNURU1TXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU2NlbmUgKG5hbWUsIHN5c3RlbXMpIHtcclxuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxyXG5cclxuICB0aGlzLm5hbWUgICAgPSBuYW1lXHJcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xyXG4gIHRoaXMuZ2FtZSAgICA9IG51bGxcclxufVxyXG5cclxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgY2IobnVsbCwgbnVsbCkgIFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRUKSB7XHJcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IHN5c3RlbVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXHJcbiAgICBzeXN0ZW0ucnVuKHRoaXMsIHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcclxuXHJcbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XHJcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxyXG5cclxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcclxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xyXG5cclxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXHJcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxyXG5cclxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcclxuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcclxuXHJcbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcclxuICB9XHJcblxyXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcclxuXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cclxuICB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcclxuICB0aGlzLmNvbXBvbmVudE5hbWVzID0gY29tcG9uZW50TmFtZXNcclxufVxyXG5cclxuLy9zY2VuZS5nYW1lLmNsb2NrXHJcblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XHJcbn1cclxuIiwibGV0IHtQYWRkbGUsIEJsb2NrfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXHJcbmxldCBQYWRkbGVNb3ZlclN5c3RlbSAgICAgICA9IHJlcXVpcmUoXCIuL1BhZGRsZU1vdmVyU3lzdGVtXCIpXHJcbmxldCBSZW5kZXJpbmdTeXN0ZW0gICAgICAgICA9IHJlcXVpcmUoXCIuL1JlbmRlcmluZ1N5c3RlbVwiKVxyXG5sZXQgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gPSByZXF1aXJlKFwiLi9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbVwiKVxyXG5sZXQgU2NlbmUgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcclxuXHJcbmZ1bmN0aW9uIFRlc3RTY2VuZSAoKSB7XHJcbiAgbGV0IHN5c3RlbXMgPSBbXHJcbiAgICBuZXcgUGFkZGxlTW92ZXJTeXN0ZW0sIFxyXG4gICAgbmV3IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtLFxyXG4gICAgbmV3IFJlbmRlcmluZ1N5c3RlbVxyXG4gIF1cclxuXHJcbiAgU2NlbmUuY2FsbCh0aGlzLCBcInRlc3RcIiwgc3lzdGVtcylcclxufVxyXG5cclxuVGVzdFNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2NlbmUucHJvdG90eXBlKVxyXG5cclxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xyXG4gIGxldCB7Y2FjaGUsIGxvYWRlciwgZW50aXR5U3RvcmUsIGF1ZGlvU3lzdGVtfSA9IHRoaXMuZ2FtZSBcclxuICBsZXQge2JnfSA9IGF1ZGlvU3lzdGVtLmNoYW5uZWxzXHJcbiAgbGV0IGFzc2V0cyA9IHtcclxuICAgIC8vc291bmRzOiB7IGJnTXVzaWM6IFwiL3B1YmxpYy9zb3VuZHMvYmdtMS5tcDNcIiB9LFxyXG4gICAgdGV4dHVyZXM6IHsgXHJcbiAgICAgIHBhZGRsZTogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIsXHJcbiAgICAgIGJsb2NrczogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCJcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XHJcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxyXG5cclxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXHJcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA0NCwgMjIsIDgwMCwgODAwKSlcclxuICAgIC8vYmcudm9sdW1lID0gMFxyXG4gICAgLy9iZy5sb29wKGNhY2hlLnNvdW5kcy5iZ011c2ljKVxyXG4gICAgY2IobnVsbClcclxuICB9KVxyXG59XHJcbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljcywgUGxheWVyQ29udHJvbGxlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXHJcbmxldCB7QW5pbWF0ZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxyXG5sZXQgQW5pbWF0aW9uID0gcmVxdWlyZShcIi4vQW5pbWF0aW9uXCIpXHJcbmxldCBFbnRpdHkgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzLlBhZGRsZSA9IFBhZGRsZVxyXG5tb2R1bGUuZXhwb3J0cy5CbG9jayAgPSBCbG9ja1xyXG5cclxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxyXG59XHJcblxyXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIEFuaW1hdGVkKHRoaXMsIFwiaWRsZVwiLCB7XHJcbiAgICBpZGxlOiBuZXcgQW5pbWF0aW9uKDQ0LCAyMiwgMCwgMCwgMywgdHJ1ZSwgMTAwMClcclxuICB9KVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzLlJlbmRlcmFibGUgICAgICAgPSBSZW5kZXJhYmxlXHJcbm1vZHVsZS5leHBvcnRzLlBoeXNpY3MgICAgICAgICAgPSBQaHlzaWNzXHJcbm1vZHVsZS5leHBvcnRzLlBsYXllckNvbnRyb2xsZWQgPSBQbGF5ZXJDb250cm9sbGVkXHJcbm1vZHVsZS5leHBvcnRzLkFuaW1hdGVkICAgICAgICAgPSBBbmltYXRlZFxyXG5cclxuZnVuY3Rpb24gUmVuZGVyYWJsZSAoZSwgaW1hZ2UsIHdpZHRoLCBoZWlnaHQpIHtcclxuICBlLnJlbmRlcmFibGUgPSB7XHJcbiAgICBpbWFnZSxcclxuICAgIHdpZHRoLFxyXG4gICAgaGVpZ2h0LFxyXG4gICAgcm90YXRpb246IDAsXHJcbiAgICBjZW50ZXI6IHtcclxuICAgICAgeDogd2lkdGggLyAyLFxyXG4gICAgICB5OiBoZWlnaHQgLyAyIFxyXG4gICAgfSxcclxuICAgIHNjYWxlOiB7XHJcbiAgICAgIHg6IDEsXHJcbiAgICAgIHk6IDEgXHJcbiAgICB9XHJcbiAgfSBcclxuICByZXR1cm4gZVxyXG59XHJcblxyXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XHJcbiAgZS5waHlzaWNzID0ge1xyXG4gICAgd2lkdGgsIFxyXG4gICAgaGVpZ2h0LCBcclxuICAgIHgsIFxyXG4gICAgeSwgXHJcbiAgICBkeDogIDAsIFxyXG4gICAgZHk6ICAwLCBcclxuICAgIGRkeDogMCwgXHJcbiAgICBkZHk6IDBcclxuICB9XHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGxheWVyQ29udHJvbGxlZCAoZSkge1xyXG4gIGUucGxheWVyQ29udHJvbGxlZCA9IHRydWVcclxufVxyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWQgKGUsIGRlZmF1bHRBbmltYXRpb25OYW1lLCBhbmltSGFzaCkge1xyXG4gIGUuYW5pbWF0ZWQgPSB7XHJcbiAgICBhbmltYXRpb25zOiAgICAgICAgICAgIGFuaW1IYXNoLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbk5hbWU6ICBkZWZhdWx0QW5pbWF0aW9uTmFtZSxcclxuICAgIGN1cnJlbnRBbmltYXRpb25JbmRleDogMCxcclxuICAgIGN1cnJlbnRBbmltYXRpb246ICAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLFxyXG4gICAgdGltZVRpbGxOZXh0RnJhbWU6ICAgICBhbmltSGFzaFtkZWZhdWx0QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXHJcbiAgfSBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcclxubW9kdWxlLmV4cG9ydHMuaGFzS2V5cyAgID0gaGFzS2V5c1xyXG5cclxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXHJcbmZ1bmN0aW9uIGZpbmRXaGVyZSAoa2V5LCBwcm9wZXJ0eSwgYXJyYXlPZk9iamVjdHMpIHtcclxuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcclxuICBsZXQgaSAgICAgPSAtMVxyXG4gIGxldCBmb3VuZCA9IG51bGxcclxuXHJcbiAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XHJcbiAgICBpZiAoYXJyYXlPZk9iamVjdHNbaV1ba2V5XSA9PT0gcHJvcGVydHkpIHtcclxuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZm91bmRcclxufVxyXG5cclxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIFxyXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcclxuICByZXR1cm4gdHJ1ZVxyXG59XHJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxyXG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XHJcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcclxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxyXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcclxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcclxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XHJcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcclxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXHJcbiAgXHJcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxyXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxyXG5cclxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXHJcblxyXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBzcmMpXHJcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXHJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcclxuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxyXG5cclxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxyXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXHJcbiAgcmV0dXJuIHByb2dyYW1cclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxyXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xyXG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG5cclxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxyXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIHJldHVybiB0ZXh0dXJlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cclxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcclxuIiwibGV0IExvYWRlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgICAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgRW50aXR5U3RvcmUgICAgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXHJcbmxldCBDbG9jayAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxyXG5sZXQgQ2FjaGUgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5sZXQgU2NlbmUgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcclxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxyXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxyXG5sZXQgSW5wdXRNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXHJcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcclxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXHJcbmxldCBjYW52YXMgICAgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXHJcbmxldCB2ZXJ0ZXhTcmMgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZlcnRleFwiKS50ZXh0XHJcbmxldCBmcmFnU3JjICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZyYWdtZW50XCIpLnRleHRcclxuXHJcbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDI1XHJcbmNvbnN0IE1BWF9DT1VOVCAgICAgICA9IDEwMDBcclxuXHJcbmxldCBrZXlib2FyZE1hbmFnZXIgPSBuZXcgS2V5Ym9hcmRNYW5hZ2VyKGRvY3VtZW50KVxyXG5sZXQgaW5wdXRNYW5hZ2VyICAgID0gbmV3IElucHV0TWFuYWdlcihrZXlib2FyZE1hbmFnZXIpXHJcbmxldCByZW5kZXJlck9wdHMgICAgPSB7IG1heFNwcml0ZUNvdW50OiBNQVhfQ09VTlQgfVxyXG5sZXQgZW50aXR5U3RvcmUgICAgID0gbmV3IEVudGl0eVN0b3JlXHJcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXHJcbmxldCBjYWNoZSAgICAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXHJcbmxldCBsb2FkZXIgICAgICAgICAgPSBuZXcgTG9hZGVyXHJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIHZlcnRleFNyYywgZnJhZ1NyYywgcmVuZGVyZXJPcHRzKVxyXG5sZXQgYXVkaW9TeXN0ZW0gICAgID0gbmV3IEF1ZGlvU3lzdGVtKFtcIm1haW5cIiwgXCJiZ1wiXSlcclxubGV0IHNjZW5lTWFuYWdlciAgICA9IG5ldyBTY2VuZU1hbmFnZXIoW25ldyBUZXN0U2NlbmVdKVxyXG5sZXQgZ2FtZSAgICAgICAgICAgID0gbmV3IEdhbWUoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIGVudGl0eVN0b3JlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcclxuXHJcbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGNsb2NrICAgICAgICAgID0gZ2FtZS5jbG9ja1xyXG4gIGxldCBpbnB1dE1hbmFnZXIgICA9IGdhbWUuaW5wdXRNYW5hZ2VyXHJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XHJcbiAgICBjbG9jay50aWNrKClcclxuICAgIGlucHV0TWFuYWdlci5rZXlib2FyZE1hbmFnZXIudGljayhjbG9jay5kVClcclxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZShjbG9jay5kVClcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xyXG4gICAgZ2FtZS5yZW5kZXJlci5yZW5kZXIoKVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5nYW1lID0gZ2FtZVxyXG5cclxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgfSlcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxyXG4gIGdhbWUuc3RhcnQoKVxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcclxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXHJcbn0pXHJcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXHJcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcbiJdfQ==
