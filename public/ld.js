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

function Batch(size) {
  this.count = 0;
  this.boxes = BoxArray(size);
  this.centers = CenterArray(size);
  this.scales = ScaleArray(size);
  this.rotations = RotationArray(size);
  this.texCoords = TextureCoordinatesArray(size);
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

  var imageToTextureMap = new Map();
  var textureToBatchMap = new Map();

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

  this.addBatch = function (texture) {
    textureToBatchMap.set(texture, new Batch(maxSpriteCount));
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
    return textureToBatchMap.forEach(resetBatch);
  };

  this.render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080);
    textureToBatchMap.forEach(drawBatch);
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
  var len = entities.length;
  var i = -1;
  var ent;
  var frame;

  renderer.flush();

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

},{"./System":18}],16:[function(require,module,exports){
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./Game":9,"./InputManager":10,"./KeyboardManager":11,"./Loader":13,"./SceneManager":17,"./TestScene":19}],26:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FB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Q0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBBQUJCICh3LCBoLCB4LCB5KSB7XHJcbiAgdGhpcy54ID0geFxyXG4gIHRoaXMueSA9IHlcclxuICB0aGlzLncgPSB3XHJcbiAgdGhpcy5oID0gaFxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHhcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geCB9IFxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx5XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHkgfSBcclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeFwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB4ICsgdyB9XHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnlcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geSArIGggfVxyXG4gIH0pXHJcbn1cclxuIiwibGV0IEFBQkIgPSByZXF1aXJlKFwiLi9BQUJCXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvblxyXG5cclxuZnVuY3Rpb24gRnJhbWUgKGFhYmIsIGR1cmF0aW9uKSB7XHJcbiAgdGhpcy5hYWJiICAgICA9IGFhYmJcclxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cclxufVxyXG5cclxuLy9yYXRlIGlzIGluIG1zLiAgVGhpcyBpcyB0aGUgdGltZSBwZXIgZnJhbWUgKDQyIH4gMjRmcHMpXHJcbmZ1bmN0aW9uIEFuaW1hdGlvbiAoZnJhbWVzLCBkb2VzTG9vcCwgcmF0ZT00Mikge1xyXG4gIHRoaXMubG9vcCAgID0gZG9lc0xvb3BcclxuICB0aGlzLnJhdGUgICA9IHJhdGVcclxuICB0aGlzLmZyYW1lcyA9IGZyYW1lc1xyXG59XHJcblxyXG5BbmltYXRpb24uY3JlYXRlTGluZWFyID0gZnVuY3Rpb24gKHcsIGgsIHgsIHksIGNvdW50LCBkb2VzTG9vcCwgcmF0ZT00Mikge1xyXG4gIGxldCBmcmFtZXMgPSBbXVxyXG4gIGxldCBpICAgICAgPSAtMVxyXG4gIGxldCBlYWNoWFxyXG4gIGxldCBhYWJiXHJcblxyXG4gIHdoaWxlICgrK2kgPCBjb3VudCkge1xyXG4gICAgZWFjaFggPSB4ICsgaSAqIHdcclxuICAgIGFhYmIgID0gbmV3IEFBQkIodywgaCwgZWFjaFgsIHkpXHJcbiAgICBmcmFtZXMucHVzaChuZXcgRnJhbWUoYWFiYiwgcmF0ZSkpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IEFuaW1hdGlvbihmcmFtZXMsIGRvZXNMb29wLCByYXRlKVxyXG59XHJcbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcclxuICBsZXQgY2hhbm5lbCA9IGNvbnRleHQuY3JlYXRlR2FpbigpXHJcbiAgXHJcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcclxuICAgIHNyYy5jb25uZWN0KHBhbm5lcilcclxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxyXG4gIH1cclxuXHJcbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcclxuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xyXG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxyXG5cclxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcclxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcclxuXHJcbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXHJcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcclxuICAgICAgc3JjLnN0YXJ0KDApXHJcbiAgICAgIHJldHVybiBzcmNcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsLmdhaW4udmFsdWUgfSxcclxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XHJcbiAgfSlcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbCB9XHJcbiAgfSlcclxuXHJcbiAgdGhpcy5uYW1lID0gbmFtZVxyXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcclxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcclxuICBsZXQgY29udGV4dCAgPSBuZXcgQXVkaW9Db250ZXh0XHJcbiAgbGV0IGNoYW5uZWxzID0ge31cclxuICBsZXQgaSAgICAgICAgPSAtMVxyXG5cclxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcclxuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXHJcbiAgfVxyXG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxyXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FjaGUgKGtleU5hbWVzKSB7XHJcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBDbG9ja1xyXG5cclxuZnVuY3Rpb24gQ2xvY2sgKHRpbWVGbj1EYXRlLm5vdykge1xyXG4gIHRoaXMub2xkVGltZSA9IHRpbWVGbigpXHJcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcclxuICB0aGlzLmRUID0gMFxyXG4gIHRoaXMudGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxyXG4gICAgdGhpcy5uZXdUaW1lID0gdGltZUZuKCkgIFxyXG4gICAgdGhpcy5kVCAgICAgID0gdGhpcy5uZXdUaW1lIC0gdGhpcy5vbGRUaW1lXHJcbiAgfVxyXG59XHJcbiIsIi8vdGhpcyBkb2VzIGxpdGVyYWxseSBub3RoaW5nLiAgaXQncyBhIHNoZWxsIHRoYXQgaG9sZHMgY29tcG9uZW50c1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxyXG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXHJcblxyXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAobWF4PTEwMDApIHtcclxuICB0aGlzLmVudGl0aWVzICA9IFtdXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcclxuICBsZXQgaWQgPSB0aGlzLmVudGl0aWVzLmxlbmd0aFxyXG5cclxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcclxuICByZXR1cm4gaWRcclxufVxyXG5cclxuRW50aXR5U3RvcmUucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKGNvbXBvbmVudE5hbWVzKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIGxldCBlbnRpdHlcclxuXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG5cclxuICB3aGlsZSAodGhpcy5lbnRpdGllc1srK2ldKSB7XHJcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXHJcbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXHJcbiAgfVxyXG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxyXG59XHJcbiIsImxldCB7U2hhZGVyLCBQcm9ncmFtLCBUZXh0dXJlfSA9IHJlcXVpcmUoXCIuL2dsLXR5cGVzXCIpXHJcbmxldCB7dXBkYXRlQnVmZmVyfSA9IHJlcXVpcmUoXCIuL2dsLWJ1ZmZlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHTFJlbmRlcmVyXHJcblxyXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXHJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcclxuXHJcbmZ1bmN0aW9uIHNldEJveCAoYm94QXJyYXksIGluZGV4LCB3LCBoLCB4LCB5KSB7XHJcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XHJcbiAgbGV0IHgxID0geFxyXG4gIGxldCB5MSA9IHkgXHJcbiAgbGV0IHgyID0geCArIHdcclxuICBsZXQgeTIgPSB5ICsgaFxyXG5cclxuICBib3hBcnJheVtpXSAgICA9IHgxXHJcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxyXG4gIGJveEFycmF5W2krMl0gID0geDJcclxuICBib3hBcnJheVtpKzNdICA9IHkxXHJcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxyXG4gIGJveEFycmF5W2krNV0gID0geTJcclxuXHJcbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxyXG4gIGJveEFycmF5W2krN10gID0geTJcclxuICBib3hBcnJheVtpKzhdICA9IHgyXHJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxyXG4gIGJveEFycmF5W2krMTBdID0geDJcclxuICBib3hBcnJheVtpKzExXSA9IHkyXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG59XHJcblxyXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xyXG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXHJcblxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xyXG4gICAgYXJbaV0gICAgPSAwXHJcbiAgICBhcltpKzFdICA9IDBcclxuICAgIGFyW2krMl0gID0gMVxyXG4gICAgYXJbaSszXSAgPSAwXHJcbiAgICBhcltpKzRdICA9IDBcclxuICAgIGFyW2krNV0gID0gMVxyXG5cclxuICAgIGFyW2krNl0gID0gMFxyXG4gICAgYXJbaSs3XSAgPSAxXHJcbiAgICBhcltpKzhdICA9IDFcclxuICAgIGFyW2krOV0gID0gMFxyXG4gICAgYXJbaSsxMF0gPSAxXHJcbiAgICBhcltpKzExXSA9IDFcclxuICB9IFxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBCYXRjaCAoc2l6ZSkge1xyXG4gIHRoaXMuY291bnQgICAgICA9IDBcclxuICB0aGlzLmJveGVzICAgICAgPSBCb3hBcnJheShzaXplKVxyXG4gIHRoaXMuY2VudGVycyAgICA9IENlbnRlckFycmF5KHNpemUpXHJcbiAgdGhpcy5zY2FsZXMgICAgID0gU2NhbGVBcnJheShzaXplKVxyXG4gIHRoaXMucm90YXRpb25zICA9IFJvdGF0aW9uQXJyYXkoc2l6ZSlcclxuICB0aGlzLnRleENvb3JkcyAgPSBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheShzaXplKVxyXG59XHJcblxyXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcclxuICBsZXQge21heFNwcml0ZUNvdW50LCB3aWR0aCwgaGVpZ2h0fSA9IG9wdGlvbnNcclxuICBsZXQgbWF4U3ByaXRlQ291bnQgPSBtYXhTcHJpdGVDb3VudCB8fCAxMDBcclxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcclxuICBsZXQgZ2wgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpICAgICAgXHJcbiAgbGV0IHZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxyXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxyXG4gIGxldCBwcm9ncmFtICAgICAgICA9IFByb2dyYW0oZ2wsIHZzLCBmcylcclxuXHJcbiAgLy9oYW5kbGVzIHRvIEdQVSBidWZmZXJzXHJcbiAgbGV0IGJveEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgY2VudGVyQnVmZmVyICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHJvdGF0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgdGV4Q29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG5cclxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXHJcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIilcclxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxyXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcclxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXHJcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcclxuXHJcbiAgLy9Vbmlmb3JtIGxvY2F0aW9uc1xyXG4gIGxldCB3b3JsZFNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXHJcblxyXG4gIGxldCBpbWFnZVRvVGV4dHVyZU1hcCA9IG5ldyBNYXAoKVxyXG4gIGxldCB0ZXh0dXJlVG9CYXRjaE1hcCA9IG5ldyBNYXAoKVxyXG5cclxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXHJcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcclxuICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDAuMClcclxuICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSlcclxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuXHJcbiAgdGhpcy5kaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcclxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuc2V0KHRleHR1cmUsIG5ldyBCYXRjaChtYXhTcHJpdGVDb3VudCkpXHJcbiAgICByZXR1cm4gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHRleHR1cmUpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcclxuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcclxuXHJcbiAgICBpbWFnZVRvVGV4dHVyZU1hcC5zZXQoaW1hZ2UsIHRleHR1cmUpXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7IFxyXG4gICAgcmV0dXJuIHRleHR1cmVcclxuICB9XHJcblxyXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcclxuICAgIGxldCByYXRpbyAgICAgICA9IHRoaXMuZGltZW5zaW9ucy53aWR0aCAvIHRoaXMuZGltZW5zaW9ucy5oZWlnaHRcclxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XHJcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xyXG4gICAgbGV0IG5ld1dpZHRoICAgID0gdXNlV2lkdGggPyB3aWR0aCA6IChoZWlnaHQgKiByYXRpbykgXHJcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxyXG5cclxuICAgIGNhbnZhcy53aWR0aCAgPSBuZXdXaWR0aCBcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXHJcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRTcHJpdGUgPSAoaW1hZ2UsIHcsIGgsIHgsIHksIHRleHcsIHRleGgsIHRleHgsIHRleHkpID0+IHtcclxuICAgIGxldCB0eCAgICA9IGltYWdlVG9UZXh0dXJlTWFwLmdldChpbWFnZSkgfHwgdGhpcy5hZGRUZXh0dXJlKGltYWdlKVxyXG4gICAgbGV0IGJhdGNoID0gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHR4KSB8fCB0aGlzLmFkZEJhdGNoKHR4KVxyXG5cclxuICAgIHNldEJveChiYXRjaC5ib3hlcywgYmF0Y2guY291bnQsIHcsIGgsIHgsIHkpXHJcbiAgICBzZXRCb3goYmF0Y2gudGV4Q29vcmRzLCBiYXRjaC5jb3VudCwgdGV4dywgdGV4aCwgdGV4eCwgdGV4eSlcclxuICAgIGJhdGNoLmNvdW50KytcclxuICB9XHJcblxyXG4gIGxldCByZXNldEJhdGNoID0gKGJhdGNoKSA9PiBiYXRjaC5jb3VudCA9IDBcclxuXHJcbiAgbGV0IGRyYXdCYXRjaCA9IChiYXRjaCwgdGV4dHVyZSkgPT4ge1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgYm94QnVmZmVyLCBib3hMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC5ib3hlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHJvdGF0aW9uQnVmZmVyLCByb3RMb2NhdGlvbiwgMSwgcm90YXRpb25zKVxyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC50ZXhDb29yZHMpXHJcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYmF0Y2guY291bnQgKiBQT0lOVFNfUEVSX0JPWClcclxuICAgIFxyXG4gIH1cclxuXHJcbiAgdGhpcy5mbHVzaCA9ICgpID0+IHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2gocmVzZXRCYXRjaClcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSAoKSA9PiB7XHJcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxyXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcclxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcclxuICAgIHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2goZHJhd0JhdGNoKVxyXG4gIH1cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgSW5wdXRNYW5hZ2VyID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXHJcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxyXG5sZXQgTG9hZGVyICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXHJcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXHJcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxyXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxyXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVcclxuXHJcbi8vOjogQ2xvY2sgLT4gQ2FjaGUgLT4gTG9hZGVyIC0+IEdMUmVuZGVyZXIgLT4gQXVkaW9TeXN0ZW0gLT4gRW50aXR5U3RvcmUgLT4gU2NlbmVNYW5hZ2VyXHJcbmZ1bmN0aW9uIEdhbWUgKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgXHJcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcclxuICBjaGVja1R5cGUoY2xvY2ssIENsb2NrKVxyXG4gIGNoZWNrVHlwZShjYWNoZSwgQ2FjaGUpXHJcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxyXG4gIGNoZWNrVHlwZShsb2FkZXIsIExvYWRlcilcclxuICBjaGVja1R5cGUocmVuZGVyZXIsIEdMUmVuZGVyZXIpXHJcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcclxuICBjaGVja1R5cGUoZW50aXR5U3RvcmUsIEVudGl0eVN0b3JlKVxyXG4gIGNoZWNrVHlwZShzY2VuZU1hbmFnZXIsIFNjZW5lTWFuYWdlcilcclxuXHJcbiAgdGhpcy5jbG9jayAgICAgICAgPSBjbG9ja1xyXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXHJcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcclxuICB0aGlzLmlucHV0TWFuYWdlciA9IGlucHV0TWFuYWdlclxyXG4gIHRoaXMucmVuZGVyZXIgICAgID0gcmVuZGVyZXJcclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXHJcbiAgdGhpcy5lbnRpdHlTdG9yZSAgPSBlbnRpdHlTdG9yZVxyXG4gIHRoaXMuc2NlbmVNYW5hZ2VyID0gc2NlbmVNYW5hZ2VyXHJcblxyXG4gIC8vSW50cm9kdWNlIGJpLWRpcmVjdGlvbmFsIHJlZmVyZW5jZSB0byBnYW1lIG9iamVjdCBvbnRvIGVhY2ggc2NlbmVcclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcclxuICB9XHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gIGxldCBzdGFydFNjZW5lID0gdGhpcy5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmVcclxuXHJcbiAgY29uc29sZS5sb2coXCJjYWxsaW5nIHNldHVwIGZvciBcIiArIHN0YXJ0U2NlbmUubmFtZSlcclxuICBzdGFydFNjZW5lLnNldHVwKChlcnIpID0+IGNvbnNvbGUubG9nKFwic2V0dXAgY29tcGxldGVkXCIpKVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xyXG59XHJcbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW5wdXRNYW5hZ2VyXHJcblxyXG4vL1RPRE86IGNvdWxkIHRha2UgbW91c2VNYW5hZ2VyIGFuZCBnYW1lcGFkIG1hbmFnZXI/XHJcbmZ1bmN0aW9uIElucHV0TWFuYWdlciAoa2V5Ym9hcmRNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxyXG4gIHRoaXMua2V5Ym9hcmRNYW5hZ2VyID0ga2V5Ym9hcmRNYW5hZ2VyIFxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXHJcblxyXG5jb25zdCBLRVlfQ09VTlQgPSAyNTZcclxuXHJcbmZ1bmN0aW9uIEtleWJvYXJkTWFuYWdlciAoZG9jdW1lbnQpIHtcclxuICBsZXQgaXNEb3ducyAgICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQganVzdFVwcyAgICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQgZG93bkR1cmF0aW9ucyA9IG5ldyBVaW50MzJBcnJheShLRVlfQ09VTlQpXHJcbiAgXHJcbiAgbGV0IGhhbmRsZUtleURvd24gPSAoe2tleUNvZGV9KSA9PiB7XHJcbiAgICBqdXN0RG93bnNba2V5Q29kZV0gPSAhaXNEb3duc1trZXlDb2RlXVxyXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdFVwc1trZXlDb2RlXSAgID0gdHJ1ZVxyXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gZmFsc2VcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVCbHVyID0gKCkgPT4ge1xyXG4gICAgbGV0IGkgPSAtMVxyXG5cclxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcclxuICAgICAgaXNEb3duc1tpXSAgID0gMFxyXG4gICAgICBqdXN0RG93bnNbaV0gPSAwXHJcbiAgICAgIGp1c3RVcHNbaV0gICA9IDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcclxuICB0aGlzLmp1c3RVcHMgICAgICAgPSBqdXN0VXBzXHJcbiAgdGhpcy5qdXN0RG93bnMgICAgID0ganVzdERvd25zXHJcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xyXG5cclxuICB0aGlzLnRpY2sgPSAoZFQpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSBmYWxzZVxyXG4gICAgICBpZiAoaXNEb3duc1tpXSkgZG93bkR1cmF0aW9uc1tpXSArPSBkVFxyXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGhhbmRsZUtleURvd24pXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGhhbmRsZUtleVVwKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXHJcbn1cclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbVxyXG5cclxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xyXG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInJlbmRlcmFibGVcIiwgXCJhbmltYXRlZFwiXSlcclxufVxyXG5cclxuS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQgZFQgID0gc2NlbmUuZ2FtZS5jbG9jay5kVFxyXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcclxuICBsZXQgaSAgID0gLTFcclxuICBsZXQgZW50XHJcbiAgbGV0IHRpbWVMZWZ0XHJcbiAgbGV0IGN1cnJlbnRJbmRleFxyXG4gIGxldCBjdXJyZW50QW5pbVxyXG4gIGxldCBjdXJyZW50RnJhbWVcclxuICBsZXQgbmV4dEZyYW1lXHJcbiAgbGV0IG92ZXJzaG9vdFxyXG4gIGxldCBzaG91bGRBZHZhbmNlXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcclxuICAgIGN1cnJlbnRJbmRleCAgPSBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbkluZGV4XHJcbiAgICBjdXJyZW50QW5pbSAgID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25cclxuICAgIGN1cnJlbnRGcmFtZSAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4XVxyXG4gICAgbmV4dEZyYW1lICAgICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXggKyAxXSB8fCBjdXJyZW50QW5pbS5mcmFtZXNbMF1cclxuICAgIHRpbWVMZWZ0ICAgICAgPSBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWVcclxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXHJcbiAgICBzaG91bGRBZHZhbmNlID0gb3ZlcnNob290IDw9IDBcclxuICAgICAgXHJcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xyXG4gICAgICBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbkluZGV4ID0gY3VycmVudEFuaW0uZnJhbWVzLmluZGV4T2YobmV4dEZyYW1lKVxyXG4gICAgICBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWUgICAgID0gbmV4dEZyYW1lLmR1cmF0aW9uICsgb3ZlcnNob290IFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lID0gb3ZlcnNob290IFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xyXG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcclxuXHJcbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xyXG4gICAgICBpZiAoIXBhdGgpIHJldHVybiBjYihuZXcgRXJyb3IoXCJObyBwYXRoIHByb3ZpZGVkXCIpKVxyXG5cclxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcclxuXHJcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXHJcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXHJcbiAgICAgIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxyXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxyXG4gICAgICB4aHIuc2VuZChudWxsKVxyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGxldCBsb2FkQnVmZmVyID0gbG9hZFhIUihcImFycmF5YnVmZmVyXCIpXHJcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXHJcblxyXG4gIHRoaXMubG9hZFNoYWRlciA9IGxvYWRTdHJpbmdcclxuXHJcbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xyXG4gICAgbGV0IGkgICAgICAgPSBuZXcgSW1hZ2VcclxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcclxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgIFxyXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXHJcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXHJcbiAgICBpLnNyYyAgICAgPSBwYXRoXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRTb3VuZCA9IChwYXRoLCBjYikgPT4ge1xyXG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcclxuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXHJcbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gY2JcclxuXHJcbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXHJcbiAgICB9KSBcclxuICB9XHJcblxyXG4gIHRoaXMubG9hZEFzc2V0cyA9ICh7c291bmRzLCB0ZXh0dXJlcywgc2hhZGVyc30sIGNiKSA9PiB7XHJcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzIHx8IHt9KVxyXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxyXG4gICAgbGV0IHNoYWRlcktleXMgICA9IE9iamVjdC5rZXlzKHNoYWRlcnMgfHwge30pXHJcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxyXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxyXG4gICAgbGV0IHNoYWRlckNvdW50ICA9IHNoYWRlcktleXMubGVuZ3RoXHJcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IGsgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xyXG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcclxuICAgICAgaWYgKHNvdW5kQ291bnQgPD0gMCAmJiB0ZXh0dXJlQ291bnQgPD0gMCAmJiBzaGFkZXJDb3VudCA8PSAwKSBjYihudWxsLCBvdXQpIFxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclNvdW5kID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc291bmRDb3VudC0tXHJcbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyVGV4dHVyZSA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHRleHR1cmVDb3VudC0tXHJcbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTaGFkZXIgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICBzaGFkZXJDb3VudC0tXHJcbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlIChzb3VuZEtleXNbKytpXSkge1xyXG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXHJcblxyXG4gICAgICB0aGlzLmxvYWRTb3VuZChzb3VuZHNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcclxuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXHJcblxyXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xyXG4gICAgICBsZXQga2V5ID0gc2hhZGVyS2V5c1trXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyU2hhZGVyKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9hZGVyXHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFkZGxlTW92ZXJTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicGxheWVyQ29udHJvbGxlZFwiXSlcclxufVxyXG5cclxuUGFkZGxlTW92ZXJTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQge2Nsb2NrLCBpbnB1dE1hbmFnZXJ9ID0gc2NlbmUuZ2FtZVxyXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxyXG4gIGxldCBtb3ZlU3BlZWQgPSAxXHJcbiAgbGV0IHBhZGRsZSAgICA9IGVudGl0aWVzWzBdXHJcblxyXG4gIC8vY2FuIGhhcHBlbiBkdXJpbmcgbG9hZGluZyBmb3IgZXhhbXBsZVxyXG4gIGlmICghcGFkZGxlKSByZXR1cm5cclxuXHJcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM3XSkgcGFkZGxlLnBoeXNpY3MueCAtPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szOV0pIHBhZGRsZS5waHlzaWNzLnggKz0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxufVxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmluZ1N5c3RlbVxyXG5cclxuZnVuY3Rpb24gUmVuZGVyaW5nU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicmVuZGVyYWJsZVwiXSlcclxufVxyXG5cclxuUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtyZW5kZXJlcn0gPSBzY2VuZS5nYW1lXHJcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxyXG4gIGxldCBpICAgPSAtMVxyXG4gIGxldCBlbnRcclxuICBsZXQgZnJhbWVcclxuXHJcbiAgcmVuZGVyZXIuZmx1c2goKVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBlbnQgPSBlbnRpdGllc1tpXVxyXG5cclxuICAgIGlmIChlbnQuYW5pbWF0ZWQpIHtcclxuICAgICAgZnJhbWUgPSBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbi5mcmFtZXNbZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleF1cclxuICAgICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxyXG4gICAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXHJcbiAgICAgICAgZW50LnBoeXNpY3Mud2lkdGgsXHJcbiAgICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxyXG4gICAgICAgIGVudC5waHlzaWNzLngsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueSxcclxuICAgICAgICBmcmFtZS5hYWJiLncgLyBlbnQucmVuZGVyYWJsZS5pbWFnZS53aWR0aCxcclxuICAgICAgICBmcmFtZS5hYWJiLmggLyBlbnQucmVuZGVyYWJsZS5pbWFnZS5oZWlnaHQsXHJcbiAgICAgICAgZnJhbWUuYWFiYi54IC8gZW50LnJlbmRlcmFibGUuaW1hZ2Uud2lkdGgsXHJcbiAgICAgICAgZnJhbWUuYWFiYi55IC8gZW50LnJlbmRlcmFibGUuaW1hZ2UuaGVpZ2h0XHJcbiAgICAgIClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlbmRlcmVyLmFkZFNwcml0ZShcclxuICAgICAgICBlbnQucmVuZGVyYWJsZS5pbWFnZSwgLy9pbWFnZVxyXG4gICAgICAgIGVudC5waHlzaWNzLndpZHRoLFxyXG4gICAgICAgIGVudC5waHlzaWNzLmhlaWdodCxcclxuICAgICAgICBlbnQucGh5c2ljcy54LFxyXG4gICAgICAgIGVudC5waHlzaWNzLnksXHJcbiAgICAgICAgMSwgIC8vdGV4dHVyZSB3aWR0aFxyXG4gICAgICAgIDEsICAvL3RleHR1cmUgaGVpZ2h0XHJcbiAgICAgICAgMCwgIC8vdGV4dHVyZSB4XHJcbiAgICAgICAgMCAgIC8vdGV4dHVyZSB5XHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxyXG5cclxuZnVuY3Rpb24gU2NlbmUgKG5hbWUsIHN5c3RlbXMpIHtcclxuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxyXG5cclxuICB0aGlzLm5hbWUgICAgPSBuYW1lXHJcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xyXG4gIHRoaXMuZ2FtZSAgICA9IG51bGxcclxufVxyXG5cclxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgY2IobnVsbCwgbnVsbCkgIFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRUKSB7XHJcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IHN5c3RlbVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXHJcbiAgICBzeXN0ZW0ucnVuKHRoaXMsIHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcclxuXHJcbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XHJcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxyXG5cclxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcclxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xyXG5cclxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXHJcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxyXG5cclxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcclxuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcclxuXHJcbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcclxuICB9XHJcblxyXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcclxuXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cclxuICB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcclxuICB0aGlzLmNvbXBvbmVudE5hbWVzID0gY29tcG9uZW50TmFtZXNcclxufVxyXG5cclxuLy9zY2VuZS5nYW1lLmNsb2NrXHJcblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XHJcbn1cclxuIiwibGV0IHtQYWRkbGUsIEJsb2NrLCBGaWdodGVyfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXHJcbmxldCBQYWRkbGVNb3ZlclN5c3RlbSAgICAgICA9IHJlcXVpcmUoXCIuL1BhZGRsZU1vdmVyU3lzdGVtXCIpXHJcbmxldCBSZW5kZXJpbmdTeXN0ZW0gICAgICAgICA9IHJlcXVpcmUoXCIuL1JlbmRlcmluZ1N5c3RlbVwiKVxyXG5sZXQgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gPSByZXF1aXJlKFwiLi9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbVwiKVxyXG5sZXQgU2NlbmUgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcclxuXHJcbmZ1bmN0aW9uIFRlc3RTY2VuZSAoKSB7XHJcbiAgbGV0IHN5c3RlbXMgPSBbXHJcbiAgICBuZXcgUGFkZGxlTW92ZXJTeXN0ZW0sIFxyXG4gICAgbmV3IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtLFxyXG4gICAgbmV3IFJlbmRlcmluZ1N5c3RlbVxyXG4gIF1cclxuXHJcbiAgU2NlbmUuY2FsbCh0aGlzLCBcInRlc3RcIiwgc3lzdGVtcylcclxufVxyXG5cclxuVGVzdFNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2NlbmUucHJvdG90eXBlKVxyXG5cclxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xyXG4gIGxldCB7Y2FjaGUsIGxvYWRlciwgZW50aXR5U3RvcmUsIGF1ZGlvU3lzdGVtfSA9IHRoaXMuZ2FtZSBcclxuICBsZXQge2JnfSA9IGF1ZGlvU3lzdGVtLmNoYW5uZWxzXHJcbiAgbGV0IGFzc2V0cyA9IHtcclxuICAgIC8vc291bmRzOiB7IGJnTXVzaWM6IFwiL3B1YmxpYy9zb3VuZHMvYmdtMS5tcDNcIiB9LFxyXG4gICAgdGV4dHVyZXM6IHsgXHJcbiAgICAgIHBhZGRsZTogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcGFkZGxlLnBuZ1wiLFxyXG4gICAgICBibG9ja3M6ICBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL2Jsb2Nrcy5wbmdcIixcclxuICAgICAgZmlnaHRlcjogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wdW5jaC5wbmdcIlxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcclxuICAgIGxldCB7dGV4dHVyZXMsIHNvdW5kc30gPSBsb2FkZWRBc3NldHMgXHJcblxyXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcclxuICAgIGNhY2hlLnRleHR1cmVzID0gdGV4dHVyZXNcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgUGFkZGxlKHRleHR1cmVzLnBhZGRsZSwgMTEyLCAyNSwgNDAwLCA0MDApKVxyXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBCbG9jayh0ZXh0dXJlcy5ibG9ja3MsIDQ0LCAyMiwgODAwLCA4MDApKVxyXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBGaWdodGVyKHRleHR1cmVzLmZpZ2h0ZXIsIDc2LCA1OSwgNTAwLCA1MDApKVxyXG4gICAgLy9iZy52b2x1bWUgPSAwXHJcbiAgICAvL2JnLmxvb3AoY2FjaGUuc291bmRzLmJnTXVzaWMpXHJcbiAgICBjYihudWxsKVxyXG4gIH0pXHJcbn1cclxuIiwibGV0IHtSZW5kZXJhYmxlLCBQaHlzaWNzLCBQbGF5ZXJDb250cm9sbGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcclxubGV0IHtBbmltYXRlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXHJcbmxldCBBbmltYXRpb24gPSByZXF1aXJlKFwiLi9BbmltYXRpb25cIilcclxubGV0IEVudGl0eSAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMuUGFkZGxlICA9IFBhZGRsZVxyXG5tb2R1bGUuZXhwb3J0cy5CbG9jayAgID0gQmxvY2tcclxubW9kdWxlLmV4cG9ydHMuRmlnaHRlciA9IEZpZ2h0ZXJcclxuXHJcbmZ1bmN0aW9uIFBhZGRsZSAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIFBsYXllckNvbnRyb2xsZWQodGhpcylcclxufVxyXG5cclxuZnVuY3Rpb24gQmxvY2sgKGltYWdlLCB3LCBoLCB4LCB5KSB7XHJcbiAgRW50aXR5LmNhbGwodGhpcylcclxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBBbmltYXRlZCh0aGlzLCBcImlkbGVcIiwge1xyXG4gICAgaWRsZTogQW5pbWF0aW9uLmNyZWF0ZUxpbmVhcig0NCwgMjIsIDAsIDAsIDMsIHRydWUsIDEwMDApXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gRmlnaHRlciAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIEFuaW1hdGVkKHRoaXMsIFwiZmlyZWJhbGxcIiwge1xyXG4gICAgZmlyZWJhbGw6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoMTc0LCAxMzQsIDAsIDAsIDI1LCB0cnVlKVxyXG4gIH0pXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuUmVuZGVyYWJsZSAgICAgICA9IFJlbmRlcmFibGVcclxubW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICAgICAgICA9IFBoeXNpY3NcclxubW9kdWxlLmV4cG9ydHMuUGxheWVyQ29udHJvbGxlZCA9IFBsYXllckNvbnRyb2xsZWRcclxubW9kdWxlLmV4cG9ydHMuQW5pbWF0ZWQgICAgICAgICA9IEFuaW1hdGVkXHJcblxyXG5mdW5jdGlvbiBSZW5kZXJhYmxlIChlLCBpbWFnZSwgd2lkdGgsIGhlaWdodCkge1xyXG4gIGUucmVuZGVyYWJsZSA9IHtcclxuICAgIGltYWdlLFxyXG4gICAgd2lkdGgsXHJcbiAgICBoZWlnaHQsXHJcbiAgICByb3RhdGlvbjogMCxcclxuICAgIGNlbnRlcjoge1xyXG4gICAgICB4OiB3aWR0aCAvIDIsXHJcbiAgICAgIHk6IGhlaWdodCAvIDIgXHJcbiAgICB9LFxyXG4gICAgc2NhbGU6IHtcclxuICAgICAgeDogMSxcclxuICAgICAgeTogMSBcclxuICAgIH1cclxuICB9IFxyXG4gIHJldHVybiBlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcclxuICBlLnBoeXNpY3MgPSB7XHJcbiAgICB3aWR0aCwgXHJcbiAgICBoZWlnaHQsIFxyXG4gICAgeCwgXHJcbiAgICB5LCBcclxuICAgIGR4OiAgMCwgXHJcbiAgICBkeTogIDAsIFxyXG4gICAgZGR4OiAwLCBcclxuICAgIGRkeTogMFxyXG4gIH1cclxuICByZXR1cm4gZVxyXG59XHJcblxyXG5mdW5jdGlvbiBQbGF5ZXJDb250cm9sbGVkIChlKSB7XHJcbiAgZS5wbGF5ZXJDb250cm9sbGVkID0gdHJ1ZVxyXG59XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZCAoZSwgZGVmYXVsdEFuaW1hdGlvbk5hbWUsIGFuaW1IYXNoKSB7XHJcbiAgZS5hbmltYXRlZCA9IHtcclxuICAgIGFuaW1hdGlvbnM6ICAgICAgICAgICAgYW5pbUhhc2gsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uTmFtZTogIGRlZmF1bHRBbmltYXRpb25OYW1lLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbkluZGV4OiAwLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbjogICAgICBhbmltSGFzaFtkZWZhdWx0QW5pbWF0aW9uTmFtZV0sXHJcbiAgICB0aW1lVGlsbE5leHRGcmFtZTogICAgIGFuaW1IYXNoW2RlZmF1bHRBbmltYXRpb25OYW1lXS5mcmFtZXNbMF0uZHVyYXRpb25cclxuICB9IFxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzLmZpbmRXaGVyZSA9IGZpbmRXaGVyZVxyXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXHJcblxyXG4vLzo6IFt7fV0gLT4gU3RyaW5nIC0+IE1heWJlIEFcclxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xyXG4gIGxldCBsZW4gICA9IGFycmF5T2ZPYmplY3RzLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IGZvdW5kID0gbnVsbFxyXG5cclxuICB3aGlsZSAoICsraSA8IGxlbiApIHtcclxuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xyXG4gICAgICBmb3VuZCA9IGFycmF5T2ZPYmplY3RzW2ldXHJcbiAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmb3VuZFxyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNLZXlzIChrZXlzLCBvYmopIHtcclxuICBsZXQgaSA9IC0xXHJcbiAgXHJcbiAgd2hpbGUgKGtleXNbKytpXSkgaWYgKCFvYmpba2V5c1tpXV0pIHJldHVybiBmYWxzZVxyXG4gIHJldHVybiB0cnVlXHJcbn1cclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gQnVmZmVyIC0+IEludCAtPiBJbnQgLT4gRmxvYXQzMkFycmF5XHJcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxyXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXHJcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxyXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMudXBkYXRlQnVmZmVyID0gdXBkYXRlQnVmZmVyXHJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxyXG5mdW5jdGlvbiBTaGFkZXIgKGdsLCB0eXBlLCBzcmMpIHtcclxuICBsZXQgc2hhZGVyICA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKVxyXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcclxuICBcclxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXHJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXHJcblxyXG4gIGlzVmFsaWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUylcclxuXHJcbiAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgdmFsaWQgc2hhZGVyOiBcXG5cIiArIHNyYylcclxuICByZXR1cm4gICAgICAgIHNoYWRlclxyXG59XHJcblxyXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBWZXJ0ZXhTaGFkZXIgLT4gRnJhZ21lbnRTaGFkZXJcclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xyXG4gIGxldCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSh2cywgZnMpXHJcblxyXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcclxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpXHJcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcclxuICByZXR1cm4gcHJvZ3JhbVxyXG59XHJcblxyXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXHJcbmZ1bmN0aW9uIFRleHR1cmUgKGdsKSB7XHJcbiAgbGV0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcblxyXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXHJcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgcmV0dXJuIHRleHR1cmVcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuU2hhZGVyICA9IFNoYWRlclxyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxyXG5tb2R1bGUuZXhwb3J0cy5UZXh0dXJlID0gVGV4dHVyZVxyXG4iLCJsZXQgTG9hZGVyICAgICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXHJcbmxldCBHTFJlbmRlcmVyICAgICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IENsb2NrICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0Nsb2NrXCIpXHJcbmxldCBDYWNoZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxyXG5sZXQgU2NlbmVNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXHJcbmxldCBUZXN0U2NlbmUgICAgICAgPSByZXF1aXJlKFwiLi9UZXN0U2NlbmVcIilcclxubGV0IEdhbWUgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcclxubGV0IElucHV0TWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcbmxldCBBdWRpb1N5c3RlbSAgICAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxyXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxyXG5sZXQgdmVydGV4U3JjICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJ0ZXhcIikudGV4dFxyXG5sZXQgZnJhZ1NyYyAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcmFnbWVudFwiKS50ZXh0XHJcblxyXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxyXG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXHJcblxyXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcclxubGV0IGlucHV0TWFuYWdlciAgICA9IG5ldyBJbnB1dE1hbmFnZXIoa2V5Ym9hcmRNYW5hZ2VyKVxyXG5sZXQgcmVuZGVyZXJPcHRzICAgID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cclxubGV0IGVudGl0eVN0b3JlICAgICA9IG5ldyBFbnRpdHlTdG9yZVxyXG5sZXQgY2xvY2sgICAgICAgICAgID0gbmV3IENsb2NrKERhdGUubm93KVxyXG5sZXQgY2FjaGUgICAgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxyXG5sZXQgbG9hZGVyICAgICAgICAgID0gbmV3IExvYWRlclxyXG5sZXQgcmVuZGVyZXIgICAgICAgID0gbmV3IEdMUmVuZGVyZXIoY2FudmFzLCB2ZXJ0ZXhTcmMsIGZyYWdTcmMsIHJlbmRlcmVyT3B0cylcclxubGV0IGF1ZGlvU3lzdGVtICAgICA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXHJcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcclxubGV0IGdhbWUgICAgICAgICAgICA9IG5ldyBHYW1lKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIGVudGl0eVN0b3JlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcclxuXHJcbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGNsb2NrICAgICAgICAgID0gZ2FtZS5jbG9ja1xyXG4gIGxldCBpbnB1dE1hbmFnZXIgICA9IGdhbWUuaW5wdXRNYW5hZ2VyXHJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XHJcbiAgICBjbG9jay50aWNrKClcclxuICAgIGlucHV0TWFuYWdlci5rZXlib2FyZE1hbmFnZXIudGljayhjbG9jay5kVClcclxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZShjbG9jay5kVClcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xyXG4gICAgZ2FtZS5yZW5kZXJlci5yZW5kZXIoKVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5nYW1lID0gZ2FtZVxyXG5cclxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgfSlcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxyXG4gIGdhbWUuc3RhcnQoKVxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcclxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXHJcbn0pXHJcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXHJcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcbiJdfQ==
