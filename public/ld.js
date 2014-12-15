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
    //TODO: We are temporarily using a single texture.  should change!
    loaded = true;
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return onlyTexture;
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
      setBox(boxes, freeIndex++, entities[i].renderable.width, entities[i].renderable.height, entities[i].physics.x, entities[i].physics.y);
      activeSprites++;
    }
  };

  this.addSprite = function (image, w, h, x, y, tw, th, tx, ty) {
    //TODO: temporary hard coded single sprite
    if (!loaded) _this.addTexture(image);
    setBox(boxes, freeIndex++, w, h, x, y);
    activeSprites++;
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
  var len = entities.length;
  var i = -1;
  var ent;

  renderer.flush();

  while (++i < len) {
    ent = entities[i];
    renderer.addSprite(ent.renderable.image, //image
    ent.physics.width, ent.physics.height, ent.physics.x, ent.physics.y, 1, //texture width
    1, //texture height
    0, //texture x
    0 //texture y
    );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9BQUJCLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQW5pbWF0aW9uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQXVkaW9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYWNoZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvR0xSZW5kZXJlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dhbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9JbnB1dE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlib2FyZE1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0xvYWRlci5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1BhZGRsZU1vdmVyU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC10eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2xkLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVWLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxDQUFBO0tBQUU7R0FDbkIsQ0FBQyxDQUFBO0FBQ0YsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLENBQUE7S0FBRTtH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VSxHQUFRLGVBQWUsR0FBRyxjQUFjLENBQUE7O0FBRXhELFNBQVMsTUFBTSxDQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzVDLE1BQUksQ0FBQyxHQUFJLFVBQVUsR0FBRyxLQUFLLENBQUE7QUFDM0IsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNkLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWQsVUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFNLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTs7QUFFbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDcEI7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LENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDekUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBBQUJCICh3LCBoLCB4LCB5KSB7XG4gIHRoaXMueCA9IHhcbiAgdGhpcy55ID0geVxuICB0aGlzLncgPSB3XG4gIHRoaXMuaCA9IGhcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHhcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHggfSBcbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx5XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB5IH0gXG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeFwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geCArIHcgfVxuICB9KVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnlcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHkgKyBoIH1cbiAgfSlcbn1cbiIsImxldCBBQUJCID0gcmVxdWlyZShcIi4vQUFCQlwiKVxuXG5mdW5jdGlvbiBGcmFtZSAoYWFiYiwgZHVyYXRpb24pIHtcbiAgdGhpcy5hYWJiICAgICA9IGFhYmJcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG59XG5cbi8vcmF0ZSBpcyBpbiBtcy4gIFRoaXMgaXMgdGhlIHRpbWUgcGVyIGZyYW1lICg0MiB+IDI0ZnBzKVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBBbmltYXRpb24gKHcsIGgsIHgsIHksIGNvdW50LCBkb2VzTG9vcCwgcmF0ZT00Mikge1xuICBsZXQgZnJhbWVzID0gW11cbiAgbGV0IGkgICAgICA9IC0xXG4gIGxldCBlYWNoWFxuICBsZXQgYWFiYlxuXG4gIHdoaWxlICgrK2kgPCBjb3VudCkge1xuICAgIGVhY2hYID0geCArIGNvdW50ICogd1xuICAgIGFhYmIgID0gbmV3IEFBQkIodywgaCwgZWFjaFgsIHkpXG4gICAgZnJhbWVzLnB1c2gobmV3IEZyYW1lKGFhYmIsIHJhdGUpKVxuICB9XG5cbiAgdGhpcy5sb29wICAgPSBkb2VzTG9vcFxuICB0aGlzLnJhdGUgICA9IHJhdGVcbiAgdGhpcy5mcmFtZXMgPSBmcmFtZXNcbn1cbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcbiAgbGV0IGNoYW5uZWwgPSBjb250ZXh0LmNyZWF0ZUdhaW4oKVxuICBcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcbiAgICBzcmMuY29ubmVjdChwYW5uZXIpXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXG4gIH1cblxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxuXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcblxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcbiAgICAgIHNyYy5zdGFydCgwKVxuICAgICAgcmV0dXJuIHNyY1xuICAgIH0gXG4gIH1cblxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbC5nYWluLnZhbHVlIH0sXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cbiAgfSlcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwgfVxuICB9KVxuXG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXG59XG5cbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcbiAgbGV0IGNvbnRleHQgID0gbmV3IEF1ZGlvQ29udGV4dFxuICBsZXQgY2hhbm5lbHMgPSB7fVxuICBsZXQgaSAgICAgICAgPSAtMVxuXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXG4gIH1cbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENhY2hlIChrZXlOYW1lcykge1xuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXG5cbmZ1bmN0aW9uIENsb2NrICh0aW1lRm49RGF0ZS5ub3cpIHtcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcbiAgdGhpcy5kVCA9IDBcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxuICAgIHRoaXMubmV3VGltZSA9IHRpbWVGbigpICBcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbiAgfVxufVxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXG5cbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xuICB0aGlzLmVudGl0aWVzICA9IFtdXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXG4gIHJldHVybiBpZFxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcbiAgbGV0IGkgPSAtMVxuICBsZXQgZW50aXR5XG5cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxuXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxuICB9XG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxufVxuIiwibGV0IHtTaGFkZXIsIFByb2dyYW0sIFRleHR1cmV9ID0gcmVxdWlyZShcIi4vZ2wtdHlwZXNcIilcbmxldCB7dXBkYXRlQnVmZmVyfSA9IHJlcXVpcmUoXCIuL2dsLWJ1ZmZlclwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdMUmVuZGVyZXJcblxuY29uc3QgUE9JTlRfRElNRU5TSU9OID0gMlxuY29uc3QgUE9JTlRTX1BFUl9CT1ggID0gNlxuY29uc3QgQk9YX0xFTkdUSCAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcblxuZnVuY3Rpb24gc2V0Qm94IChib3hBcnJheSwgaW5kZXgsIHcsIGgsIHgsIHkpIHtcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XG4gIGxldCB4MSA9IHhcbiAgbGV0IHkxID0geSBcbiAgbGV0IHgyID0geCArIHdcbiAgbGV0IHkyID0geSArIGhcblxuICBib3hBcnJheVtpXSAgICA9IHgxXG4gIGJveEFycmF5W2krMV0gID0geTFcbiAgYm94QXJyYXlbaSsyXSAgPSB4MlxuICBib3hBcnJheVtpKzNdICA9IHkxXG4gIGJveEFycmF5W2krNF0gID0geDFcbiAgYm94QXJyYXlbaSs1XSAgPSB5MlxuXG4gIGJveEFycmF5W2krNl0gID0geDFcbiAgYm94QXJyYXlbaSs3XSAgPSB5MlxuICBib3hBcnJheVtpKzhdICA9IHgyXG4gIGJveEFycmF5W2krOV0gID0geTFcbiAgYm94QXJyYXlbaSsxMF0gPSB4MlxuICBib3hBcnJheVtpKzExXSA9IHkyXG59XG5cbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIFNjYWxlQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47ICsraSkgYXJbaV0gPSAxXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxufVxuXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpICBcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcbiAgICBhcltpXSAgICA9IDBcbiAgICBhcltpKzFdICA9IDBcbiAgICBhcltpKzJdICA9IDFcbiAgICBhcltpKzNdICA9IDBcbiAgICBhcltpKzRdICA9IDBcbiAgICBhcltpKzVdICA9IDFcblxuICAgIGFyW2krNl0gID0gMFxuICAgIGFyW2krN10gID0gMVxuICAgIGFyW2krOF0gID0gMVxuICAgIGFyW2krOV0gID0gMFxuICAgIGFyW2krMTBdID0gMVxuICAgIGFyW2krMTFdID0gMVxuICB9IFxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB2U3JjLCBmU3JjLCBvcHRpb25zPXt9KSB7XG4gIGxldCB7bWF4U3ByaXRlQ291bnQsIHdpZHRoLCBoZWlnaHR9ID0gb3B0aW9uc1xuICBsZXQgbWF4U3ByaXRlQ291bnQgPSBtYXhTcHJpdGVDb3VudCB8fCAxMDBcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXG4gIGxldCBnbCAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgICAgICBcbiAgbGV0IHZzICAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxuICBsZXQgZnMgICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcbiAgbGV0IHByb2dyYW0gICAgICAgID0gUHJvZ3JhbShnbCwgdnMsIGZzKVxuXG4gIC8vaW5kZXggZm9yIHRyYWNraW5nIHRoZSBjdXJyZW50IGF2YWlsYWJsZSBwb3NpdGlvbiB0byBpbnN0YW50aWF0ZSBmcm9tXG4gIGxldCBmcmVlSW5kZXggICAgID0gMFxuICBsZXQgYWN0aXZlU3ByaXRlcyA9IDBcblxuICAvL3ZpZXdzIG92ZXIgY3B1IGJ1ZmZlcnMgZm9yIGRhdGFcbiAgbGV0IGJveGVzICAgICA9IEJveEFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgY2VudGVycyAgID0gQ2VudGVyQXJyYXkobWF4U3ByaXRlQ291bnQpXG4gIGxldCBzY2FsZXMgICAgPSBTY2FsZUFycmF5KG1heFNwcml0ZUNvdW50KVxuICBsZXQgcm90YXRpb25zID0gUm90YXRpb25BcnJheShtYXhTcHJpdGVDb3VudClcbiAgbGV0IHRleENvb3JkcyA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KG1heFNwcml0ZUNvdW50KVxuXG4gIC8vaGFuZGxlcyB0byBHUFUgYnVmZmVyc1xuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgY2VudGVyQnVmZmVyICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgc2NhbGVCdWZmZXIgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgdGV4Q29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuXG4gIC8vR1BVIGJ1ZmZlciBsb2NhdGlvbnNcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIilcbiAgLy9sZXQgY2VudGVyTG9jYXRpb24gICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jZW50ZXJcIilcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXG4gIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3RleENvb3JkXCIpXG5cbiAgLy9Vbmlmb3JtIGxvY2F0aW9uc1xuICBsZXQgd29ybGRTaXplTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxuXG4gIC8vVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgZm9yIHRlc3RpbmcgdGhlIHNpbmdsZSB0ZXh0dXJlIGNhc2VcbiAgbGV0IG9ubHlUZXh0dXJlID0gVGV4dHVyZShnbClcbiAgbGV0IGxvYWRlZCAgICAgID0gZmFsc2VcblxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXG4gIGdsLmNsZWFyQ29sb3IoMS4wLCAxLjAsIDEuMCwgMC4wKVxuICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSlcbiAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKVxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcbiAgICB3aWR0aDogIHdpZHRoIHx8IDE5MjAsIFxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcbiAgfVxuXG4gIC8vVE9ETzogVGhpcyBzaG91bGQgbm90IGJlIHB1YmxpYyBhcGkuICBlbnRpdGllcyBjb250YWluIHJlZmVyZW5jZXNcbiAgLy90byB0aGVpciBpbWFnZSB3aGljaCBzaG91bGQgYmUgV2Vha21hcCBzdG9yZWQgd2l0aCBhIHRleHR1cmUgYW5kIHVzZWRcbiAgdGhpcy5hZGRUZXh0dXJlID0gKGltYWdlKSA9PiB7XG4gICAgLy9UT0RPOiBXZSBhcmUgdGVtcG9yYXJpbHkgdXNpbmcgYSBzaW5nbGUgdGV4dHVyZS4gIHNob3VsZCBjaGFuZ2UhXG4gICAgbG9hZGVkID0gdHJ1ZVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG9ubHlUZXh0dXJlKVxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpOyBcbiAgICByZXR1cm4gb25seVRleHR1cmVcbiAgfVxuXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XG5cbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxuICB9XG5cbiAgdGhpcy5hZGRFbnRpdGllcyA9IChlbnRpdGllcykgPT4ge1xuICAgIGlmICghbG9hZGVkICYmIGVudGl0aWVzWzBdKSB0aGlzLmFkZFRleHR1cmUoZW50aXRpZXNbMF0ucmVuZGVyYWJsZS5pbWFnZSlcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBzZXRCb3goXG4gICAgICAgIGJveGVzLCBcbiAgICAgICAgZnJlZUluZGV4KyssIFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLndpZHRoLFxuICAgICAgICBlbnRpdGllc1tpXS5yZW5kZXJhYmxlLmhlaWdodCxcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy54LCBcbiAgICAgICAgZW50aXRpZXNbaV0ucGh5c2ljcy55XG4gICAgICApXG4gICAgICBhY3RpdmVTcHJpdGVzKytcbiAgICB9XG4gIH1cblxuICB0aGlzLmFkZFNwcml0ZSA9IChpbWFnZSwgdywgaCwgeCwgeSwgdHcsIHRoLCB0eCwgdHkpID0+IHtcbiAgICAvL1RPRE86IHRlbXBvcmFyeSBoYXJkIGNvZGVkIHNpbmdsZSBzcHJpdGVcbiAgICBpZiAoIWxvYWRlZCkgdGhpcy5hZGRUZXh0dXJlKGltYWdlKVxuICAgIHNldEJveChib3hlcywgZnJlZUluZGV4KyssIHcsIGgsIHgsIHkpXG4gICAgYWN0aXZlU3ByaXRlcysrXG4gIH1cblxuICB0aGlzLmZsdXNoID0gKCkgPT4ge1xuICAgIGZyZWVJbmRleCAgICAgPSAwXG4gICAgYWN0aXZlU3ByaXRlcyA9IDBcbiAgfVxuXG4gIHRoaXMucmVuZGVyID0gKCkgPT4ge1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgb25seVRleHR1cmUpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBib3hCdWZmZXIsIGJveExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJveGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgcm90YXRpb25CdWZmZXIsIHJvdExvY2F0aW9uLCAxLCByb3RhdGlvbnMpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCB0ZXhDb29yZHMpXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplTG9jYXRpb24sIDE5MjAsIDEwODApXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGFjdGl2ZVNwcml0ZXMgKiBQT0lOVFNfUEVSX0JPWClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZVxuXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxuZnVuY3Rpb24gR2FtZSAoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcblxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcbiAgfVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxuXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXG59XG5cbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dE1hbmFnZXJcblxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChrZXlib2FyZE1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXG5cbmNvbnN0IEtFWV9DT1VOVCA9IDI1NlxuXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XG4gIGxldCBpc0Rvd25zICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIGxldCBkb3duRHVyYXRpb25zID0gbmV3IFVpbnQzMkFycmF5KEtFWV9DT1VOVClcbiAgXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3REb3duc1trZXlDb2RlXSA9ICFpc0Rvd25zW2tleUNvZGVdXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSBmYWxzZVxuICB9XG5cbiAgbGV0IGhhbmRsZUJsdXIgPSAoKSA9PiB7XG4gICAgbGV0IGkgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xuICAgICAgaXNEb3duc1tpXSAgID0gMFxuICAgICAganVzdERvd25zW2ldID0gMFxuICAgICAganVzdFVwc1tpXSAgID0gMFxuICAgIH1cbiAgfVxuXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xuICB0aGlzLmp1c3REb3ducyAgICAgPSBqdXN0RG93bnNcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xuXG4gIHRoaXMudGljayA9IChkVCkgPT4ge1xuICAgIGxldCBpID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcbiAgICAgIGlmIChpc0Rvd25zW2ldKSBkb3duRHVyYXRpb25zW2ldICs9IGRUXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXG59XG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cblxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJyZW5kZXJhYmxlXCIsIFwiYW5pbWF0ZWRcIl0pXG59XG5cbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcbiAgbGV0IGkgICA9IC0xXG4gIGxldCBlbnRcbiAgbGV0IHRpbWVMZWZ0XG4gIGxldCBjdXJyZW50SW5kZXhcbiAgbGV0IGN1cnJlbnRBbmltXG4gIGxldCBjdXJyZW50RnJhbWVcbiAgbGV0IG5leHRGcmFtZVxuICBsZXQgb3ZlcnNob290XG4gIGxldCBzaG91bGRBZHZhbmNlXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcbiAgICBjdXJyZW50SW5kZXggID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleFxuICAgIGN1cnJlbnRBbmltICAgPSBlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvblxuICAgIGN1cnJlbnRGcmFtZSAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4XVxuICAgIG5leHRGcmFtZSAgICAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4ICsgMV0gfHwgY3VycmVudEFuaW0uZnJhbWVzWzBdXG4gICAgdGltZUxlZnQgICAgICA9IGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZVxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXG4gICAgICBcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xuICAgICAgZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSAgICAgPSBuZXh0RnJhbWUuZHVyYXRpb24gKyBvdmVyc2hvb3QgXG4gICAgfSBlbHNlIHtcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcbiAgICB9XG4gIH1cbn1cbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcblxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcblxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcblxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gICAgICB4aHIuc2VuZChudWxsKVxuICAgIH0gXG4gIH1cblxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcblxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXG5cbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICBcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXG4gICAgaS5zcmMgICAgID0gcGF0aFxuICB9XG5cbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXG5cbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXG4gICAgfSkgXG4gIH1cblxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXG4gICAgfVxuXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzb3VuZENvdW50LS1cbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgdGV4dHVyZUNvdW50LS1cbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNoYWRlckNvdW50LS1cbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cblxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXG5cbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cblxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXG5cbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXG59XG5cblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7Y2xvY2ssIGlucHV0TWFuYWdlcn0gPSBzY2VuZS5nYW1lXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxuICBsZXQgbW92ZVNwZWVkID0gMVxuICBsZXQgcGFkZGxlICAgID0gZW50aXRpZXNbMF1cblxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcbiAgaWYgKCFwYWRkbGUpIHJldHVyblxuXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxufVxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmluZ1N5c3RlbVxuXG5mdW5jdGlvbiBSZW5kZXJpbmdTeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicmVuZGVyYWJsZVwiXSlcbn1cblxuUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuICBsZXQgZW50XG5cbiAgcmVuZGVyZXIuZmx1c2goKVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBlbnQgPSBlbnRpdGllc1tpXVxuICAgIHJlbmRlcmVyLmFkZFNwcml0ZShcbiAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXG4gICAgICBlbnQucGh5c2ljcy53aWR0aCxcbiAgICAgIGVudC5waHlzaWNzLmhlaWdodCxcbiAgICAgIGVudC5waHlzaWNzLngsXG4gICAgICBlbnQucGh5c2ljcy55LFxuICAgICAgMSwgIC8vdGV4dHVyZSB3aWR0aFxuICAgICAgMSwgIC8vdGV4dHVyZSBoZWlnaHRcbiAgICAgIDAsICAvL3RleHR1cmUgeFxuICAgICAgMCAgIC8vdGV4dHVyZSB5XG4gICAgKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXG5cbmZ1bmN0aW9uIFNjZW5lIChuYW1lLCBzeXN0ZW1zKSB7XG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXG5cbiAgdGhpcy5uYW1lICAgID0gbmFtZVxuICB0aGlzLnN5c3RlbXMgPSBzeXN0ZW1zXG4gIHRoaXMuZ2FtZSAgICA9IG51bGxcbn1cblxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XG4gIGNiKG51bGwsIG51bGwpICBcbn1cblxuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkVCkge1xuICBsZXQgc3RvcmUgPSB0aGlzLmdhbWUuZW50aXR5U3RvcmVcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxuICBsZXQgaSAgICAgPSAtMVxuICBsZXQgc3lzdGVtXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXSBcbiAgICBzeXN0ZW0ucnVuKHRoaXMsIHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXG4gIH1cbn1cbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lTWFuYWdlclxuXG5mdW5jdGlvbiBTY2VuZU1hbmFnZXIgKHNjZW5lcz1bXSkge1xuICBpZiAoc2NlbmVzLmxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgb25lIG9yIG1vcmUgc2NlbmVzXCIpXG5cbiAgbGV0IGFjdGl2ZVNjZW5lSW5kZXggPSAwXG4gIGxldCBzY2VuZXMgICAgICAgICAgID0gc2NlbmVzXG5cbiAgdGhpcy5zY2VuZXMgICAgICA9IHNjZW5lc1xuICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXhdXG5cbiAgdGhpcy50cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiAoc2NlbmVOYW1lKSB7XG4gICAgbGV0IHNjZW5lID0gZmluZFdoZXJlKFwibmFtZVwiLCBzY2VuZU5hbWUsIHNjZW5lcylcblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihzY2VuZU5hbWUgKyBcIiBpcyBub3QgYSB2YWxpZCBzY2VuZSBuYW1lXCIpXG5cbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lXG4gIH1cblxuICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXggKyAxXVxuXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9yZSBzY2VuZXMhXCIpXG5cbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1cblxuZnVuY3Rpb24gU3lzdGVtIChjb21wb25lbnROYW1lcz1bXSkge1xuICB0aGlzLmNvbXBvbmVudE5hbWVzID0gY29tcG9uZW50TmFtZXNcbn1cblxuLy9zY2VuZS5nYW1lLmNsb2NrXG5TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcbiAgLy9kb2VzIHNvbWV0aGluZyB3LyB0aGUgbGlzdCBvZiBlbnRpdGllcyBwYXNzZWQgdG8gaXRcbn1cbiIsImxldCB7UGFkZGxlLCBCbG9ja30gPSByZXF1aXJlKFwiLi9hc3NlbWJsYWdlc1wiKVxubGV0IFBhZGRsZU1vdmVyU3lzdGVtICAgICAgID0gcmVxdWlyZShcIi4vUGFkZGxlTW92ZXJTeXN0ZW1cIilcbmxldCBSZW5kZXJpbmdTeXN0ZW0gICAgICAgICA9IHJlcXVpcmUoXCIuL1JlbmRlcmluZ1N5c3RlbVwiKVxubGV0IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtID0gcmVxdWlyZShcIi4vS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cIilcbmxldCBTY2VuZSAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVGVzdFNjZW5lXG5cbmZ1bmN0aW9uIFRlc3RTY2VuZSAoKSB7XG4gIGxldCBzeXN0ZW1zID0gW1xuICAgIG5ldyBQYWRkbGVNb3ZlclN5c3RlbSwgXG4gICAgbmV3IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtLFxuICAgIG5ldyBSZW5kZXJpbmdTeXN0ZW1cbiAgXVxuXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXG59XG5cblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcblxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlLCBhdWRpb1N5c3RlbX0gPSB0aGlzLmdhbWUgXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcbiAgbGV0IGFzc2V0cyA9IHtcbiAgICAvL3NvdW5kczogeyBiZ011c2ljOiBcIi9wdWJsaWMvc291bmRzL2JnbTEubXAzXCIgfSxcbiAgICB0ZXh0dXJlczogeyBcbiAgICAgIHBhZGRsZTogXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIsXG4gICAgICBibG9ja3M6IFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvYmxvY2tzLnBuZ1wiXG4gICAgfVxuICB9XG5cbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxuXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBQYWRkbGUodGV4dHVyZXMucGFkZGxlLCAxMTIsIDI1LCA0MDAsIDQwMCkpXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBCbG9jayh0ZXh0dXJlcy5ibG9ja3MsIDQ0LCAyMiwgODAwLCA4MDApKVxuICAgIC8vYmcudm9sdW1lID0gMFxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcbiAgICBjYihudWxsKVxuICB9KVxufVxuIiwibGV0IHtSZW5kZXJhYmxlLCBQaHlzaWNzLCBQbGF5ZXJDb250cm9sbGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcbmxldCB7QW5pbWF0ZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IEFuaW1hdGlvbiA9IHJlcXVpcmUoXCIuL0FuaW1hdGlvblwiKVxubGV0IEVudGl0eSAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVwiKVxuXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgPSBQYWRkbGVcbm1vZHVsZS5leHBvcnRzLkJsb2NrICA9IEJsb2NrXG5cbmZ1bmN0aW9uIFBhZGRsZSAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcbiAgRW50aXR5LmNhbGwodGhpcylcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxuICBQbGF5ZXJDb250cm9sbGVkKHRoaXMpXG59XG5cbmZ1bmN0aW9uIEJsb2NrIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIEFuaW1hdGVkKHRoaXMsIFwiaWRsZVwiLCB7XG4gICAgaWRsZTogbmV3IEFuaW1hdGlvbig0NCwgMjIsIDAsIDAsIDMsIHRydWUsIDEwMDApXG4gIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5SZW5kZXJhYmxlICAgICAgID0gUmVuZGVyYWJsZVxubW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICAgICAgICA9IFBoeXNpY3Ncbm1vZHVsZS5leHBvcnRzLlBsYXllckNvbnRyb2xsZWQgPSBQbGF5ZXJDb250cm9sbGVkXG5tb2R1bGUuZXhwb3J0cy5BbmltYXRlZCAgICAgICAgID0gQW5pbWF0ZWRcblxuZnVuY3Rpb24gUmVuZGVyYWJsZSAoZSwgaW1hZ2UsIHdpZHRoLCBoZWlnaHQpIHtcbiAgZS5yZW5kZXJhYmxlID0ge1xuICAgIGltYWdlLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICByb3RhdGlvbjogMCxcbiAgICBjZW50ZXI6IHtcbiAgICAgIHg6IHdpZHRoIC8gMixcbiAgICAgIHk6IGhlaWdodCAvIDIgXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDEgXG4gICAgfVxuICB9IFxuICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XG4gIGUucGh5c2ljcyA9IHtcbiAgICB3aWR0aCwgXG4gICAgaGVpZ2h0LCBcbiAgICB4LCBcbiAgICB5LCBcbiAgICBkeDogIDAsIFxuICAgIGR5OiAgMCwgXG4gICAgZGR4OiAwLCBcbiAgICBkZHk6IDBcbiAgfVxuICByZXR1cm4gZVxufVxuXG5mdW5jdGlvbiBQbGF5ZXJDb250cm9sbGVkIChlKSB7XG4gIGUucGxheWVyQ29udHJvbGxlZCA9IHRydWVcbn1cblxuZnVuY3Rpb24gQW5pbWF0ZWQgKGUsIGRlZmF1bHRBbmltYXRpb25OYW1lLCBhbmltSGFzaCkge1xuICBlLmFuaW1hdGVkID0ge1xuICAgIGFuaW1hdGlvbnM6ICAgICAgICAgICAgYW5pbUhhc2gsXG4gICAgY3VycmVudEFuaW1hdGlvbk5hbWU6ICBkZWZhdWx0QW5pbWF0aW9uTmFtZSxcbiAgICBjdXJyZW50QW5pbWF0aW9uSW5kZXg6IDAsXG4gICAgY3VycmVudEFuaW1hdGlvbjogICAgICBhbmltSGFzaFtkZWZhdWx0QW5pbWF0aW9uTmFtZV0sXG4gICAgdGltZVRpbGxOZXh0RnJhbWU6ICAgICBhbmltSGFzaFtkZWZhdWx0QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXG4gIH0gXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcblxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XG4gIGxldCBsZW4gICA9IGFycmF5T2ZPYmplY3RzLmxlbmd0aFxuICBsZXQgaSAgICAgPSAtMVxuICBsZXQgZm91bmQgPSBudWxsXG5cbiAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XG4gICAgICBmb3VuZCA9IGFycmF5T2ZPYmplY3RzW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cblxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XG4gIGxldCBpID0gLTFcbiAgXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcbn1cbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbn1cblxubW9kdWxlLmV4cG9ydHMudXBkYXRlQnVmZmVyID0gdXBkYXRlQnVmZmVyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xuICBsZXQgc2hhZGVyICA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKVxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXG4gIFxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuXG4gIGlzVmFsaWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUylcblxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgc3JjKVxuICByZXR1cm4gICAgICAgIHNoYWRlclxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBWZXJ0ZXhTaGFkZXIgLT4gRnJhZ21lbnRTaGFkZXJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcblxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcbiAgbGV0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG5cbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgcmV0dXJuIHRleHR1cmVcbn1cblxubW9kdWxlLmV4cG9ydHMuU2hhZGVyICA9IFNoYWRlclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXG4iLCJsZXQgTG9hZGVyICAgICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXG5sZXQgR0xSZW5kZXJlciAgICAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxubGV0IEVudGl0eVN0b3JlICAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxubGV0IENsb2NrICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0Nsb2NrXCIpXG5sZXQgQ2FjaGUgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcbmxldCBTY2VuZU1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcbmxldCBUZXN0U2NlbmUgICAgICAgPSByZXF1aXJlKFwiLi9UZXN0U2NlbmVcIilcbmxldCBHYW1lICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9HYW1lXCIpXG5sZXQgSW5wdXRNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXG5sZXQgQXVkaW9TeXN0ZW0gICAgID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcbmxldCBjYW52YXMgICAgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG5sZXQgdmVydGV4U3JjICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJ0ZXhcIikudGV4dFxubGV0IGZyYWdTcmMgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJhZ21lbnRcIikudGV4dFxuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcbmxldCBpbnB1dE1hbmFnZXIgICAgPSBuZXcgSW5wdXRNYW5hZ2VyKGtleWJvYXJkTWFuYWdlcilcbmxldCByZW5kZXJlck9wdHMgICAgPSB7IG1heFNwcml0ZUNvdW50OiBNQVhfQ09VTlQgfVxubGV0IGVudGl0eVN0b3JlICAgICA9IG5ldyBFbnRpdHlTdG9yZVxubGV0IGNsb2NrICAgICAgICAgICA9IG5ldyBDbG9jayhEYXRlLm5vdylcbmxldCBjYWNoZSAgICAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXG5sZXQgbG9hZGVyICAgICAgICAgID0gbmV3IExvYWRlclxubGV0IHJlbmRlcmVyICAgICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgdmVydGV4U3JjLCBmcmFnU3JjLCByZW5kZXJlck9wdHMpXG5sZXQgYXVkaW9TeXN0ZW0gICAgID0gbmV3IEF1ZGlvU3lzdGVtKFtcIm1haW5cIiwgXCJiZ1wiXSlcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcbmxldCBnYW1lICAgICAgICAgICAgPSBuZXcgR2FtZShjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgZW50aXR5U3RvcmUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ2FtZSkge1xuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXG4gIGxldCBjbG9jayAgICAgICAgICA9IGdhbWUuY2xvY2tcbiAgbGV0IGlucHV0TWFuYWdlciAgID0gZ2FtZS5pbnB1dE1hbmFnZXJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICBjbG9jay50aWNrKClcbiAgICBpbnB1dE1hbmFnZXIua2V5Ym9hcmRNYW5hZ2VyLnRpY2soY2xvY2suZFQpXG4gICAgZ2FtZS5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmUudXBkYXRlKGNsb2NrLmRUKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICBnYW1lLnJlbmRlcmVyLnJlbmRlcigpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcbiAgfVxufVxuXG53aW5kb3cuZ2FtZSA9IGdhbWVcblxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxuICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB9KVxufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxuICBnYW1lLnN0YXJ0KClcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdhbWUpKVxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXG59KVxuIiwibW9kdWxlLmV4cG9ydHMuY2hlY2tUeXBlICAgICAgPSBjaGVja1R5cGVcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcblxuZnVuY3Rpb24gY2hlY2tUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXG59XG5cbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKGluc3RhbmNlKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxufVxuIl19
