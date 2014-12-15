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
    textureToBatchMap.set(texture, {
      count: 0,
      boxes: BoxArray(maxSpriteCount),
      centers: CenterArray(maxSpriteCount),
      scales: ScaleArray(maxSpriteCount),
      rotations: RotationArray(maxSpriteCount),
      texCoords: TextureCoordinatesArray(maxSpriteCount)
    });
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

  this.addSprite = function (image, w, h, x, y, tw, th, tx, ty) {
    var _tx = imageToTextureMap.get(image) || _this.addTexture(image);
    var batch = textureToBatchMap.get(_tx) || _this.addBatch(_tx);

    setBox(batch.boxes, batch.count, w, h, x, y);
    //TODO: We should set the texcoords for this sprite as well
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
    textureToBatchMap.forEach(resetBatch);
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
      ent.physics.width, ent.physics.height, ent.physics.x, ent.physics.y, frame.aabb.h, frame.aabb.w, frame.aabb.x, frame.aabb.y);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9BQUJCLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQW5pbWF0aW9uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQXVkaW9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvR0xSZW5kZXJlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dhbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9JbnB1dE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlib2FyZE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0xvYWRlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1BhZGRsZU1vdmVyU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVWLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxDQUFBO0tBQUU7R0FDbkIsQ0FBQyxDQUFBO0FBQ0YsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLENBQUE7S0FBRTtH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VSxHQUFRLGVBQWUsR0FBRyxjQUFjLENBQUE7O0FBRXhELFNBQVMsTUFBTSxDQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzVDLE1BQUksQ0FBQyxHQUFJLFVBQVUsR0FBRyxLQUFLLENBQUE7QUFDM0IsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNkLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWQsVUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFNLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTs7QUFFbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDcEI7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QU8sQ0FBQyxTQUFTLEdBQVEsU0FBUyxDQUFBO0FBQ3pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTs7QUFFOUMsU0FBUyxTQUFTLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUNsQyxNQUFJLENBQUMsQ0FBQyxRQUFRLFlBQVksSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDakY7O0FBRUQsU0FBUyxjQUFjLENBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtBQUN2QyxNQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVoQyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0NBQ3pFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQUFCQiAodywgaCwgeCwgeSkge1xuICB0aGlzLnggPSB4XG4gIHRoaXMueSA9IHlcbiAgdGhpcy53ID0gd1xuICB0aGlzLmggPSBoXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx4XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB4IH0gXG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseVwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geSB9IFxuICB9KVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnhcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHggKyB3IH1cbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ5XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB5ICsgaCB9XG4gIH0pXG59XG4iLCJsZXQgQUFCQiA9IHJlcXVpcmUoXCIuL0FBQkJcIilcblxuZnVuY3Rpb24gRnJhbWUgKGFhYmIsIGR1cmF0aW9uKSB7XG4gIHRoaXMuYWFiYiAgICAgPSBhYWJiXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxufVxuXG4vL3JhdGUgaXMgaW4gbXMuICBUaGlzIGlzIHRoZSB0aW1lIHBlciBmcmFtZSAoNDIgfiAyNGZwcylcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQW5pbWF0aW9uICh3LCBoLCB4LCB5LCBjb3VudCwgZG9lc0xvb3AsIHJhdGU9NDIpIHtcbiAgbGV0IGZyYW1lcyA9IFtdXG4gIGxldCBpICAgICAgPSAtMVxuICBsZXQgZWFjaFhcbiAgbGV0IGFhYmJcblxuICB3aGlsZSAoKytpIDwgY291bnQpIHtcbiAgICBlYWNoWCA9IHggKyBjb3VudCAqIHdcbiAgICBhYWJiICA9IG5ldyBBQUJCKHcsIGgsIGVhY2hYLCB5KVxuICAgIGZyYW1lcy5wdXNoKG5ldyBGcmFtZShhYWJiLCByYXRlKSlcbiAgfVxuXG4gIHRoaXMubG9vcCAgID0gZG9lc0xvb3BcbiAgdGhpcy5yYXRlICAgPSByYXRlXG4gIHRoaXMuZnJhbWVzID0gZnJhbWVzXG59XG4iLCJmdW5jdGlvbiBDaGFubmVsIChjb250ZXh0LCBuYW1lKSB7XG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcbiAgXG4gIGxldCBjb25uZWN0UGFubmVyID0gZnVuY3Rpb24gKHNyYywgcGFubmVyLCBjaGFuKSB7XG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxuICB9XG5cbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcbiAgICBsZXQgc2hvdWxkTG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xuICAgICAgbGV0IHNyYyA9IGNoYW5uZWwuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSBcblxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcbiAgICAgIGVsc2UgICAgICAgIHNyYy5jb25uZWN0KGNoYW5uZWwpXG5cbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXG4gICAgICBzcmMuYnVmZmVyID0gYnVmZmVyXG4gICAgICBzcmMuc3RhcnQoMClcbiAgICAgIHJldHVybiBzcmNcbiAgICB9IFxuICB9XG5cbiAgY2hhbm5lbC5jb25uZWN0KGNvbnRleHQuZGVzdGluYXRpb24pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XG4gIH0pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cbiAgfSlcblxuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcbiAgdGhpcy5wbGF5ID0gYmFzZVBsYXkoKVxufVxuXG5mdW5jdGlvbiBBdWRpb1N5c3RlbSAoY2hhbm5lbE5hbWVzKSB7XG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcbiAgbGV0IGNoYW5uZWxzID0ge31cbiAgbGV0IGkgICAgICAgID0gLTFcblxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcbiAgICBjaGFubmVsc1tjaGFubmVsTmFtZXNbaV1dID0gbmV3IENoYW5uZWwoY29udGV4dCwgY2hhbm5lbE5hbWVzW2ldKVxuICB9XG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxuICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb1N5c3RlbVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlOYW1lcy5sZW5ndGg7ICsraSkgdGhpc1trZXlOYW1lc1tpXV0gPSB7fVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDbG9ja1xuXG5mdW5jdGlvbiBDbG9jayAodGltZUZuPURhdGUubm93KSB7XG4gIHRoaXMub2xkVGltZSA9IHRpbWVGbigpXG4gIHRoaXMubmV3VGltZSA9IHRpbWVGbigpXG4gIHRoaXMuZFQgPSAwXG4gIHRoaXMudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9sZFRpbWUgPSB0aGlzLm5ld1RpbWVcbiAgICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKSAgXG4gICAgdGhpcy5kVCAgICAgID0gdGhpcy5uZXdUaW1lIC0gdGhpcy5vbGRUaW1lXG4gIH1cbn1cbiIsIi8vdGhpcyBkb2VzIGxpdGVyYWxseSBub3RoaW5nLiAgaXQncyBhIHNoZWxsIHRoYXQgaG9sZHMgY29tcG9uZW50c1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbnRpdHkgKCkge31cbiIsImxldCB7aGFzS2V5c30gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdHlTdG9yZVxuXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAobWF4PTEwMDApIHtcbiAgdGhpcy5lbnRpdGllcyAgPSBbXVxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXG59XG5cbkVudGl0eVN0b3JlLnByb3RvdHlwZS5hZGRFbnRpdHkgPSBmdW5jdGlvbiAoZSkge1xuICBsZXQgaWQgPSB0aGlzLmVudGl0aWVzLmxlbmd0aFxuXG4gIHRoaXMuZW50aXRpZXMucHVzaChlKVxuICByZXR1cm4gaWRcbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKGNvbXBvbmVudE5hbWVzKSB7XG4gIGxldCBpID0gLTFcbiAgbGV0IGVudGl0eVxuXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cblxuICB3aGlsZSAodGhpcy5lbnRpdGllc1srK2ldKSB7XG4gICAgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxuICAgIGlmIChoYXNLZXlzKGNvbXBvbmVudE5hbWVzLCBlbnRpdHkpKSB0aGlzLmxhc3RRdWVyeS5wdXNoKGVudGl0eSlcbiAgfVxuICByZXR1cm4gdGhpcy5sYXN0UXVlcnlcbn1cbiIsImxldCB7U2hhZGVyLCBQcm9ncmFtLCBUZXh0dXJlfSA9IHJlcXVpcmUoXCIuL2dsLXR5cGVzXCIpXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBHTFJlbmRlcmVyXG5cbmNvbnN0IFBPSU5UX0RJTUVOU0lPTiA9IDJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICA9IDZcbmNvbnN0IEJPWF9MRU5HVEggICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXG5cbmZ1bmN0aW9uIHNldEJveCAoYm94QXJyYXksIGluZGV4LCB3LCBoLCB4LCB5KSB7XG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxuICBsZXQgeDEgPSB4XG4gIGxldCB5MSA9IHkgXG4gIGxldCB4MiA9IHggKyB3XG4gIGxldCB5MiA9IHkgKyBoXG5cbiAgYm94QXJyYXlbaV0gICAgPSB4MVxuICBib3hBcnJheVtpKzFdICA9IHkxXG4gIGJveEFycmF5W2krMl0gID0geDJcbiAgYm94QXJyYXlbaSszXSAgPSB5MVxuICBib3hBcnJheVtpKzRdICA9IHgxXG4gIGJveEFycmF5W2krNV0gID0geTJcblxuICBib3hBcnJheVtpKzZdICA9IHgxXG4gIGJveEFycmF5W2krN10gID0geTJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxuICBib3hBcnJheVtpKzldICA9IHkxXG4gIGJveEFycmF5W2krMTBdID0geDJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MlxufVxuXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBDZW50ZXJBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBQT0lOVFNfUEVSX0JPWClcbn1cblxuZnVuY3Rpb24gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgaSArPSBCT1hfTEVOR1RIKSB7XG4gICAgYXJbaV0gICAgPSAwXG4gICAgYXJbaSsxXSAgPSAwXG4gICAgYXJbaSsyXSAgPSAxXG4gICAgYXJbaSszXSAgPSAwXG4gICAgYXJbaSs0XSAgPSAwXG4gICAgYXJbaSs1XSAgPSAxXG5cbiAgICBhcltpKzZdICA9IDBcbiAgICBhcltpKzddICA9IDFcbiAgICBhcltpKzhdICA9IDFcbiAgICBhcltpKzldICA9IDBcbiAgICBhcltpKzEwXSA9IDFcbiAgICBhcltpKzExXSA9IDFcbiAgfSBcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIEdMUmVuZGVyZXIgKGNhbnZhcywgdlNyYywgZlNyYywgb3B0aW9ucz17fSkge1xuICBsZXQge21heFNwcml0ZUNvdW50LCB3aWR0aCwgaGVpZ2h0fSA9IG9wdGlvbnNcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gbWF4U3ByaXRlQ291bnQgfHwgMTAwXG4gIGxldCB2aWV3ICAgICAgICAgICA9IGNhbnZhc1xuICBsZXQgZ2wgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpICAgICAgXG4gIGxldCB2cyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcbiAgbGV0IGZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZTcmMpXG4gIGxldCBwcm9ncmFtICAgICAgICA9IFByb2dyYW0oZ2wsIHZzLCBmcylcblxuICAvL2hhbmRsZXMgdG8gR1BVIGJ1ZmZlcnNcbiAgbGV0IGJveEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IGNlbnRlckJ1ZmZlciAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHJvdGF0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcblxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcbiAgLy9sZXQgcm90TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9yb3RhdGlvblwiKVxuICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV90ZXhDb29yZFwiKVxuXG4gIC8vVW5pZm9ybSBsb2NhdGlvbnNcbiAgbGV0IHdvcmxkU2l6ZUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV93b3JsZFNpemVcIilcblxuICBsZXQgaW1hZ2VUb1RleHR1cmVNYXAgPSBuZXcgTWFwKClcbiAgbGV0IHRleHR1cmVUb0JhdGNoTWFwID0gbmV3IE1hcCgpXG5cbiAgZ2wuZW5hYmxlKGdsLkJMRU5EKVxuICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKVxuICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDAuMClcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXG4gIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSlcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcblxuICB0aGlzLmRpbWVuc2lvbnMgPSB7XG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcbiAgICBoZWlnaHQ6IGhlaWdodCB8fCAxMDgwXG4gIH1cblxuICB0aGlzLmFkZEJhdGNoID0gKHRleHR1cmUpID0+IHtcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5zZXQodGV4dHVyZSwge1xuICAgICAgY291bnQ6ICAgICAwLFxuICAgICAgYm94ZXM6ICAgICBCb3hBcnJheShtYXhTcHJpdGVDb3VudCksXG4gICAgICBjZW50ZXJzOiAgIENlbnRlckFycmF5KG1heFNwcml0ZUNvdW50KSxcbiAgICAgIHNjYWxlczogICAgU2NhbGVBcnJheShtYXhTcHJpdGVDb3VudCksXG4gICAgICByb3RhdGlvbnM6IFJvdGF0aW9uQXJyYXkobWF4U3ByaXRlQ291bnQpLFxuICAgICAgdGV4Q29vcmRzOiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheShtYXhTcHJpdGVDb3VudClcbiAgICB9KSBcbiAgICByZXR1cm4gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHRleHR1cmUpXG4gIH1cblxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcbiAgICBsZXQgdGV4dHVyZSA9IFRleHR1cmUoZ2wpXG5cbiAgICBpbWFnZVRvVGV4dHVyZU1hcC5zZXQoaW1hZ2UsIHRleHR1cmUpXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKTsgXG4gICAgcmV0dXJuIHRleHR1cmVcbiAgfVxuXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XG5cbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxuICB9XG5cbiAgdGhpcy5hZGRTcHJpdGUgPSAoaW1hZ2UsIHcsIGgsIHgsIHksIHR3LCB0aCwgdHgsIHR5KSA9PiB7XG4gICAgbGV0IHR4ICAgID0gaW1hZ2VUb1RleHR1cmVNYXAuZ2V0KGltYWdlKSB8fCB0aGlzLmFkZFRleHR1cmUoaW1hZ2UpXG4gICAgbGV0IGJhdGNoID0gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHR4KSB8fCB0aGlzLmFkZEJhdGNoKHR4KVxuXG4gICAgc2V0Qm94KGJhdGNoLmJveGVzLCBiYXRjaC5jb3VudCwgdywgaCwgeCwgeSlcbiAgICAvL1RPRE86IFdlIHNob3VsZCBzZXQgdGhlIHRleGNvb3JkcyBmb3IgdGhpcyBzcHJpdGUgYXMgd2VsbFxuICAgIGJhdGNoLmNvdW50KytcbiAgfVxuXG4gIGxldCByZXNldEJhdGNoID0gKGJhdGNoKSA9PiBiYXRjaC5jb3VudCA9IDBcblxuICBsZXQgZHJhd0JhdGNoID0gKGJhdGNoLCB0ZXh0dXJlKSA9PiB7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2guYm94ZXMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIGNlbnRlckJ1ZmZlciwgY2VudGVyTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgY2VudGVycylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIHRleENvb3JkQnVmZmVyLCB0ZXhDb29yZExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJhdGNoLnRleENvb3JkcylcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYmF0Y2guY291bnQgKiBQT0lOVFNfUEVSX0JPWClcbiAgICBcbiAgfVxuXG4gIHRoaXMuZmx1c2ggPSAoKSA9PiB7XG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChyZXNldEJhdGNoKVxuICB9XG5cbiAgdGhpcy5yZW5kZXIgPSAoKSA9PiB7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKGRyYXdCYXRjaClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZVxuXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxuZnVuY3Rpb24gR2FtZSAoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcblxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcbiAgfVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxuXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXG59XG5cbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dE1hbmFnZXJcblxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChrZXlib2FyZE1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXG5cbmNvbnN0IEtFWV9DT1VOVCA9IDI1NlxuXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XG4gIGxldCBpc0Rvd25zICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIGxldCBkb3duRHVyYXRpb25zID0gbmV3IFVpbnQzMkFycmF5KEtFWV9DT1VOVClcbiAgXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3REb3duc1trZXlDb2RlXSA9ICFpc0Rvd25zW2tleUNvZGVdXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSBmYWxzZVxuICB9XG5cbiAgbGV0IGhhbmRsZUJsdXIgPSAoKSA9PiB7XG4gICAgbGV0IGkgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xuICAgICAgaXNEb3duc1tpXSAgID0gMFxuICAgICAganVzdERvd25zW2ldID0gMFxuICAgICAganVzdFVwc1tpXSAgID0gMFxuICAgIH1cbiAgfVxuXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xuICB0aGlzLmp1c3REb3ducyAgICAgPSBqdXN0RG93bnNcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xuXG4gIHRoaXMudGljayA9IChkVCkgPT4ge1xuICAgIGxldCBpID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcbiAgICAgIGlmIChpc0Rvd25zW2ldKSBkb3duRHVyYXRpb25zW2ldICs9IGRUXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXG59XG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cblxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJyZW5kZXJhYmxlXCIsIFwiYW5pbWF0ZWRcIl0pXG59XG5cbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcbiAgbGV0IGkgICA9IC0xXG4gIGxldCBlbnRcbiAgbGV0IHRpbWVMZWZ0XG4gIGxldCBjdXJyZW50SW5kZXhcbiAgbGV0IGN1cnJlbnRBbmltXG4gIGxldCBjdXJyZW50RnJhbWVcbiAgbGV0IG5leHRGcmFtZVxuICBsZXQgb3ZlcnNob290XG4gIGxldCBzaG91bGRBZHZhbmNlXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcbiAgICBjdXJyZW50SW5kZXggID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleFxuICAgIGN1cnJlbnRBbmltICAgPSBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvblxuICAgIGN1cnJlbnRGcmFtZSAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4XVxuICAgIG5leHRGcmFtZSAgICAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4ICsgMV0gfHwgY3VycmVudEFuaW0uZnJhbWVzWzBdXG4gICAgdGltZUxlZnQgICAgICA9IGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZVxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXG4gICAgICBcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xuICAgICAgZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSAgICAgPSBuZXh0RnJhbWUuZHVyYXRpb24gKyBvdmVyc2hvb3QgXG4gICAgfSBlbHNlIHtcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcbiAgICB9XG4gIH1cbn1cbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcblxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcblxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcblxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gICAgICB4aHIuc2VuZChudWxsKVxuICAgIH0gXG4gIH1cblxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcblxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXG5cbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICBcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXG4gICAgaS5zcmMgICAgID0gcGF0aFxuICB9XG5cbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXG5cbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXG4gICAgfSkgXG4gIH1cblxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXG4gICAgfVxuXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzb3VuZENvdW50LS1cbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgdGV4dHVyZUNvdW50LS1cbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNoYWRlckNvdW50LS1cbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cblxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXG5cbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cblxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXG5cbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXG59XG5cblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7Y2xvY2ssIGlucHV0TWFuYWdlcn0gPSBzY2VuZS5nYW1lXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxuICBsZXQgbW92ZVNwZWVkID0gMVxuICBsZXQgcGFkZGxlICAgID0gZW50aXRpZXNbMF1cblxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcbiAgaWYgKCFwYWRkbGUpIHJldHVyblxuXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxufVxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmluZ1N5c3RlbVxuXG5mdW5jdGlvbiBSZW5kZXJpbmdTeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicmVuZGVyYWJsZVwiXSlcbn1cblxuUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuICBsZXQgZW50XG4gIGxldCBmcmFtZVxuXG4gIHJlbmRlcmVyLmZsdXNoKClcblxuICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgZW50ID0gZW50aXRpZXNbaV1cblxuICAgIGlmIChlbnQuYW5pbWF0ZWQpIHtcbiAgICAgIGZyYW1lID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb24uZnJhbWVzW2VudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXhdXG4gICAgICByZW5kZXJlci5hZGRTcHJpdGUoXG4gICAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXG4gICAgICAgIGVudC5waHlzaWNzLndpZHRoLFxuICAgICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXG4gICAgICAgIGVudC5waHlzaWNzLngsXG4gICAgICAgIGVudC5waHlzaWNzLnksXG4gICAgICAgIGZyYW1lLmFhYmIuaCxcbiAgICAgICAgZnJhbWUuYWFiYi53LFxuICAgICAgICBmcmFtZS5hYWJiLngsXG4gICAgICAgIGZyYW1lLmFhYmIueVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlci5hZGRTcHJpdGUoXG4gICAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXG4gICAgICAgIGVudC5waHlzaWNzLndpZHRoLFxuICAgICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXG4gICAgICAgIGVudC5waHlzaWNzLngsXG4gICAgICAgIGVudC5waHlzaWNzLnksXG4gICAgICAgIDEsICAvL3RleHR1cmUgd2lkdGhcbiAgICAgICAgMSwgIC8vdGV4dHVyZSBoZWlnaHRcbiAgICAgICAgMCwgIC8vdGV4dHVyZSB4XG4gICAgICAgIDAgICAvL3RleHR1cmUgeVxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxuXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxuXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xuICB0aGlzLmdhbWUgICAgPSBudWxsXG59XG5cblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBjYihudWxsLCBudWxsKSAgXG59XG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZFQpIHtcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IHN5c3RlbVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXG4gICAgc3lzdGVtLnJ1bih0aGlzLCBzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxuICB9XG59XG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcblxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxuXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xuXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxuXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxuXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxuICB9XG5cbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxuXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXG5cbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXG59XG5cbi8vc2NlbmUuZ2FtZS5jbG9ja1xuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XG59XG4iLCJsZXQge1BhZGRsZSwgQmxvY2t9ID0gcmVxdWlyZShcIi4vYXNzZW1ibGFnZXNcIilcbmxldCBQYWRkbGVNb3ZlclN5c3RlbSAgICAgICA9IHJlcXVpcmUoXCIuL1BhZGRsZU1vdmVyU3lzdGVtXCIpXG5sZXQgUmVuZGVyaW5nU3lzdGVtICAgICAgICAgPSByZXF1aXJlKFwiLi9SZW5kZXJpbmdTeXN0ZW1cIilcbmxldCBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSA9IHJlcXVpcmUoXCIuL0tleWZyYW1lQW5pbWF0aW9uU3lzdGVtXCIpXG5sZXQgU2NlbmUgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9TY2VuZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxuXG5mdW5jdGlvbiBUZXN0U2NlbmUgKCkge1xuICBsZXQgc3lzdGVtcyA9IFtcbiAgICBuZXcgUGFkZGxlTW92ZXJTeXN0ZW0sIFxuICAgIG5ldyBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSxcbiAgICBuZXcgUmVuZGVyaW5nU3lzdGVtXG4gIF1cblxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxufVxuXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXG5cblRlc3RTY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZSwgYXVkaW9TeXN0ZW19ID0gdGhpcy5nYW1lIFxuICBsZXQge2JnfSA9IGF1ZGlvU3lzdGVtLmNoYW5uZWxzXG4gIGxldCBhc3NldHMgPSB7XG4gICAgLy9zb3VuZHM6IHsgYmdNdXNpYzogXCIvcHVibGljL3NvdW5kcy9iZ20xLm1wM1wiIH0sXG4gICAgdGV4dHVyZXM6IHsgXG4gICAgICBwYWRkbGU6IFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcGFkZGxlLnBuZ1wiLFxuICAgICAgYmxvY2tzOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL2Jsb2Nrcy5wbmdcIlxuICAgIH1cbiAgfVxuXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcblxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgUGFkZGxlKHRleHR1cmVzLnBhZGRsZSwgMTEyLCAyNSwgNDAwLCA0MDApKVxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA0NCwgMjIsIDgwMCwgODAwKSlcbiAgICAvL2JnLnZvbHVtZSA9IDBcbiAgICAvL2JnLmxvb3AoY2FjaGUuc291bmRzLmJnTXVzaWMpXG4gICAgY2IobnVsbClcbiAgfSlcbn1cbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljcywgUGxheWVyQ29udHJvbGxlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQge0FuaW1hdGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcbmxldCBBbmltYXRpb24gPSByZXF1aXJlKFwiLi9BbmltYXRpb25cIilcbmxldCBFbnRpdHkgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcblxubW9kdWxlLmV4cG9ydHMuUGFkZGxlID0gUGFkZGxlXG5tb2R1bGUuZXhwb3J0cy5CbG9jayAgPSBCbG9ja1xuXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxufVxuXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcbiAgRW50aXR5LmNhbGwodGhpcylcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxuICBBbmltYXRlZCh0aGlzLCBcImlkbGVcIiwge1xuICAgIGlkbGU6IG5ldyBBbmltYXRpb24oNDQsIDIyLCAwLCAwLCAzLCB0cnVlLCAxMDAwKVxuICB9KVxufVxuIiwibW9kdWxlLmV4cG9ydHMuUmVuZGVyYWJsZSAgICAgICA9IFJlbmRlcmFibGVcbm1vZHVsZS5leHBvcnRzLlBoeXNpY3MgICAgICAgICAgPSBQaHlzaWNzXG5tb2R1bGUuZXhwb3J0cy5QbGF5ZXJDb250cm9sbGVkID0gUGxheWVyQ29udHJvbGxlZFxubW9kdWxlLmV4cG9ydHMuQW5pbWF0ZWQgICAgICAgICA9IEFuaW1hdGVkXG5cbmZ1bmN0aW9uIFJlbmRlcmFibGUgKGUsIGltYWdlLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIGUucmVuZGVyYWJsZSA9IHtcbiAgICBpbWFnZSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgcm90YXRpb246IDAsXG4gICAgY2VudGVyOiB7XG4gICAgICB4OiB3aWR0aCAvIDIsXG4gICAgICB5OiBoZWlnaHQgLyAyIFxuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDEsXG4gICAgICB5OiAxIFxuICAgIH1cbiAgfSBcbiAgcmV0dXJuIGVcbn1cblxuZnVuY3Rpb24gUGh5c2ljcyAoZSwgd2lkdGgsIGhlaWdodCwgeCwgeSkge1xuICBlLnBoeXNpY3MgPSB7XG4gICAgd2lkdGgsIFxuICAgIGhlaWdodCwgXG4gICAgeCwgXG4gICAgeSwgXG4gICAgZHg6ICAwLCBcbiAgICBkeTogIDAsIFxuICAgIGRkeDogMCwgXG4gICAgZGR5OiAwXG4gIH1cbiAgcmV0dXJuIGVcbn1cblxuZnVuY3Rpb24gUGxheWVyQ29udHJvbGxlZCAoZSkge1xuICBlLnBsYXllckNvbnRyb2xsZWQgPSB0cnVlXG59XG5cbmZ1bmN0aW9uIEFuaW1hdGVkIChlLCBkZWZhdWx0QW5pbWF0aW9uTmFtZSwgYW5pbUhhc2gpIHtcbiAgZS5hbmltYXRlZCA9IHtcbiAgICBhbmltYXRpb25zOiAgICAgICAgICAgIGFuaW1IYXNoLFxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lOiAgZGVmYXVsdEFuaW1hdGlvbk5hbWUsXG4gICAgY3VycmVudEFuaW1hdGlvbkluZGV4OiAwLFxuICAgIGN1cnJlbnRBbmltYXRpb246ICAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLFxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLmZyYW1lc1swXS5kdXJhdGlvblxuICB9IFxufVxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXG5cbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IGZvdW5kID0gbnVsbFxuXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kXG59XG5cbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xuICBsZXQgaSA9IC0xXG4gIFxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXG59XG5cbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXG5mdW5jdGlvbiBTaGFkZXIgKGdsLCB0eXBlLCBzcmMpIHtcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxuICBcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcblxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXG5cbiAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgdmFsaWQgc2hhZGVyOiBcXG5cIiArIHNyYylcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XG4gIGxldCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSh2cywgZnMpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcbmZ1bmN0aW9uIFRleHR1cmUgKGdsKSB7XG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIHJldHVybiB0ZXh0dXJlXG59XG5cbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXG5tb2R1bGUuZXhwb3J0cy5UZXh0dXJlID0gVGV4dHVyZVxuIiwibGV0IExvYWRlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICAgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBFbnRpdHlTdG9yZSAgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcbmxldCBDbG9jayAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IENhY2hlICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5sZXQgVGVzdFNjZW5lICAgICAgID0gcmVxdWlyZShcIi4vVGVzdFNjZW5lXCIpXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxubGV0IElucHV0TWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxubGV0IHZlcnRleFNyYyAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmVydGV4XCIpLnRleHRcbmxldCBmcmFnU3JjICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZyYWdtZW50XCIpLnRleHRcblxuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMjVcbmNvbnN0IE1BWF9DT1VOVCAgICAgICA9IDEwMDBcblxubGV0IGtleWJvYXJkTWFuYWdlciA9IG5ldyBLZXlib2FyZE1hbmFnZXIoZG9jdW1lbnQpXG5sZXQgaW5wdXRNYW5hZ2VyICAgID0gbmV3IElucHV0TWFuYWdlcihrZXlib2FyZE1hbmFnZXIpXG5sZXQgcmVuZGVyZXJPcHRzICAgID0geyBtYXhTcHJpdGVDb3VudDogTUFYX0NPVU5UIH1cbmxldCBlbnRpdHlTdG9yZSAgICAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXG5sZXQgY2FjaGUgICAgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxubGV0IGxvYWRlciAgICAgICAgICA9IG5ldyBMb2FkZXJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIHZlcnRleFNyYywgZnJhZ1NyYywgcmVuZGVyZXJPcHRzKVxubGV0IGF1ZGlvU3lzdGVtICAgICA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXG5sZXQgc2NlbmVNYW5hZ2VyICAgID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXG5sZXQgZ2FtZSAgICAgICAgICAgID0gbmV3IEdhbWUoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIGVudGl0eVN0b3JlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2VuZU1hbmFnZXIpXG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcbiAgbGV0IHN0b3JlICAgICAgICAgID0gZ2FtZS5lbnRpdHlTdG9yZVxuICBsZXQgY2xvY2sgICAgICAgICAgPSBnYW1lLmNsb2NrXG4gIGxldCBpbnB1dE1hbmFnZXIgICA9IGdhbWUuaW5wdXRNYW5hZ2VyXG4gIGxldCBjb21wb25lbnROYW1lcyA9IFtcInJlbmRlcmFibGVcIiwgXCJwaHlzaWNzXCJdXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gICAgY2xvY2sudGljaygpXG4gICAgaW5wdXRNYW5hZ2VyLmtleWJvYXJkTWFuYWdlci50aWNrKGNsb2NrLmRUKVxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZShjbG9jay5kVClcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2FtZSkge1xuICByZXR1cm4gZnVuY3Rpb24gYW5pbWF0ZSAoKSB7XG4gICAgZ2FtZS5yZW5kZXJlci5yZW5kZXIoKVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSAgXG4gIH1cbn1cblxud2luZG93LmdhbWUgPSBnYW1lXG5cbmZ1bmN0aW9uIHNldHVwRG9jdW1lbnQgKGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdykge1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgfSlcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuICBzZXR1cERvY3VtZW50KGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdylcbiAgZ2FtZS5zdGFydCgpXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZShnYW1lKSwgVVBEQVRFX0lOVEVSVkFMKVxufSlcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXG5tb2R1bGUuZXhwb3J0cy5jaGVja1ZhbHVlVHlwZSA9IGNoZWNrVmFsdWVUeXBlXG5cbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBjdG9yKSkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBiZSBvZiB0eXBlIFwiICsgY3Rvci5uYW1lKVxufVxuXG5mdW5jdGlvbiBjaGVja1ZhbHVlVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhpbnN0YW5jZSlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIGNoZWNrVHlwZShpbnN0YW5jZVtrZXlzW2ldXSwgY3Rvcilcbn1cbiJdfQ==
