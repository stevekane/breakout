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

    setBox(batch.boxes, batch.count++, w, h, x, y);
  };

  this.flush = function () {
    textureToBatchMap.forEach(function (batch, texture) {
      batch.count = 0;
    });
  };

  this.render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080);

    textureToBatchMap.forEach(function (batch, texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, batch.boxes);
      //updateBuffer(gl, centerBuffer, centerLocation, POINT_DIMENSION, centers)
      //updateBuffer(gl, scaleBuffer, scaleLocation, POINT_DIMENSION, scales)
      //updateBuffer(gl, rotationBuffer, rotLocation, 1, rotations)
      updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, batch.texCoords);
      gl.drawArrays(gl.TRIANGLES, 0, batch.count * POINTS_PER_BOX);
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9BQUJCLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQW5pbWF0aW9uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQXVkaW9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvR0xSZW5kZXJlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dhbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9JbnB1dE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlib2FyZE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0xvYWRlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1BhZGRsZU1vdmVyU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVWLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxDQUFBO0tBQUU7R0FDbkIsQ0FBQyxDQUFBO0FBQ0YsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLENBQUE7S0FBRTtH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VSxHQUFRLGVBQWUsR0FBRyxjQUFjLENBQUE7O0FBRXhELFNBQVMsTUFBTSxDQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzVDLE1BQUksQ0FBQyxHQUFJLFVBQVUsR0FBRyxLQUFLLENBQUE7QUFDM0IsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNkLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWQsVUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFNLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTs7QUFFbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDcEI7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LENBQUE7O0FBRTlDLFNBQVMsU0FBUyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDbEMsTUFBSSxDQUFDLENBQUMsUUFBUSxZQUFZLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0NBQ2pGOztBQUVELFNBQVMsY0FBYyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6RSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFBQkIgKHcsIGgsIHgsIHkpIHtcbiAgdGhpcy54ID0geFxuICB0aGlzLnkgPSB5XG4gIHRoaXMudyA9IHdcbiAgdGhpcy5oID0gaFxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseFwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geCB9IFxuICB9KVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHlcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHkgfSBcbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ4XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB4ICsgdyB9XG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeVwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geSArIGggfVxuICB9KVxufVxuIiwibGV0IEFBQkIgPSByZXF1aXJlKFwiLi9BQUJCXCIpXG5cbmZ1bmN0aW9uIEZyYW1lIChhYWJiLCBkdXJhdGlvbikge1xuICB0aGlzLmFhYmIgICAgID0gYWFiYlxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbn1cblxuLy9yYXRlIGlzIGluIG1zLiAgVGhpcyBpcyB0aGUgdGltZSBwZXIgZnJhbWUgKDQyIH4gMjRmcHMpXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFuaW1hdGlvbiAodywgaCwgeCwgeSwgY291bnQsIGRvZXNMb29wLCByYXRlPTQyKSB7XG4gIGxldCBmcmFtZXMgPSBbXVxuICBsZXQgaSAgICAgID0gLTFcbiAgbGV0IGVhY2hYXG4gIGxldCBhYWJiXG5cbiAgd2hpbGUgKCsraSA8IGNvdW50KSB7XG4gICAgZWFjaFggPSB4ICsgY291bnQgKiB3XG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcbiAgICBmcmFtZXMucHVzaChuZXcgRnJhbWUoYWFiYiwgcmF0ZSkpXG4gIH1cblxuICB0aGlzLmxvb3AgICA9IGRvZXNMb29wXG4gIHRoaXMucmF0ZSAgID0gcmF0ZVxuICB0aGlzLmZyYW1lcyA9IGZyYW1lc1xufVxuIiwiZnVuY3Rpb24gQ2hhbm5lbCAoY29udGV4dCwgbmFtZSkge1xuICBsZXQgY2hhbm5lbCA9IGNvbnRleHQuY3JlYXRlR2FpbigpXG4gIFxuICBsZXQgY29ubmVjdFBhbm5lciA9IGZ1bmN0aW9uIChzcmMsIHBhbm5lciwgY2hhbikge1xuICAgIHNyYy5jb25uZWN0KHBhbm5lcilcbiAgICBwYW5uZXIuY29ubmVjdChjaGFuKSBcbiAgfVxuXG4gIGxldCBiYXNlUGxheSA9IGZ1bmN0aW9uIChvcHRpb25zPXt9KSB7XG4gICAgbGV0IHNob3VsZExvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2VcblxuICAgIHJldHVybiBmdW5jdGlvbiAoYnVmZmVyLCBwYW5uZXIpIHtcbiAgICAgIGxldCBzcmMgPSBjaGFubmVsLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkgXG5cbiAgICAgIGlmIChwYW5uZXIpIGNvbm5lY3RQYW5uZXIoc3JjLCBwYW5uZXIsIGNoYW5uZWwpXG4gICAgICBlbHNlICAgICAgICBzcmMuY29ubmVjdChjaGFubmVsKVxuXG4gICAgICBzcmMubG9vcCAgID0gc2hvdWxkTG9vcFxuICAgICAgc3JjLmJ1ZmZlciA9IGJ1ZmZlclxuICAgICAgc3JjLnN0YXJ0KDApXG4gICAgICByZXR1cm4gc3JjXG4gICAgfSBcbiAgfVxuXG4gIGNoYW5uZWwuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInZvbHVtZVwiLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsLmdhaW4udmFsdWUgfSxcbiAgICBzZXQodmFsdWUpIHsgY2hhbm5lbC5nYWluLnZhbHVlID0gdmFsdWUgfVxuICB9KVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImdhaW5cIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbCB9XG4gIH0pXG5cbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLmxvb3AgPSBiYXNlUGxheSh7bG9vcDogdHJ1ZX0pXG4gIHRoaXMucGxheSA9IGJhc2VQbGF5KClcbn1cblxuZnVuY3Rpb24gQXVkaW9TeXN0ZW0gKGNoYW5uZWxOYW1lcykge1xuICBsZXQgY29udGV4dCAgPSBuZXcgQXVkaW9Db250ZXh0XG4gIGxldCBjaGFubmVscyA9IHt9XG4gIGxldCBpICAgICAgICA9IC0xXG5cbiAgd2hpbGUgKGNoYW5uZWxOYW1lc1srK2ldKSB7XG4gICAgY2hhbm5lbHNbY2hhbm5lbE5hbWVzW2ldXSA9IG5ldyBDaGFubmVsKGNvbnRleHQsIGNoYW5uZWxOYW1lc1tpXSlcbiAgfVxuICB0aGlzLmNvbnRleHQgID0gY29udGV4dCBcbiAgdGhpcy5jaGFubmVscyA9IGNoYW5uZWxzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXVkaW9TeXN0ZW1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FjaGUgKGtleU5hbWVzKSB7XG4gIGlmICgha2V5TmFtZXMpIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBzb21lIGtleU5hbWVzXCIpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gQ2xvY2tcblxuZnVuY3Rpb24gQ2xvY2sgKHRpbWVGbj1EYXRlLm5vdykge1xuICB0aGlzLm9sZFRpbWUgPSB0aW1lRm4oKVxuICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKVxuICB0aGlzLmRUID0gMFxuICB0aGlzLnRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vbGRUaW1lID0gdGhpcy5uZXdUaW1lXG4gICAgdGhpcy5uZXdUaW1lID0gdGltZUZuKCkgIFxuICAgIHRoaXMuZFQgICAgICA9IHRoaXMubmV3VGltZSAtIHRoaXMub2xkVGltZVxuICB9XG59XG4iLCIvL3RoaXMgZG9lcyBsaXRlcmFsbHkgbm90aGluZy4gIGl0J3MgYSBzaGVsbCB0aGF0IGhvbGRzIGNvbXBvbmVudHNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcblxuZnVuY3Rpb24gRW50aXR5U3RvcmUgKG1heD0xMDAwKSB7XG4gIHRoaXMuZW50aXRpZXMgID0gW11cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcbiAgbGV0IGlkID0gdGhpcy5lbnRpdGllcy5sZW5ndGhcblxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcbiAgcmV0dXJuIGlkXG59XG5cbkVudGl0eVN0b3JlLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uIChjb21wb25lbnROYW1lcykge1xuICBsZXQgaSA9IC0xXG4gIGxldCBlbnRpdHlcblxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXG5cbiAgd2hpbGUgKHRoaXMuZW50aXRpZXNbKytpXSkge1xuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXG4gIH1cbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XG59XG4iLCJsZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gPSAyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxuXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgdywgaCwgeCwgeSkge1xuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcbiAgbGV0IHgxID0geFxuICBsZXQgeTEgPSB5IFxuICBsZXQgeDIgPSB4ICsgd1xuICBsZXQgeTIgPSB5ICsgaFxuXG4gIGJveEFycmF5W2ldICAgID0geDFcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxuICBib3hBcnJheVtpKzJdICA9IHgyXG4gIGJveEFycmF5W2krM10gID0geTFcbiAgYm94QXJyYXlbaSs0XSAgPSB4MVxuICBib3hBcnJheVtpKzVdICA9IHkyXG5cbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxuICBib3hBcnJheVtpKzddICA9IHkyXG4gIGJveEFycmF5W2krOF0gID0geDJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MVxuICBib3hBcnJheVtpKzEwXSA9IHgyXG4gIGJveEFycmF5W2krMTFdID0geTJcbn1cblxuZnVuY3Rpb24gQm94QXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gQ2VudGVyQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcbn1cblxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIFJvdGF0aW9uQXJyYXkgKGNvdW50KSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG59XG5cbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xuICAgIGFyW2ldICAgID0gMFxuICAgIGFyW2krMV0gID0gMFxuICAgIGFyW2krMl0gID0gMVxuICAgIGFyW2krM10gID0gMFxuICAgIGFyW2krNF0gID0gMFxuICAgIGFyW2krNV0gID0gMVxuXG4gICAgYXJbaSs2XSAgPSAwXG4gICAgYXJbaSs3XSAgPSAxXG4gICAgYXJbaSs4XSAgPSAxXG4gICAgYXJbaSs5XSAgPSAwXG4gICAgYXJbaSsxMF0gPSAxXG4gICAgYXJbaSsxMV0gPSAxXG4gIH0gXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBHTFJlbmRlcmVyIChjYW52YXMsIHZTcmMsIGZTcmMsIG9wdGlvbnM9e30pIHtcbiAgbGV0IHttYXhTcHJpdGVDb3VudCwgd2lkdGgsIGhlaWdodH0gPSBvcHRpb25zXG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IG1heFNwcml0ZUNvdW50IHx8IDEwMFxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxuICBsZXQgdnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIGxldCBmcyAgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICBsZXQgcHJvZ3JhbSAgICAgICAgPSBQcm9ncmFtKGdsLCB2cywgZnMpXG5cbiAgLy9oYW5kbGVzIHRvIEdQVSBidWZmZXJzXG4gIGxldCBib3hCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCByb3RhdGlvbkJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xuICBsZXQgYm94TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKVxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxuICAvL2xldCBzY2FsZUxvY2F0aW9uICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3NjYWxlXCIpXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcblxuICAvL1VuaWZvcm0gbG9jYXRpb25zXG4gIGxldCB3b3JsZFNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG5cbiAgbGV0IGltYWdlVG9UZXh0dXJlTWFwID0gbmV3IE1hcCgpXG4gIGxldCB0ZXh0dXJlVG9CYXRjaE1hcCA9IG5ldyBNYXAoKVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC51c2VQcm9ncmFtKHByb2dyYW0pXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG5cbiAgdGhpcy5kaW1lbnNpb25zID0ge1xuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXG4gICAgaGVpZ2h0OiBoZWlnaHQgfHwgMTA4MFxuICB9XG5cbiAgdGhpcy5hZGRCYXRjaCA9ICh0ZXh0dXJlKSA9PiB7XG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuc2V0KHRleHR1cmUsIHtcbiAgICAgIGNvdW50OiAgICAgMCxcbiAgICAgIGJveGVzOiAgICAgQm94QXJyYXkobWF4U3ByaXRlQ291bnQpLFxuICAgICAgY2VudGVyczogICBDZW50ZXJBcnJheShtYXhTcHJpdGVDb3VudCksXG4gICAgICBzY2FsZXM6ICAgIFNjYWxlQXJyYXkobWF4U3ByaXRlQ291bnQpLFxuICAgICAgcm90YXRpb25zOiBSb3RhdGlvbkFycmF5KG1heFNwcml0ZUNvdW50KSxcbiAgICAgIHRleENvb3JkczogVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gICAgfSkgXG4gICAgcmV0dXJuIHRleHR1cmVUb0JhdGNoTWFwLmdldCh0ZXh0dXJlKVxuICB9XG5cbiAgdGhpcy5hZGRUZXh0dXJlID0gKGltYWdlKSA9PiB7XG4gICAgbGV0IHRleHR1cmUgPSBUZXh0dXJlKGdsKVxuXG4gICAgaW1hZ2VUb1RleHR1cmVNYXAuc2V0KGltYWdlLCB0ZXh0dXJlKVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7IFxuICAgIHJldHVybiB0ZXh0dXJlXG4gIH1cblxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxuXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcbiAgfVxuXG4gIHRoaXMuYWRkU3ByaXRlID0gKGltYWdlLCB3LCBoLCB4LCB5LCB0dywgdGgsIHR4LCB0eSkgPT4ge1xuICAgIGxldCB0eCAgICA9IGltYWdlVG9UZXh0dXJlTWFwLmdldChpbWFnZSkgfHwgdGhpcy5hZGRUZXh0dXJlKGltYWdlKVxuICAgIGxldCBiYXRjaCA9IHRleHR1cmVUb0JhdGNoTWFwLmdldCh0eCkgfHwgdGhpcy5hZGRCYXRjaCh0eClcblxuICAgIHNldEJveChiYXRjaC5ib3hlcywgYmF0Y2guY291bnQrKywgdywgaCwgeCwgeSlcbiAgfVxuXG4gIHRoaXMuZmx1c2ggPSAoKSA9PiB7XG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChmdW5jdGlvbiAoYmF0Y2gsIHRleHR1cmUpIHtcbiAgICAgIGJhdGNoLmNvdW50ID0gMCBcbiAgICB9KVxuICB9XG5cbiAgdGhpcy5yZW5kZXIgPSAoKSA9PiB7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVMb2NhdGlvbiwgMTkyMCwgMTA4MClcblxuICAgIHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2goZnVuY3Rpb24gKGJhdGNoLCB0ZXh0dXJlKSB7XG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICAgICAgdXBkYXRlQnVmZmVyKGdsLCBib3hCdWZmZXIsIGJveExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJhdGNoLmJveGVzKVxuICAgICAgLy91cGRhdGVCdWZmZXIoZ2wsIGNlbnRlckJ1ZmZlciwgY2VudGVyTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgY2VudGVycylcbiAgICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBzY2FsZUJ1ZmZlciwgc2NhbGVMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBzY2FsZXMpXG4gICAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgcm90YXRpb25CdWZmZXIsIHJvdExvY2F0aW9uLCAxLCByb3RhdGlvbnMpXG4gICAgICB1cGRhdGVCdWZmZXIoZ2wsIHRleENvb3JkQnVmZmVyLCB0ZXhDb29yZExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJhdGNoLnRleENvb3JkcylcbiAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBiYXRjaC5jb3VudCAqIFBPSU5UU19QRVJfQk9YKVxuICAgIH0pXG4gIH1cbn1cbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5sZXQgSW5wdXRNYW5hZ2VyID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXG5sZXQgQ2xvY2sgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcbmxldCBMb2FkZXIgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgQXVkaW9TeXN0ZW0gID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcbmxldCBDYWNoZSAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVcblxuLy86OiBDbG9jayAtPiBDYWNoZSAtPiBMb2FkZXIgLT4gR0xSZW5kZXJlciAtPiBBdWRpb1N5c3RlbSAtPiBFbnRpdHlTdG9yZSAtPiBTY2VuZU1hbmFnZXJcbmZ1bmN0aW9uIEdhbWUgKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgXG4gICAgICAgICAgICAgICBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XG4gIGNoZWNrVHlwZShjbG9jaywgQ2xvY2spXG4gIGNoZWNrVHlwZShjYWNoZSwgQ2FjaGUpXG4gIGNoZWNrVHlwZShpbnB1dE1hbmFnZXIsIElucHV0TWFuYWdlcilcbiAgY2hlY2tUeXBlKGxvYWRlciwgTG9hZGVyKVxuICBjaGVja1R5cGUocmVuZGVyZXIsIEdMUmVuZGVyZXIpXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXG4gIGNoZWNrVHlwZShlbnRpdHlTdG9yZSwgRW50aXR5U3RvcmUpXG4gIGNoZWNrVHlwZShzY2VuZU1hbmFnZXIsIFNjZW5lTWFuYWdlcilcblxuICB0aGlzLmNsb2NrICAgICAgICA9IGNsb2NrXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXG4gIHRoaXMuaW5wdXRNYW5hZ2VyID0gaW5wdXRNYW5hZ2VyXG4gIHRoaXMucmVuZGVyZXIgICAgID0gcmVuZGVyZXJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxuICB0aGlzLmVudGl0eVN0b3JlICA9IGVudGl0eVN0b3JlXG4gIHRoaXMuc2NlbmVNYW5hZ2VyID0gc2NlbmVNYW5hZ2VyXG5cbiAgLy9JbnRyb2R1Y2UgYmktZGlyZWN0aW9uYWwgcmVmZXJlbmNlIHRvIGdhbWUgb2JqZWN0IG9udG8gZWFjaCBzY2VuZVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXG4gIH1cbn1cblxuR2FtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGFydFNjZW5lID0gdGhpcy5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmVcblxuICBjb25zb2xlLmxvZyhcImNhbGxpbmcgc2V0dXAgZm9yIFwiICsgc3RhcnRTY2VuZS5uYW1lKVxuICBzdGFydFNjZW5lLnNldHVwKChlcnIpID0+IGNvbnNvbGUubG9nKFwic2V0dXAgY29tcGxldGVkXCIpKVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cbn1cbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXRNYW5hZ2VyXG5cbi8vVE9ETzogY291bGQgdGFrZSBtb3VzZU1hbmFnZXIgYW5kIGdhbWVwYWQgbWFuYWdlcj9cbmZ1bmN0aW9uIElucHV0TWFuYWdlciAoa2V5Ym9hcmRNYW5hZ2VyKSB7XG4gIGNoZWNrVHlwZShrZXlib2FyZE1hbmFnZXIsIEtleWJvYXJkTWFuYWdlcilcbiAgdGhpcy5rZXlib2FyZE1hbmFnZXIgPSBrZXlib2FyZE1hbmFnZXIgXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxuXG5jb25zdCBLRVlfQ09VTlQgPSAyNTZcblxuZnVuY3Rpb24gS2V5Ym9hcmRNYW5hZ2VyIChkb2N1bWVudCkge1xuICBsZXQgaXNEb3ducyAgICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIGxldCBqdXN0VXBzICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQgZG93bkR1cmF0aW9ucyA9IG5ldyBVaW50MzJBcnJheShLRVlfQ09VTlQpXG4gIFxuICBsZXQgaGFuZGxlS2V5RG93biA9ICh7a2V5Q29kZX0pID0+IHtcbiAgICBqdXN0RG93bnNba2V5Q29kZV0gPSAhaXNEb3duc1trZXlDb2RlXVxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcbiAgfVxuXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcbiAgICBqdXN0VXBzW2tleUNvZGVdICAgPSB0cnVlXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gZmFsc2VcbiAgfVxuXG4gIGxldCBoYW5kbGVCbHVyID0gKCkgPT4ge1xuICAgIGxldCBpID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcbiAgICAgIGp1c3REb3duc1tpXSA9IDBcbiAgICAgIGp1c3RVcHNbaV0gICA9IDBcbiAgICB9XG4gIH1cblxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXG4gIHRoaXMuanVzdFVwcyAgICAgICA9IGp1c3RVcHNcbiAgdGhpcy5qdXN0RG93bnMgICAgID0ganVzdERvd25zXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcblxuICB0aGlzLnRpY2sgPSAoZFQpID0+IHtcbiAgICBsZXQgaSA9IC0xXG5cbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcbiAgICAgIGp1c3RVcHNbaV0gICA9IGZhbHNlXG4gICAgICBpZiAoaXNEb3duc1tpXSkgZG93bkR1cmF0aW9uc1tpXSArPSBkVFxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bilcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGhhbmRsZUtleVVwKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxufVxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtXG5cbmZ1bmN0aW9uIEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicmVuZGVyYWJsZVwiLCBcImFuaW1hdGVkXCJdKVxufVxuXG5LZXlmcmFtZUFuaW1hdGlvblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICBsZXQgZFQgID0gc2NlbmUuZ2FtZS5jbG9jay5kVFxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuICBsZXQgZW50XG4gIGxldCB0aW1lTGVmdFxuICBsZXQgY3VycmVudEluZGV4XG4gIGxldCBjdXJyZW50QW5pbVxuICBsZXQgY3VycmVudEZyYW1lXG4gIGxldCBuZXh0RnJhbWVcbiAgbGV0IG92ZXJzaG9vdFxuICBsZXQgc2hvdWxkQWR2YW5jZVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBlbnQgICAgICAgICAgID0gZW50aXRpZXNbaV0gXG4gICAgY3VycmVudEluZGV4ICA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXhcbiAgICBjdXJyZW50QW5pbSAgID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25cbiAgICBjdXJyZW50RnJhbWUgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleF1cbiAgICBuZXh0RnJhbWUgICAgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleCArIDFdIHx8IGN1cnJlbnRBbmltLmZyYW1lc1swXVxuICAgIHRpbWVMZWZ0ICAgICAgPSBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWVcbiAgICBvdmVyc2hvb3QgICAgID0gdGltZUxlZnQgLSBkVCAgIFxuICAgIHNob3VsZEFkdmFuY2UgPSBvdmVyc2hvb3QgPD0gMFxuICAgICAgXG4gICAgaWYgKHNob3VsZEFkdmFuY2UpIHtcbiAgICAgIGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXggPSBjdXJyZW50QW5pbS5mcmFtZXMuaW5kZXhPZihuZXh0RnJhbWUpXG4gICAgICBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWUgICAgID0gbmV4dEZyYW1lLmR1cmF0aW9uICsgb3ZlcnNob290IFxuICAgIH0gZWxzZSB7XG4gICAgICBlbnQuYW5pbWF0ZWQudGltZVRpbGxOZXh0RnJhbWUgPSBvdmVyc2hvb3QgXG4gICAgfVxuICB9XG59XG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XG5cbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgIGlmICghcGF0aCkgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIHBhdGggcHJvdmlkZWRcIikpXG5cbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXG5cbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxuICAgICAgeGhyLm9uZXJyb3IgICAgICA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICAgICAgeGhyLnNlbmQobnVsbClcbiAgICB9IFxuICB9XG5cbiAgbGV0IGxvYWRCdWZmZXIgPSBsb2FkWEhSKFwiYXJyYXlidWZmZXJcIilcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXG5cbiAgdGhpcy5sb2FkU2hhZGVyID0gbG9hZFN0cmluZ1xuXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsZXQgaSAgICAgICA9IG5ldyBJbWFnZVxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXG4gICAgXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxuICAgIGkuc3JjICAgICA9IHBhdGhcbiAgfVxuXG4gIHRoaXMubG9hZFNvdW5kID0gKHBhdGgsIGNiKSA9PiB7XG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxuICAgICAgbGV0IGRlY29kZUZhaWx1cmUgPSBjYlxuXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxuICAgIH0pIFxuICB9XG5cbiAgdGhpcy5sb2FkQXNzZXRzID0gKHtzb3VuZHMsIHRleHR1cmVzLCBzaGFkZXJzfSwgY2IpID0+IHtcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzIHx8IHt9KVxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcbiAgICBsZXQgc2hhZGVyS2V5cyAgID0gT2JqZWN0LmtleXMoc2hhZGVycyB8fCB7fSlcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcbiAgICBsZXQgc2hhZGVyQ291bnQgID0gc2hhZGVyS2V5cy5sZW5ndGhcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcbiAgICBsZXQgayAgICAgICAgICAgID0gLTFcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxuICAgIH1cblxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XG4gICAgICBpZiAoc291bmRDb3VudCA8PSAwICYmIHRleHR1cmVDb3VudCA8PSAwICYmIHNoYWRlckNvdW50IDw9IDApIGNiKG51bGwsIG91dCkgXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU291bmQgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgc291bmRDb3VudC0tXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJUZXh0dXJlID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHRleHR1cmVDb3VudC0tXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclNoYWRlciA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzaGFkZXJDb3VudC0tXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgd2hpbGUgKHNvdW5kS2V5c1srK2ldKSB7XG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXG5cbiAgICAgIHRoaXMubG9hZFNvdW5kKHNvdW5kc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxuXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcbiAgICAgIGxldCBrZXkgPSBzaGFkZXJLZXlzW2tdXG5cbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTaGFkZXIoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBQYWRkbGVNb3ZlclN5c3RlbVxuXG5mdW5jdGlvbiBQYWRkbGVNb3ZlclN5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJwbGF5ZXJDb250cm9sbGVkXCJdKVxufVxuXG5QYWRkbGVNb3ZlclN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICBsZXQge2Nsb2NrLCBpbnB1dE1hbmFnZXJ9ID0gc2NlbmUuZ2FtZVxuICBsZXQge2tleWJvYXJkTWFuYWdlcn0gPSBpbnB1dE1hbmFnZXJcbiAgbGV0IG1vdmVTcGVlZCA9IDFcbiAgbGV0IHBhZGRsZSAgICA9IGVudGl0aWVzWzBdXG5cbiAgLy9jYW4gaGFwcGVuIGR1cmluZyBsb2FkaW5nIGZvciBleGFtcGxlXG4gIGlmICghcGFkZGxlKSByZXR1cm5cblxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzddKSBwYWRkbGUucGh5c2ljcy54IC09IGNsb2NrLmRUICogbW92ZVNwZWVkXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szOV0pIHBhZGRsZS5waHlzaWNzLnggKz0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcbn1cbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cblxuZnVuY3Rpb24gUmVuZGVyaW5nU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXG59XG5cblJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxuICBsZXQgaSAgID0gLTFcbiAgbGV0IGVudFxuICBsZXQgZnJhbWVcblxuICByZW5kZXJlci5mbHVzaCgpXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGVudCA9IGVudGl0aWVzW2ldXG5cbiAgICBpZiAoZW50LmFuaW1hdGVkKSB7XG4gICAgICBmcmFtZSA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uLmZyYW1lc1tlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbkluZGV4XVxuICAgICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxuICAgICAgICBlbnQucmVuZGVyYWJsZS5pbWFnZSwgLy9pbWFnZVxuICAgICAgICBlbnQucGh5c2ljcy53aWR0aCxcbiAgICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxuICAgICAgICBlbnQucGh5c2ljcy54LFxuICAgICAgICBlbnQucGh5c2ljcy55LFxuICAgICAgICBmcmFtZS5hYWJiLmgsXG4gICAgICAgIGZyYW1lLmFhYmIudyxcbiAgICAgICAgZnJhbWUuYWFiYi54LFxuICAgICAgICBmcmFtZS5hYWJiLnlcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxuICAgICAgICBlbnQucmVuZGVyYWJsZS5pbWFnZSwgLy9pbWFnZVxuICAgICAgICBlbnQucGh5c2ljcy53aWR0aCxcbiAgICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxuICAgICAgICBlbnQucGh5c2ljcy54LFxuICAgICAgICBlbnQucGh5c2ljcy55LFxuICAgICAgICAxLCAgLy90ZXh0dXJlIHdpZHRoXG4gICAgICAgIDEsICAvL3RleHR1cmUgaGVpZ2h0XG4gICAgICAgIDAsICAvL3RleHR1cmUgeFxuICAgICAgICAwICAgLy90ZXh0dXJlIHlcbiAgICAgIClcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU2NlbmVcblxuZnVuY3Rpb24gU2NlbmUgKG5hbWUsIHN5c3RlbXMpIHtcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWVcIilcblxuICB0aGlzLm5hbWUgICAgPSBuYW1lXG4gIHRoaXMuc3lzdGVtcyA9IHN5c3RlbXNcbiAgdGhpcy5nYW1lICAgID0gbnVsbFxufVxuXG5TY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgY2IobnVsbCwgbnVsbCkgIFxufVxuXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRUKSB7XG4gIGxldCBzdG9yZSA9IHRoaXMuZ2FtZS5lbnRpdHlTdG9yZVxuICBsZXQgbGVuICAgPSB0aGlzLnN5c3RlbXMubGVuZ3RoXG4gIGxldCBpICAgICA9IC0xXG4gIGxldCBzeXN0ZW1cblxuICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldIFxuICAgIHN5c3RlbS5ydW4odGhpcywgc3RvcmUucXVlcnkoc3lzdGVtLmNvbXBvbmVudE5hbWVzKSlcbiAgfVxufVxuIiwibGV0IHtmaW5kV2hlcmV9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmVNYW5hZ2VyXG5cbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XG4gIGlmIChzY2VuZXMubGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBvbmUgb3IgbW9yZSBzY2VuZXNcIilcblxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcbiAgbGV0IHNjZW5lcyAgICAgICAgICAgPSBzY2VuZXNcblxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXG4gIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleF1cblxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcbiAgICBsZXQgc2NlbmUgPSBmaW5kV2hlcmUoXCJuYW1lXCIsIHNjZW5lTmFtZSwgc2NlbmVzKVxuXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcblxuICAgIGFjdGl2ZVNjZW5lSW5kZXggPSBzY2VuZXMuaW5kZXhPZihzY2VuZSlcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcbiAgfVxuXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleCArIDFdXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcblxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbKythY3RpdmVTY2VuZUluZGV4XVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbVxuXG5mdW5jdGlvbiBTeXN0ZW0gKGNvbXBvbmVudE5hbWVzPVtdKSB7XG4gIHRoaXMuY29tcG9uZW50TmFtZXMgPSBjb21wb25lbnROYW1lc1xufVxuXG4vL3NjZW5lLmdhbWUuY2xvY2tcblN5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICAvL2RvZXMgc29tZXRoaW5nIHcvIHRoZSBsaXN0IG9mIGVudGl0aWVzIHBhc3NlZCB0byBpdFxufVxuIiwibGV0IHtQYWRkbGUsIEJsb2NrfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXG5sZXQgUGFkZGxlTW92ZXJTeXN0ZW0gICAgICAgPSByZXF1aXJlKFwiLi9QYWRkbGVNb3ZlclN5c3RlbVwiKVxubGV0IFJlbmRlcmluZ1N5c3RlbSAgICAgICAgID0gcmVxdWlyZShcIi4vUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gPSByZXF1aXJlKFwiLi9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbVwiKVxubGV0IFNjZW5lICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcblxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcbiAgbGV0IHN5c3RlbXMgPSBbXG4gICAgbmV3IFBhZGRsZU1vdmVyU3lzdGVtLCBcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXG4gICAgbmV3IFJlbmRlcmluZ1N5c3RlbVxuICBdXG5cbiAgU2NlbmUuY2FsbCh0aGlzLCBcInRlc3RcIiwgc3lzdGVtcylcbn1cblxuVGVzdFNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2NlbmUucHJvdG90eXBlKVxuXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XG4gIGxldCB7Y2FjaGUsIGxvYWRlciwgZW50aXR5U3RvcmUsIGF1ZGlvU3lzdGVtfSA9IHRoaXMuZ2FtZSBcbiAgbGV0IHtiZ30gPSBhdWRpb1N5c3RlbS5jaGFubmVsc1xuICBsZXQgYXNzZXRzID0ge1xuICAgIC8vc291bmRzOiB7IGJnTXVzaWM6IFwiL3B1YmxpYy9zb3VuZHMvYmdtMS5tcDNcIiB9LFxuICAgIHRleHR1cmVzOiB7IFxuICAgICAgcGFkZGxlOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIixcbiAgICAgIGJsb2NrczogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCJcbiAgICB9XG4gIH1cblxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xuICAgIGxldCB7dGV4dHVyZXMsIHNvdW5kc30gPSBsb2FkZWRBc3NldHMgXG5cbiAgICBjYWNoZS5zb3VuZHMgICA9IHNvdW5kc1xuICAgIGNhY2hlLnRleHR1cmVzID0gdGV4dHVyZXNcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEJsb2NrKHRleHR1cmVzLmJsb2NrcywgNDQsIDIyLCA4MDAsIDgwMCkpXG4gICAgLy9iZy52b2x1bWUgPSAwXG4gICAgLy9iZy5sb29wKGNhY2hlLnNvdW5kcy5iZ011c2ljKVxuICAgIGNiKG51bGwpXG4gIH0pXG59XG4iLCJsZXQge1JlbmRlcmFibGUsIFBoeXNpY3MsIFBsYXllckNvbnRyb2xsZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IHtBbmltYXRlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQgQW5pbWF0aW9uID0gcmVxdWlyZShcIi4vQW5pbWF0aW9uXCIpXG5sZXQgRW50aXR5ICAgID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXG5cbm1vZHVsZS5leHBvcnRzLlBhZGRsZSA9IFBhZGRsZVxubW9kdWxlLmV4cG9ydHMuQmxvY2sgID0gQmxvY2tcblxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFBsYXllckNvbnRyb2xsZWQodGhpcylcbn1cblxuZnVuY3Rpb24gQmxvY2sgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbiAgQW5pbWF0ZWQodGhpcywgXCJpZGxlXCIsIHtcbiAgICBpZGxlOiBuZXcgQW5pbWF0aW9uKDQ0LCAyMiwgMCwgMCwgMywgdHJ1ZSwgMTAwMClcbiAgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzLlJlbmRlcmFibGUgICAgICAgPSBSZW5kZXJhYmxlXG5tb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgICAgICAgID0gUGh5c2ljc1xubW9kdWxlLmV4cG9ydHMuUGxheWVyQ29udHJvbGxlZCA9IFBsYXllckNvbnRyb2xsZWRcbm1vZHVsZS5leHBvcnRzLkFuaW1hdGVkICAgICAgICAgPSBBbmltYXRlZFxuXG5mdW5jdGlvbiBSZW5kZXJhYmxlIChlLCBpbWFnZSwgd2lkdGgsIGhlaWdodCkge1xuICBlLnJlbmRlcmFibGUgPSB7XG4gICAgaW1hZ2UsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIHJvdGF0aW9uOiAwLFxuICAgIGNlbnRlcjoge1xuICAgICAgeDogd2lkdGggLyAyLFxuICAgICAgeTogaGVpZ2h0IC8gMiBcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiAxLFxuICAgICAgeTogMSBcbiAgICB9XG4gIH0gXG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgZS5waHlzaWNzID0ge1xuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHgsIFxuICAgIHksIFxuICAgIGR4OiAgMCwgXG4gICAgZHk6ICAwLCBcbiAgICBkZHg6IDAsIFxuICAgIGRkeTogMFxuICB9XG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBsYXllckNvbnRyb2xsZWQgKGUpIHtcbiAgZS5wbGF5ZXJDb250cm9sbGVkID0gdHJ1ZVxufVxuXG5mdW5jdGlvbiBBbmltYXRlZCAoZSwgZGVmYXVsdEFuaW1hdGlvbk5hbWUsIGFuaW1IYXNoKSB7XG4gIGUuYW5pbWF0ZWQgPSB7XG4gICAgYW5pbWF0aW9uczogICAgICAgICAgICBhbmltSGFzaCxcbiAgICBjdXJyZW50QW5pbWF0aW9uTmFtZTogIGRlZmF1bHRBbmltYXRpb25OYW1lLFxuICAgIGN1cnJlbnRBbmltYXRpb25JbmRleDogMCxcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1IYXNoW2RlZmF1bHRBbmltYXRpb25OYW1lXSxcbiAgICB0aW1lVGlsbE5leHRGcmFtZTogICAgIGFuaW1IYXNoW2RlZmF1bHRBbmltYXRpb25OYW1lXS5mcmFtZXNbMF0uZHVyYXRpb25cbiAgfSBcbn1cbiIsIm1vZHVsZS5leHBvcnRzLmZpbmRXaGVyZSA9IGZpbmRXaGVyZVxubW9kdWxlLmV4cG9ydHMuaGFzS2V5cyAgID0gaGFzS2V5c1xuXG4vLzo6IFt7fV0gLT4gU3RyaW5nIC0+IE1heWJlIEFcbmZ1bmN0aW9uIGZpbmRXaGVyZSAoa2V5LCBwcm9wZXJ0eSwgYXJyYXlPZk9iamVjdHMpIHtcbiAgbGV0IGxlbiAgID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoXG4gIGxldCBpICAgICA9IC0xXG4gIGxldCBmb3VuZCA9IG51bGxcblxuICB3aGlsZSAoICsraSA8IGxlbiApIHtcbiAgICBpZiAoYXJyYXlPZk9iamVjdHNbaV1ba2V5XSA9PT0gcHJvcGVydHkpIHtcbiAgICAgIGZvdW5kID0gYXJyYXlPZk9iamVjdHNbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuXG5mdW5jdGlvbiBoYXNLZXlzIChrZXlzLCBvYmopIHtcbiAgbGV0IGkgPSAtMVxuICBcbiAgd2hpbGUgKGtleXNbKytpXSkgaWYgKCFvYmpba2V5c1tpXV0pIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxufVxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gQnVmZmVyIC0+IEludCAtPiBJbnQgLT4gRmxvYXQzMkFycmF5XG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxufVxuXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcbiAgXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG5cbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxuXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBzcmMpXG4gIHJldHVybiAgICAgICAgc2hhZGVyXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcblxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuICByZXR1cm4gdGV4dHVyZVxufVxuXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcbiIsImxldCBMb2FkZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgRW50aXR5U3RvcmUgICAgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgQ2xvY2sgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcbmxldCBDYWNoZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxubGV0IEdhbWUgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcbmxldCBJbnB1dE1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcbmxldCBBdWRpb1N5c3RlbSAgICAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IGNhbnZhcyAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbmxldCB2ZXJ0ZXhTcmMgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZlcnRleFwiKS50ZXh0XG5sZXQgZnJhZ1NyYyAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcmFnbWVudFwiKS50ZXh0XG5cbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDI1XG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXG5cbmxldCBrZXlib2FyZE1hbmFnZXIgPSBuZXcgS2V5Ym9hcmRNYW5hZ2VyKGRvY3VtZW50KVxubGV0IGlucHV0TWFuYWdlciAgICA9IG5ldyBJbnB1dE1hbmFnZXIoa2V5Ym9hcmRNYW5hZ2VyKVxubGV0IHJlbmRlcmVyT3B0cyAgICA9IHsgbWF4U3ByaXRlQ291bnQ6IE1BWF9DT1VOVCB9XG5sZXQgZW50aXR5U3RvcmUgICAgID0gbmV3IEVudGl0eVN0b3JlXG5sZXQgY2xvY2sgICAgICAgICAgID0gbmV3IENsb2NrKERhdGUubm93KVxubGV0IGNhY2hlICAgICAgICAgICA9IG5ldyBDYWNoZShbXCJzb3VuZHNcIiwgXCJ0ZXh0dXJlc1wiXSlcbmxldCBsb2FkZXIgICAgICAgICAgPSBuZXcgTG9hZGVyXG5sZXQgcmVuZGVyZXIgICAgICAgID0gbmV3IEdMUmVuZGVyZXIoY2FudmFzLCB2ZXJ0ZXhTcmMsIGZyYWdTcmMsIHJlbmRlcmVyT3B0cylcbmxldCBhdWRpb1N5c3RlbSAgICAgPSBuZXcgQXVkaW9TeXN0ZW0oW1wibWFpblwiLCBcImJnXCJdKVxubGV0IHNjZW5lTWFuYWdlciAgICA9IG5ldyBTY2VuZU1hbmFnZXIoW25ldyBUZXN0U2NlbmVdKVxubGV0IGdhbWUgICAgICAgICAgICA9IG5ldyBHYW1lKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBlbnRpdHlTdG9yZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVNYW5hZ2VyKVxuXG5mdW5jdGlvbiBtYWtlVXBkYXRlIChnYW1lKSB7XG4gIGxldCBzdG9yZSAgICAgICAgICA9IGdhbWUuZW50aXR5U3RvcmVcbiAgbGV0IGNsb2NrICAgICAgICAgID0gZ2FtZS5jbG9ja1xuICBsZXQgaW5wdXRNYW5hZ2VyICAgPSBnYW1lLmlucHV0TWFuYWdlclxuICBsZXQgY29tcG9uZW50TmFtZXMgPSBbXCJyZW5kZXJhYmxlXCIsIFwicGh5c2ljc1wiXVxuXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIGNsb2NrLnRpY2soKVxuICAgIGlucHV0TWFuYWdlci5rZXlib2FyZE1hbmFnZXIudGljayhjbG9jay5kVClcbiAgICBnYW1lLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZS51cGRhdGUoY2xvY2suZFQpXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdhbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIGdhbWUucmVuZGVyZXIucmVuZGVyKClcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgIFxuICB9XG59XG5cbndpbmRvdy5nYW1lID0gZ2FtZVxuXG5mdW5jdGlvbiBzZXR1cERvY3VtZW50IChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpIHtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIH0pXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgc2V0dXBEb2N1bWVudChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpXG4gIGdhbWUuc3RhcnQoKVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSksIFVQREFURV9JTlRFUlZBTClcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxuXG5mdW5jdGlvbiBjaGVja1R5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgY3RvcikpIHRocm93IG5ldyBFcnJvcihcIk11c3QgYmUgb2YgdHlwZSBcIiArIGN0b3IubmFtZSlcbn1cblxuZnVuY3Rpb24gY2hlY2tWYWx1ZVR5cGUgKGluc3RhbmNlLCBjdG9yKSB7XG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSBjaGVja1R5cGUoaW5zdGFuY2Vba2V5c1tpXV0sIGN0b3IpXG59XG4iXX0=
