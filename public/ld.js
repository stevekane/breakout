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

Animation.createSingle = function (w, h, x, y, rate) {
  if (rate === undefined) rate = 43;
  var aabb = new AABB(w, h, x, y);
  var frames = [new Frame(aabb, rate)];

  return new Animation(frames, true, rate);
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

var _ref = require("./gl-shaders");

var spriteVertexShader = _ref.spriteVertexShader;
var spriteFragmentShader = _ref.spriteFragmentShader;
var _ref2 = require("./gl-shaders");

var polygonVertexShader = _ref2.polygonVertexShader;
var polygonFragmentShader = _ref2.polygonFragmentShader;
var _ref3 = require("./utils");

var setBox = _ref3.setBox;
var _ref4 = require("./gl-types");

var Shader = _ref4.Shader;
var Program = _ref4.Program;
var Texture = _ref4.Texture;
var _ref5 = require("./gl-buffer");

var updateBuffer = _ref5.updateBuffer;


module.exports = GLRenderer;

var POINT_DIMENSION = 2;
var COLOR_CHANNEL_COUNT = 4;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;
var MAX_VERTEX_COUNT = 1000000;

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

//texture coords are initialized to 0 -> 1 texture coord space
function TextureCoordinatesArray(count) {
  var ar = new Float32Array(count * BOX_LENGTH);

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    setBox(ar, i, 1, 1, 0, 0);
  }
  return ar;
}

function IndexArray(size) {
  return new Uint16Array(size);
}

function VertexArray(size) {
  return new Float32Array(size * POINT_DIMENSION);
}

//4 for r, g, b, a
function VertexColorArray(size) {
  return new Float32Array(size * 4);
}

function SpriteBatch(size) {
  this.count = 0;
  this.boxes = BoxArray(size);
  this.centers = CenterArray(size);
  this.scales = ScaleArray(size);
  this.rotations = RotationArray(size);
  this.texCoords = TextureCoordinatesArray(size);
}

function PolygonBatch(size) {
  this.index = 0;
  this.indices = IndexArray(size);
  this.vertices = VertexArray(size);
  this.vertexColors = VertexColorArray(size);
}

function GLRenderer(canvas, width, height) {
  var _this = this;
  var maxSpriteCount = 100;
  var view = canvas;
  var gl = canvas.getContext("webgl");
  var svs = Shader(gl, gl.VERTEX_SHADER, spriteVertexShader);
  var sfs = Shader(gl, gl.FRAGMENT_SHADER, spriteFragmentShader);
  var pvs = Shader(gl, gl.VERTEX_SHADER, polygonVertexShader);
  var pfs = Shader(gl, gl.FRAGMENT_SHADER, polygonFragmentShader);
  var spriteProgram = Program(gl, svs, sfs);
  var polygonProgram = Program(gl, pvs, pfs);

  //Sprite shader buffers
  var boxBuffer = gl.createBuffer();
  var centerBuffer = gl.createBuffer();
  var scaleBuffer = gl.createBuffer();
  var rotationBuffer = gl.createBuffer();
  var texCoordBuffer = gl.createBuffer();

  //polygon shader buffers
  var vertexBuffer = gl.createBuffer();
  var vertexColorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();

  //GPU buffer locations
  var boxLocation = gl.getAttribLocation(spriteProgram, "a_position");
  var texCoordLocation = gl.getAttribLocation(spriteProgram, "a_texCoord");
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")

  var vertexLocation = gl.getAttribLocation(polygonProgram, "a_vertex");
  var vertexColorLocation = gl.getAttribLocation(polygonProgram, "a_vertexColor");

  //Uniform locations
  var worldSizeSpriteLocation = gl.getUniformLocation(spriteProgram, "u_worldSize");
  var worldSizePolygonLocation = gl.getUniformLocation(polygonProgram, "u_worldSize");

  var imageToTextureMap = new Map();
  var textureToBatchMap = new Map();
  var polygonBatch = new PolygonBatch(MAX_VERTEX_COUNT);

  gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(1, 1, 1, 0);
  gl.colorMask(true, true, true, true);
  gl.activeTexture(gl.TEXTURE0);

  this.dimensions = {
    width: width || 1920,
    height: height || 1080
  };

  this.addBatch = function (texture) {
    textureToBatchMap.set(texture, new SpriteBatch(maxSpriteCount));
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

  this.addPolygon = function (vertices, indices, vertexColors) {
    var vertexCount = indices.length;

    polygonBatch.vertices.set(vertices, polygonBatch.index);
    polygonBatch.indices.set(indices, polygonBatch.index);
    polygonBatch.vertexColors.set(vertexColors, polygonBatch.index);
    polygonBatch.index += vertexCount;
  };

  var resetPolygons = function (batch) {
    return batch.index = 0;
  };

  var drawPolygons = function (batch) {
    updateBuffer(gl, vertexBuffer, vertexLocation, POINT_DIMENSION, batch.vertices);
    updateBuffer(gl, vertexColorBuffer, vertexColorLocation, COLOR_CHANNEL_COUNT, batch.vertexColors);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, batch.index, gl.UNSIGNED_SHORT, 0);
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

  this.flushSprites = function () {
    return textureToBatchMap.forEach(resetBatch);
  };

  this.flushPolygons = function () {
    return resetPolygons(polygonBatch);
  };

  this.render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Spritesheet batch rendering
    gl.useProgram(spriteProgram);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeSpriteLocation, 1920, 1080);
    textureToBatchMap.forEach(drawBatch);

    //polgon rendering
    gl.useProgram(polygonProgram);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizePolygonLocation, 1920, 1080);
    drawPolygons(polygonBatch);
  };
}

},{"./gl-buffer":23,"./gl-shaders":24,"./gl-types":25,"./utils":27}],9:[function(require,module,exports){
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./InputManager":10,"./Loader":13,"./SceneManager":17,"./utils":27}],10:[function(require,module,exports){
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

},{"./KeyboardManager":11,"./utils":27}],11:[function(require,module,exports){
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
  System.call(this, ["sprite"]);
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
    currentIndex = ent.sprite.currentAnimationIndex;
    currentAnim = ent.sprite.currentAnimation;
    currentFrame = currentAnim.frames[currentIndex];
    nextFrame = currentAnim.frames[currentIndex + 1] || currentAnim.frames[0];
    timeLeft = ent.sprite.timeTillNextFrame;
    overshoot = timeLeft - dT;
    shouldAdvance = overshoot <= 0;

    if (shouldAdvance) {
      ent.sprite.currentAnimationIndex = currentAnim.frames.indexOf(nextFrame);
      ent.sprite.timeTillNextFrame = nextFrame.duration + overshoot;
    } else {
      ent.sprite.timeTillNextFrame = overshoot;
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

module.exports = SpriteRenderingSystem;

function SpriteRenderingSystem() {
  System.call(this, ["physics", "sprite"]);
}

SpriteRenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;
  var len = entities.length;
  var i = -1;
  var ent;
  var frame;

  renderer.flushSprites();

  while (++i < len) {
    ent = entities[i];
    frame = ent.sprite.currentAnimation.frames[ent.sprite.currentAnimationIndex];

    renderer.addSprite(ent.sprite.image, ent.physics.width, ent.physics.height, ent.physics.x, ent.physics.y, frame.aabb.w / ent.sprite.image.width, frame.aabb.h / ent.sprite.image.height, frame.aabb.x / ent.sprite.image.width, frame.aabb.y / ent.sprite.image.height);
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

var Physics = _ref.Physics;
var PlayerControlled = _ref.PlayerControlled;
var _ref2 = require("./components");

var Sprite = _ref2.Sprite;
var Animation = require("./Animation");
var Entity = require("./Entity");

module.exports.Paddle = Paddle;
module.exports.Block = Block;
module.exports.Fighter = Fighter;
module.exports.Water = Water;

function Paddle(image, w, h, x, y) {
  Entity.call(this);
  Physics(this, w, h, x, y);
  PlayerControlled(this);
  Sprite(this, w, h, image, "idle", {
    idle: Animation.createSingle(112, 25, 0, 0)
  });
}

function Block(image, w, h, x, y) {
  Entity.call(this);
  Physics(this, w, h, x, y);
  Sprite(this, w, h, image, "idle", {
    idle: Animation.createLinear(44, 22, 0, 0, 3, true, 500)
  });
}

function Fighter(image, w, h, x, y) {
  Entity.call(this);
  Physics(this, w, h, x, y);
  Sprite(this, w, h, image, "fireball", {
    fireball: Animation.createLinear(174, 134, 0, 0, 25, true)
  });
}

function Water(w, h, x, y, topColor, bottomColor) {
  Entity.call(this);
}

},{"./Animation":2,"./Entity":6,"./components":21}],21:[function(require,module,exports){
"use strict";

module.exports.Physics = Physics;
module.exports.PlayerControlled = PlayerControlled;
module.exports.Sprite = Sprite;
module.exports.Polygon = Polygon;

function Sprite(e, width, height, image, currentAnimationName, animations) {
  e.sprite = {
    width: width,
    height: height,
    image: image,
    animations: animations,
    currentAnimationName: currentAnimationName,
    currentAnimationIndex: 0,
    currentAnimation: animations[currentAnimationName],
    timeTillNextFrame: animations[currentAnimationName].frames[0].duration
  };
}

function Polygon(e, polygon) {
  e.polygon = polygon;
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

module.exports.spriteVertexShader = "   precision highp float;     attribute vec2 a_position;   attribute vec2 a_texCoord;     uniform vec2 u_worldSize;     varying vec2 v_texCoord;     vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }     void main() {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_position / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_texCoord  = a_texCoord;     gl_Position = vec4(position, 0, 1);   }";

module.exports.spriteFragmentShader = "  precision highp float;     uniform sampler2D u_image;     varying vec2 v_texCoord;     void main() {     gl_FragColor = texture2D(u_image, v_texCoord);   }";

module.exports.polygonVertexShader = "  attribute vec2 a_vertex;   attribute vec4 a_vertexColor;   uniform vec2 u_worldSize;   varying vec4 v_vertexColor;   vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }   void main () {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_vertex / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_vertexColor = a_vertexColor;     gl_Position   = vec4(position, 0, 1);   }";

module.exports.polygonFragmentShader = "  precision highp float;     varying vec4 v_vertexColor;     void main() {     gl_FragColor = v_vertexColor;   }";

},{}],25:[function(require,module,exports){
"use strict";

//:: => GLContext -> ENUM (VERTEX || FRAGMENT) -> String (Code)
function Shader(gl, type, src) {
  var shader = gl.createShader(type);
  var isValid = false;

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!isValid) throw new Error("Not valid shader: \n" + gl.getShaderInfoLog(shader));
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

},{}],26:[function(require,module,exports){
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

var UPDATE_INTERVAL = 25;
var MAX_COUNT = 1000;

var keyboardManager = new KeyboardManager(document);
var inputManager = new InputManager(keyboardManager);
var entityStore = new EntityStore();
var clock = new Clock(Date.now);
var cache = new Cache(["sounds", "textures"]);
var loader = new Loader();
var renderer = new GLRenderer(canvas, 1920, 1080);
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./Game":9,"./InputManager":10,"./KeyboardManager":11,"./Loader":13,"./SceneManager":17,"./TestScene":19}],27:[function(require,module,exports){
"use strict";

module.exports.checkType = checkType;
module.exports.checkValueType = checkValueType;
module.exports.setBox = setBox;

var POINT_DIMENSION = 2;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;

function checkType(instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name);
}

function checkValueType(instance, ctor) {
  var keys = Object.keys(instance);

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor);
}

function setBox(boxArray, index, w, h, x, y) {
  var i = BOX_LENGTH * index;
  var x1 = x;
  var y1 = y;
  var x2 = x + w;
  var y2 = y + h;

  boxArray[i] = x1;
  boxArray[i + 1] = y1;
  boxArray[i + 2] = x1;
  boxArray[i + 3] = y2;
  boxArray[i + 4] = x2;
  boxArray[i + 5] = y1;

  boxArray[i + 6] = x1;
  boxArray[i + 7] = y2;
  boxArray[i + 8] = x2;
  boxArray[i + 9] = y2;
  boxArray[i + 10] = x2;
  boxArray[i + 11] = y1;
}

},{}]},{},[26])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtc2hhZGVycy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtB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TSxDQUFBO0FBQ2hFLFFBQUksV0FBVyxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUE7QUFDaEMsUUFBSSxRQUFRLEdBQU0sS0FBSyxJQUFJLFdBQVcsQ0FBQTtBQUN0QyxRQUFJLFFBQVEsR0FBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFBO0FBQ3JELFFBQUksU0FBUyxHQUFLLFFBQVEsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUE7O0FBRXJELFVBQU0sQ0FBQyxLQUFLLEdBQUksUUFBUSxDQUFBO0FBQ3hCLFVBQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFBO0FBQ3pCLE1BQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUE7R0FDdkMsQ0FBQTs7QUFFRCxNQUFJLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUs7QUFDOUQsUUFBSSxFQUFFLEdBQU0saUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQUssVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2xFLFFBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxNQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTs7QUFFMUQsVUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUM1QyxVQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQzVELFNBQUssQ0FB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LENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTs7QUFFbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDcEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBBQUJCICh3LCBoLCB4LCB5KSB7XHJcbiAgdGhpcy54ID0geFxyXG4gIHRoaXMueSA9IHlcclxuICB0aGlzLncgPSB3XHJcbiAgdGhpcy5oID0gaFxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHhcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geCB9IFxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx5XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHkgfSBcclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeFwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB4ICsgdyB9XHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnlcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geSArIGggfVxyXG4gIH0pXHJcbn1cclxuIiwibGV0IEFBQkIgPSByZXF1aXJlKFwiLi9BQUJCXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGlvblxyXG5cclxuZnVuY3Rpb24gRnJhbWUgKGFhYmIsIGR1cmF0aW9uKSB7XHJcbiAgdGhpcy5hYWJiICAgICA9IGFhYmJcclxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cclxufVxyXG5cclxuLy9yYXRlIGlzIGluIG1zLiAgVGhpcyBpcyB0aGUgdGltZSBwZXIgZnJhbWUgKDQyIH4gMjRmcHMpXHJcbmZ1bmN0aW9uIEFuaW1hdGlvbiAoZnJhbWVzLCBkb2VzTG9vcCwgcmF0ZT00Mikge1xyXG4gIHRoaXMubG9vcCAgID0gZG9lc0xvb3BcclxuICB0aGlzLnJhdGUgICA9IHJhdGVcclxuICB0aGlzLmZyYW1lcyA9IGZyYW1lc1xyXG59XHJcblxyXG5BbmltYXRpb24uY3JlYXRlTGluZWFyID0gZnVuY3Rpb24gKHcsIGgsIHgsIHksIGNvdW50LCBkb2VzTG9vcCwgcmF0ZT00Mikge1xyXG4gIGxldCBmcmFtZXMgPSBbXVxyXG4gIGxldCBpICAgICAgPSAtMVxyXG4gIGxldCBlYWNoWFxyXG4gIGxldCBhYWJiXHJcblxyXG4gIHdoaWxlICgrK2kgPCBjb3VudCkge1xyXG4gICAgZWFjaFggPSB4ICsgaSAqIHdcclxuICAgIGFhYmIgID0gbmV3IEFBQkIodywgaCwgZWFjaFgsIHkpXHJcbiAgICBmcmFtZXMucHVzaChuZXcgRnJhbWUoYWFiYiwgcmF0ZSkpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IEFuaW1hdGlvbihmcmFtZXMsIGRvZXNMb29wLCByYXRlKVxyXG59XHJcblxyXG5BbmltYXRpb24uY3JlYXRlU2luZ2xlID0gZnVuY3Rpb24gKHcsIGgsIHgsIHksIHJhdGU9NDMpIHtcclxuICBsZXQgYWFiYiAgID0gbmV3IEFBQkIodywgaCwgeCwgeSlcclxuICBsZXQgZnJhbWVzID0gW25ldyBGcmFtZShhYWJiLCByYXRlKV1cclxuXHJcbiAgcmV0dXJuIG5ldyBBbmltYXRpb24oZnJhbWVzLCB0cnVlLCByYXRlKVxyXG59XHJcbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcclxuICBsZXQgY2hhbm5lbCA9IGNvbnRleHQuY3JlYXRlR2FpbigpXHJcbiAgXHJcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcclxuICAgIHNyYy5jb25uZWN0KHBhbm5lcilcclxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxyXG4gIH1cclxuXHJcbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcclxuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xyXG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxyXG5cclxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcclxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcclxuXHJcbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXHJcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcclxuICAgICAgc3JjLnN0YXJ0KDApXHJcbiAgICAgIHJldHVybiBzcmNcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsLmdhaW4udmFsdWUgfSxcclxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XHJcbiAgfSlcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbCB9XHJcbiAgfSlcclxuXHJcbiAgdGhpcy5uYW1lID0gbmFtZVxyXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcclxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcclxuICBsZXQgY29udGV4dCAgPSBuZXcgQXVkaW9Db250ZXh0XHJcbiAgbGV0IGNoYW5uZWxzID0ge31cclxuICBsZXQgaSAgICAgICAgPSAtMVxyXG5cclxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcclxuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXHJcbiAgfVxyXG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxyXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FjaGUgKGtleU5hbWVzKSB7XHJcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBDbG9ja1xyXG5cclxuZnVuY3Rpb24gQ2xvY2sgKHRpbWVGbj1EYXRlLm5vdykge1xyXG4gIHRoaXMub2xkVGltZSA9IHRpbWVGbigpXHJcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcclxuICB0aGlzLmRUID0gMFxyXG4gIHRoaXMudGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxyXG4gICAgdGhpcy5uZXdUaW1lID0gdGltZUZuKCkgIFxyXG4gICAgdGhpcy5kVCAgICAgID0gdGhpcy5uZXdUaW1lIC0gdGhpcy5vbGRUaW1lXHJcbiAgfVxyXG59XHJcbiIsIi8vdGhpcyBkb2VzIGxpdGVyYWxseSBub3RoaW5nLiAgaXQncyBhIHNoZWxsIHRoYXQgaG9sZHMgY29tcG9uZW50c1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxyXG4iLCJsZXQge2hhc0tleXN9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXHJcblxyXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAobWF4PTEwMDApIHtcclxuICB0aGlzLmVudGl0aWVzICA9IFtdXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGUpIHtcclxuICBsZXQgaWQgPSB0aGlzLmVudGl0aWVzLmxlbmd0aFxyXG5cclxuICB0aGlzLmVudGl0aWVzLnB1c2goZSlcclxuICByZXR1cm4gaWRcclxufVxyXG5cclxuRW50aXR5U3RvcmUucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKGNvbXBvbmVudE5hbWVzKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIGxldCBlbnRpdHlcclxuXHJcbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxyXG5cclxuICB3aGlsZSAodGhpcy5lbnRpdGllc1srK2ldKSB7XHJcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXHJcbiAgICBpZiAoaGFzS2V5cyhjb21wb25lbnROYW1lcywgZW50aXR5KSkgdGhpcy5sYXN0UXVlcnkucHVzaChlbnRpdHkpXHJcbiAgfVxyXG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxyXG59XHJcbiIsImxldCB7c3ByaXRlVmVydGV4U2hhZGVyLCBzcHJpdGVGcmFnbWVudFNoYWRlcn0gPSByZXF1aXJlKFwiLi9nbC1zaGFkZXJzXCIpXHJcbmxldCB7cG9seWdvblZlcnRleFNoYWRlciwgcG9seWdvbkZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcclxubGV0IHtzZXRCb3h9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IHtTaGFkZXIsIFByb2dyYW0sIFRleHR1cmV9ID0gcmVxdWlyZShcIi4vZ2wtdHlwZXNcIilcclxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdMUmVuZGVyZXJcclxuXHJcbmNvbnN0IFBPSU5UX0RJTUVOU0lPTiAgICAgPSAyXHJcbmNvbnN0IENPTE9SX0NIQU5ORUxfQ09VTlQgPSA0XHJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICAgICAgPSA2XHJcbmNvbnN0IEJPWF9MRU5HVEggICAgICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxyXG5jb25zdCBNQVhfVkVSVEVYX0NPVU5UICAgID0gMTAwMDAwMFxyXG5cclxuZnVuY3Rpb24gQm94QXJyYXkgKGNvdW50KSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxyXG59XHJcblxyXG5mdW5jdGlvbiBDZW50ZXJBcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNjYWxlQXJyYXkgKGNvdW50KSB7XHJcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47ICsraSkgYXJbaV0gPSAxXHJcbiAgcmV0dXJuIGFyXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJvdGF0aW9uQXJyYXkgKGNvdW50KSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBQT0lOVFNfUEVSX0JPWClcclxufVxyXG5cclxuLy90ZXh0dXJlIGNvb3JkcyBhcmUgaW5pdGlhbGl6ZWQgdG8gMCAtPiAxIHRleHR1cmUgY29vcmQgc3BhY2VcclxuZnVuY3Rpb24gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkgKGNvdW50KSB7XHJcbiAgbGV0IGFyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpICBcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgaSArPSBCT1hfTEVOR1RIKSB7XHJcbiAgICBzZXRCb3goYXIsIGksIDEsIDEsIDAsIDApXHJcbiAgfSBcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gSW5kZXhBcnJheSAoc2l6ZSkge1xyXG4gIHJldHVybiBuZXcgVWludDE2QXJyYXkoc2l6ZSlcclxufVxyXG5cclxuZnVuY3Rpb24gVmVydGV4QXJyYXkgKHNpemUpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShzaXplICogUE9JTlRfRElNRU5TSU9OKVxyXG59XHJcblxyXG4vLzQgZm9yIHIsIGcsIGIsIGFcclxuZnVuY3Rpb24gVmVydGV4Q29sb3JBcnJheSAoc2l6ZSkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiA0KVxyXG59XHJcblxyXG5mdW5jdGlvbiBTcHJpdGVCYXRjaCAoc2l6ZSkge1xyXG4gIHRoaXMuY291bnQgICAgICA9IDBcclxuICB0aGlzLmJveGVzICAgICAgPSBCb3hBcnJheShzaXplKVxyXG4gIHRoaXMuY2VudGVycyAgICA9IENlbnRlckFycmF5KHNpemUpXHJcbiAgdGhpcy5zY2FsZXMgICAgID0gU2NhbGVBcnJheShzaXplKVxyXG4gIHRoaXMucm90YXRpb25zICA9IFJvdGF0aW9uQXJyYXkoc2l6ZSlcclxuICB0aGlzLnRleENvb3JkcyAgPSBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheShzaXplKVxyXG59XHJcblxyXG5mdW5jdGlvbiBQb2x5Z29uQmF0Y2ggKHNpemUpIHtcclxuICB0aGlzLmluZGV4ICAgICAgICA9IDBcclxuICB0aGlzLmluZGljZXMgICAgICA9IEluZGV4QXJyYXkoc2l6ZSlcclxuICB0aGlzLnZlcnRpY2VzICAgICA9IFZlcnRleEFycmF5KHNpemUpXHJcbiAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSBWZXJ0ZXhDb2xvckFycmF5KHNpemUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdMUmVuZGVyZXIgKGNhbnZhcywgd2lkdGgsIGhlaWdodCkge1xyXG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IDEwMFxyXG4gIGxldCB2aWV3ICAgICAgICAgICA9IGNhbnZhc1xyXG4gIGxldCBnbCAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgICAgICBcclxuICBsZXQgc3ZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHNwcml0ZVZlcnRleFNoYWRlcilcclxuICBsZXQgc2ZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgc3ByaXRlRnJhZ21lbnRTaGFkZXIpXHJcbiAgbGV0IHB2cyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCBwb2x5Z29uVmVydGV4U2hhZGVyKVxyXG4gIGxldCBwZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBwb2x5Z29uRnJhZ21lbnRTaGFkZXIpXHJcbiAgbGV0IHNwcml0ZVByb2dyYW0gID0gUHJvZ3JhbShnbCwgc3ZzLCBzZnMpXHJcbiAgbGV0IHBvbHlnb25Qcm9ncmFtID0gUHJvZ3JhbShnbCwgcHZzLCBwZnMpXHJcblxyXG4gIC8vU3ByaXRlIHNoYWRlciBidWZmZXJzXHJcbiAgbGV0IGJveEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgY2VudGVyQnVmZmVyICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBzY2FsZUJ1ZmZlciAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHJvdGF0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgdGV4Q29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG5cclxuICAvL3BvbHlnb24gc2hhZGVyIGJ1ZmZlcnNcclxuICBsZXQgdmVydGV4QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCB2ZXJ0ZXhDb2xvckJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IGluZGV4QnVmZmVyICAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuXHJcbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xyXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXHJcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcclxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxyXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcclxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXHJcblxyXG4gIGxldCB2ZXJ0ZXhMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwiYV92ZXJ0ZXhcIilcclxuICBsZXQgdmVydGV4Q29sb3JMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcImFfdmVydGV4Q29sb3JcIilcclxuXHJcbiAgLy9Vbmlmb3JtIGxvY2F0aW9uc1xyXG4gIGxldCB3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiAgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxyXG4gIGxldCB3b3JsZFNpemVQb2x5Z29uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwidV93b3JsZFNpemVcIilcclxuXHJcbiAgbGV0IGltYWdlVG9UZXh0dXJlTWFwID0gbmV3IE1hcCgpXHJcbiAgbGV0IHRleHR1cmVUb0JhdGNoTWFwID0gbmV3IE1hcCgpXHJcbiAgbGV0IHBvbHlnb25CYXRjaCAgICAgID0gbmV3IFBvbHlnb25CYXRjaChNQVhfVkVSVEVYX0NPVU5UKVxyXG5cclxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXHJcbiAgZ2wuZW5hYmxlKGdsLkNVTExfRkFDRSlcclxuICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKVxyXG4gIGdsLmNsZWFyQ29sb3IoMS4wLCAxLjAsIDEuMCwgMC4wKVxyXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxyXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXHJcblxyXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcclxuICAgIHdpZHRoOiAgd2lkdGggfHwgMTkyMCwgXHJcbiAgICBoZWlnaHQ6IGhlaWdodCB8fCAxMDgwXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZEJhdGNoID0gKHRleHR1cmUpID0+IHtcclxuICAgIHRleHR1cmVUb0JhdGNoTWFwLnNldCh0ZXh0dXJlLCBuZXcgU3ByaXRlQmF0Y2gobWF4U3ByaXRlQ291bnQpKVxyXG4gICAgcmV0dXJuIHRleHR1cmVUb0JhdGNoTWFwLmdldCh0ZXh0dXJlKVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRUZXh0dXJlID0gKGltYWdlKSA9PiB7XHJcbiAgICBsZXQgdGV4dHVyZSA9IFRleHR1cmUoZ2wpXHJcblxyXG4gICAgaW1hZ2VUb1RleHR1cmVNYXAuc2V0KGltYWdlLCB0ZXh0dXJlKVxyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpXHJcbiAgICByZXR1cm4gdGV4dHVyZVxyXG4gIH1cclxuXHJcbiAgdGhpcy5yZXNpemUgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xyXG4gICAgbGV0IHJhdGlvICAgICAgID0gdGhpcy5kaW1lbnNpb25zLndpZHRoIC8gdGhpcy5kaW1lbnNpb25zLmhlaWdodFxyXG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcclxuICAgIGxldCB1c2VXaWR0aCAgICA9IHJhdGlvID49IHRhcmdldFJhdGlvXHJcbiAgICBsZXQgbmV3V2lkdGggICAgPSB1c2VXaWR0aCA/IHdpZHRoIDogKGhlaWdodCAqIHJhdGlvKSBcclxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XHJcblxyXG4gICAgY2FudmFzLndpZHRoICA9IG5ld1dpZHRoIFxyXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcclxuICAgIGdsLnZpZXdwb3J0KDAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHQpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFNwcml0ZSA9IChpbWFnZSwgdywgaCwgeCwgeSwgdGV4dywgdGV4aCwgdGV4eCwgdGV4eSkgPT4ge1xyXG4gICAgbGV0IHR4ICAgID0gaW1hZ2VUb1RleHR1cmVNYXAuZ2V0KGltYWdlKSB8fCB0aGlzLmFkZFRleHR1cmUoaW1hZ2UpXHJcbiAgICBsZXQgYmF0Y2ggPSB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodHgpIHx8IHRoaXMuYWRkQmF0Y2godHgpXHJcblxyXG4gICAgc2V0Qm94KGJhdGNoLmJveGVzLCBiYXRjaC5jb3VudCwgdywgaCwgeCwgeSlcclxuICAgIHNldEJveChiYXRjaC50ZXhDb29yZHMsIGJhdGNoLmNvdW50LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KVxyXG4gICAgYmF0Y2guY291bnQrK1xyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRQb2x5Z29uID0gKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpID0+IHtcclxuICAgIGxldCB2ZXJ0ZXhDb3VudCA9IGluZGljZXMubGVuZ3RoXHJcblxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRpY2VzLnNldCh2ZXJ0aWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLmluZGljZXMuc2V0KGluZGljZXMsIHBvbHlnb25CYXRjaC5pbmRleClcclxuICAgIHBvbHlnb25CYXRjaC52ZXJ0ZXhDb2xvcnMuc2V0KHZlcnRleENvbG9ycywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLmluZGV4ICs9IHZlcnRleENvdW50XHJcbiAgfVxyXG5cclxuICBsZXQgcmVzZXRQb2x5Z29ucyA9IChiYXRjaCkgPT4gYmF0Y2guaW5kZXggPSAwXHJcblxyXG4gIGxldCBkcmF3UG9seWdvbnMgPSAoYmF0Y2gpID0+IHtcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgXHJcbiAgICAgIHZlcnRleEJ1ZmZlciwgXHJcbiAgICAgIHZlcnRleExvY2F0aW9uLCBcclxuICAgICAgUE9JTlRfRElNRU5TSU9OLCBcclxuICAgICAgYmF0Y2gudmVydGljZXMpXHJcbiAgICB1cGRhdGVCdWZmZXIoXHJcbiAgICAgIGdsLCBcclxuICAgICAgdmVydGV4Q29sb3JCdWZmZXIsIFxyXG4gICAgICB2ZXJ0ZXhDb2xvckxvY2F0aW9uLCBcclxuICAgICAgQ09MT1JfQ0hBTk5FTF9DT1VOVCwgXHJcbiAgICAgIGJhdGNoLnZlcnRleENvbG9ycylcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGV4QnVmZmVyKVxyXG4gICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYmF0Y2guaW5kaWNlcywgZ2wuRFlOQU1JQ19EUkFXKVxyXG4gICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFUywgYmF0Y2guaW5kZXgsIGdsLlVOU0lHTkVEX1NIT1JULCAwKVxyXG4gICAgLy9nbC5kcmF3RWxlbWVudHMoZ2wuTElORVMsIGJhdGNoLmluZGV4LCBnbC5VTlNJR05FRF9TSE9SVCwgMClcclxuICB9XHJcblxyXG4gIGxldCByZXNldEJhdGNoID0gKGJhdGNoKSA9PiBiYXRjaC5jb3VudCA9IDBcclxuXHJcbiAgbGV0IGRyYXdCYXRjaCA9IChiYXRjaCwgdGV4dHVyZSkgPT4ge1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgYm94QnVmZmVyLCBib3hMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC5ib3hlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHJvdGF0aW9uQnVmZmVyLCByb3RMb2NhdGlvbiwgMSwgcm90YXRpb25zKVxyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC50ZXhDb29yZHMpXHJcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYmF0Y2guY291bnQgKiBQT0lOVFNfUEVSX0JPWClcclxuICB9XHJcblxyXG4gIHRoaXMuZmx1c2hTcHJpdGVzID0gKCkgPT4gdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChyZXNldEJhdGNoKVxyXG5cclxuICB0aGlzLmZsdXNoUG9seWdvbnMgPSAoKSA9PiByZXNldFBvbHlnb25zKHBvbHlnb25CYXRjaClcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSAoKSA9PiB7XHJcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxyXG5cclxuICAgIC8vU3ByaXRlc2hlZXQgYmF0Y2ggcmVuZGVyaW5nXHJcbiAgICBnbC51c2VQcm9ncmFtKHNwcml0ZVByb2dyYW0pXHJcbiAgICAvL1RPRE86IGhhcmRjb2RlZCBmb3IgdGhlIG1vbWVudCBmb3IgdGVzdGluZ1xyXG4gICAgZ2wudW5pZm9ybTJmKHdvcmxkU2l6ZVNwcml0ZUxvY2F0aW9uLCAxOTIwLCAxMDgwKVxyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChkcmF3QmF0Y2gpXHJcblxyXG4gICAgLy9wb2xnb24gcmVuZGVyaW5nXHJcbiAgICBnbC51c2VQcm9ncmFtKHBvbHlnb25Qcm9ncmFtKVxyXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcclxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVQb2x5Z29uTG9jYXRpb24sIDE5MjAsIDEwODApXHJcbiAgICBkcmF3UG9seWdvbnMocG9seWdvbkJhdGNoKVxyXG4gIH1cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgSW5wdXRNYW5hZ2VyID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXHJcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxyXG5sZXQgTG9hZGVyICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXHJcbmxldCBHTFJlbmRlcmVyICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXHJcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxyXG5sZXQgQ2FjaGUgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IEVudGl0eVN0b3JlICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxyXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVcclxuXHJcbi8vOjogQ2xvY2sgLT4gQ2FjaGUgLT4gTG9hZGVyIC0+IEdMUmVuZGVyZXIgLT4gQXVkaW9TeXN0ZW0gLT4gRW50aXR5U3RvcmUgLT4gU2NlbmVNYW5hZ2VyXHJcbmZ1bmN0aW9uIEdhbWUgKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgXHJcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcclxuICBjaGVja1R5cGUoY2xvY2ssIENsb2NrKVxyXG4gIGNoZWNrVHlwZShjYWNoZSwgQ2FjaGUpXHJcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxyXG4gIGNoZWNrVHlwZShsb2FkZXIsIExvYWRlcilcclxuICBjaGVja1R5cGUocmVuZGVyZXIsIEdMUmVuZGVyZXIpXHJcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcclxuICBjaGVja1R5cGUoZW50aXR5U3RvcmUsIEVudGl0eVN0b3JlKVxyXG4gIGNoZWNrVHlwZShzY2VuZU1hbmFnZXIsIFNjZW5lTWFuYWdlcilcclxuXHJcbiAgdGhpcy5jbG9jayAgICAgICAgPSBjbG9ja1xyXG4gIHRoaXMuY2FjaGUgICAgICAgID0gY2FjaGUgXHJcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcclxuICB0aGlzLmlucHV0TWFuYWdlciA9IGlucHV0TWFuYWdlclxyXG4gIHRoaXMucmVuZGVyZXIgICAgID0gcmVuZGVyZXJcclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXHJcbiAgdGhpcy5lbnRpdHlTdG9yZSAgPSBlbnRpdHlTdG9yZVxyXG4gIHRoaXMuc2NlbmVNYW5hZ2VyID0gc2NlbmVNYW5hZ2VyXHJcblxyXG4gIC8vSW50cm9kdWNlIGJpLWRpcmVjdGlvbmFsIHJlZmVyZW5jZSB0byBnYW1lIG9iamVjdCBvbnRvIGVhY2ggc2NlbmVcclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcclxuICB9XHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gIGxldCBzdGFydFNjZW5lID0gdGhpcy5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmVcclxuXHJcbiAgY29uc29sZS5sb2coXCJjYWxsaW5nIHNldHVwIGZvciBcIiArIHN0YXJ0U2NlbmUubmFtZSlcclxuICBzdGFydFNjZW5lLnNldHVwKChlcnIpID0+IGNvbnNvbGUubG9nKFwic2V0dXAgY29tcGxldGVkXCIpKVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xyXG59XHJcbiIsImxldCB7Y2hlY2tUeXBlfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXHJcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW5wdXRNYW5hZ2VyXHJcblxyXG4vL1RPRE86IGNvdWxkIHRha2UgbW91c2VNYW5hZ2VyIGFuZCBnYW1lcGFkIG1hbmFnZXI/XHJcbmZ1bmN0aW9uIElucHV0TWFuYWdlciAoa2V5Ym9hcmRNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxyXG4gIHRoaXMua2V5Ym9hcmRNYW5hZ2VyID0ga2V5Ym9hcmRNYW5hZ2VyIFxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXHJcblxyXG5jb25zdCBLRVlfQ09VTlQgPSAyNTZcclxuXHJcbmZ1bmN0aW9uIEtleWJvYXJkTWFuYWdlciAoZG9jdW1lbnQpIHtcclxuICBsZXQgaXNEb3ducyAgICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQganVzdFVwcyAgICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcclxuICBsZXQgZG93bkR1cmF0aW9ucyA9IG5ldyBVaW50MzJBcnJheShLRVlfQ09VTlQpXHJcbiAgXHJcbiAgbGV0IGhhbmRsZUtleURvd24gPSAoe2tleUNvZGV9KSA9PiB7XHJcbiAgICBqdXN0RG93bnNba2V5Q29kZV0gPSAhaXNEb3duc1trZXlDb2RlXVxyXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdFVwc1trZXlDb2RlXSAgID0gdHJ1ZVxyXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gZmFsc2VcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVCbHVyID0gKCkgPT4ge1xyXG4gICAgbGV0IGkgPSAtMVxyXG5cclxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcclxuICAgICAgaXNEb3duc1tpXSAgID0gMFxyXG4gICAgICBqdXN0RG93bnNbaV0gPSAwXHJcbiAgICAgIGp1c3RVcHNbaV0gICA9IDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcclxuICB0aGlzLmp1c3RVcHMgICAgICAgPSBqdXN0VXBzXHJcbiAgdGhpcy5qdXN0RG93bnMgICAgID0ganVzdERvd25zXHJcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xyXG5cclxuICB0aGlzLnRpY2sgPSAoZFQpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSBmYWxzZVxyXG4gICAgICBpZiAoaXNEb3duc1tpXSkgZG93bkR1cmF0aW9uc1tpXSArPSBkVFxyXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGhhbmRsZUtleURvd24pXHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGhhbmRsZUtleVVwKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXHJcbn1cclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbVxyXG5cclxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xyXG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInNwcml0ZVwiXSlcclxufVxyXG5cclxuS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQgZFQgID0gc2NlbmUuZ2FtZS5jbG9jay5kVFxyXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcclxuICBsZXQgaSAgID0gLTFcclxuICBsZXQgZW50XHJcbiAgbGV0IHRpbWVMZWZ0XHJcbiAgbGV0IGN1cnJlbnRJbmRleFxyXG4gIGxldCBjdXJyZW50QW5pbVxyXG4gIGxldCBjdXJyZW50RnJhbWVcclxuICBsZXQgbmV4dEZyYW1lXHJcbiAgbGV0IG92ZXJzaG9vdFxyXG4gIGxldCBzaG91bGRBZHZhbmNlXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcclxuICAgIGN1cnJlbnRJbmRleCAgPSBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb25JbmRleFxyXG4gICAgY3VycmVudEFuaW0gICA9IGVudC5zcHJpdGUuY3VycmVudEFuaW1hdGlvblxyXG4gICAgY3VycmVudEZyYW1lICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXhdXHJcbiAgICBuZXh0RnJhbWUgICAgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleCArIDFdIHx8IGN1cnJlbnRBbmltLmZyYW1lc1swXVxyXG4gICAgdGltZUxlZnQgICAgICA9IGVudC5zcHJpdGUudGltZVRpbGxOZXh0RnJhbWVcclxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXHJcbiAgICBzaG91bGRBZHZhbmNlID0gb3ZlcnNob290IDw9IDBcclxuICAgICAgXHJcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xyXG4gICAgICBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcclxuICAgICAgZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZSAgICAgPSBuZXh0RnJhbWUuZHVyYXRpb24gKyBvdmVyc2hvb3QgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlbnQuc3ByaXRlLnRpbWVUaWxsTmV4dEZyYW1lID0gb3ZlcnNob290IFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJmdW5jdGlvbiBMb2FkZXIgKCkge1xyXG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcclxuXHJcbiAgbGV0IGxvYWRYSFIgPSAodHlwZSkgPT4ge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xyXG4gICAgICBpZiAoIXBhdGgpIHJldHVybiBjYihuZXcgRXJyb3IoXCJObyBwYXRoIHByb3ZpZGVkXCIpKVxyXG5cclxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcclxuXHJcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSB0eXBlXHJcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXHJcbiAgICAgIHhoci5vbmVycm9yICAgICAgPSAoKSA9PiBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKVxyXG4gICAgICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxyXG4gICAgICB4aHIuc2VuZChudWxsKVxyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGxldCBsb2FkQnVmZmVyID0gbG9hZFhIUihcImFycmF5YnVmZmVyXCIpXHJcbiAgbGV0IGxvYWRTdHJpbmcgPSBsb2FkWEhSKFwic3RyaW5nXCIpXHJcblxyXG4gIHRoaXMubG9hZFNoYWRlciA9IGxvYWRTdHJpbmdcclxuXHJcbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xyXG4gICAgbGV0IGkgICAgICAgPSBuZXcgSW1hZ2VcclxuICAgIGxldCBvbmxvYWQgID0gKCkgPT4gY2IobnVsbCwgaSlcclxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgIFxyXG4gICAgaS5vbmxvYWQgID0gb25sb2FkXHJcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXHJcbiAgICBpLnNyYyAgICAgPSBwYXRoXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRTb3VuZCA9IChwYXRoLCBjYikgPT4ge1xyXG4gICAgbG9hZEJ1ZmZlcihwYXRoLCAoZXJyLCBiaW5hcnkpID0+IHtcclxuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXHJcbiAgICAgIGxldCBkZWNvZGVGYWlsdXJlID0gY2JcclxuXHJcbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXHJcbiAgICB9KSBcclxuICB9XHJcblxyXG4gIHRoaXMubG9hZEFzc2V0cyA9ICh7c291bmRzLCB0ZXh0dXJlcywgc2hhZGVyc30sIGNiKSA9PiB7XHJcbiAgICBsZXQgc291bmRLZXlzICAgID0gT2JqZWN0LmtleXMoc291bmRzIHx8IHt9KVxyXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxyXG4gICAgbGV0IHNoYWRlcktleXMgICA9IE9iamVjdC5rZXlzKHNoYWRlcnMgfHwge30pXHJcbiAgICBsZXQgc291bmRDb3VudCAgID0gc291bmRLZXlzLmxlbmd0aFxyXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxyXG4gICAgbGV0IHNoYWRlckNvdW50ICA9IHNoYWRlcktleXMubGVuZ3RoXHJcbiAgICBsZXQgaSAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IGsgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgb3V0ICAgICAgICAgID0ge1xyXG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcclxuICAgICAgaWYgKHNvdW5kQ291bnQgPD0gMCAmJiB0ZXh0dXJlQ291bnQgPD0gMCAmJiBzaGFkZXJDb3VudCA8PSAwKSBjYihudWxsLCBvdXQpIFxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclNvdW5kID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc291bmRDb3VudC0tXHJcbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyVGV4dHVyZSA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHRleHR1cmVDb3VudC0tXHJcbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTaGFkZXIgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICBzaGFkZXJDb3VudC0tXHJcbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlIChzb3VuZEtleXNbKytpXSkge1xyXG4gICAgICBsZXQga2V5ID0gc291bmRLZXlzW2ldXHJcblxyXG4gICAgICB0aGlzLmxvYWRTb3VuZChzb3VuZHNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyU291bmQoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgd2hpbGUgKHRleHR1cmVLZXlzWysral0pIHtcclxuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXHJcblxyXG4gICAgICB0aGlzLmxvYWRUZXh0dXJlKHRleHR1cmVzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xyXG4gICAgICBsZXQga2V5ID0gc2hhZGVyS2V5c1trXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyU2hhZGVyKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9hZGVyXHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFkZGxlTW92ZXJTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCIsIFwicGxheWVyQ29udHJvbGxlZFwiXSlcclxufVxyXG5cclxuUGFkZGxlTW92ZXJTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQge2Nsb2NrLCBpbnB1dE1hbmFnZXJ9ID0gc2NlbmUuZ2FtZVxyXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxyXG4gIGxldCBtb3ZlU3BlZWQgPSAxXHJcbiAgbGV0IHBhZGRsZSAgICA9IGVudGl0aWVzWzBdXHJcblxyXG4gIC8vY2FuIGhhcHBlbiBkdXJpbmcgbG9hZGluZyBmb3IgZXhhbXBsZVxyXG4gIGlmICghcGFkZGxlKSByZXR1cm5cclxuXHJcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM3XSkgcGFkZGxlLnBoeXNpY3MueCAtPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szOV0pIHBhZGRsZS5waHlzaWNzLnggKz0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxufVxyXG4iLCJsZXQgU3lzdGVtICA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcHJpdGVSZW5kZXJpbmdTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFNwcml0ZVJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInNwcml0ZVwiXSlcclxufVxyXG5cclxuU3ByaXRlUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtyZW5kZXJlcn0gPSBzY2VuZS5nYW1lXHJcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxyXG4gIGxldCBpICAgPSAtMVxyXG4gIGxldCBlbnRcclxuICBsZXQgZnJhbWVcclxuXHJcbiAgcmVuZGVyZXIuZmx1c2hTcHJpdGVzKClcclxuXHJcbiAgd2hpbGUgKCsraSA8IGxlbikge1xyXG4gICAgZW50ICAgPSBlbnRpdGllc1tpXVxyXG4gICAgZnJhbWUgPSBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb24uZnJhbWVzW2VudC5zcHJpdGUuY3VycmVudEFuaW1hdGlvbkluZGV4XVxyXG5cclxuICAgIHJlbmRlcmVyLmFkZFNwcml0ZShcclxuICAgICAgZW50LnNwcml0ZS5pbWFnZSxcclxuICAgICAgZW50LnBoeXNpY3Mud2lkdGgsXHJcbiAgICAgIGVudC5waHlzaWNzLmhlaWdodCxcclxuICAgICAgZW50LnBoeXNpY3MueCxcclxuICAgICAgZW50LnBoeXNpY3MueSxcclxuICAgICAgZnJhbWUuYWFiYi53IC8gZW50LnNwcml0ZS5pbWFnZS53aWR0aCxcclxuICAgICAgZnJhbWUuYWFiYi5oIC8gZW50LnNwcml0ZS5pbWFnZS5oZWlnaHQsXHJcbiAgICAgIGZyYW1lLmFhYmIueCAvIGVudC5zcHJpdGUuaW1hZ2Uud2lkdGgsXHJcbiAgICAgIGZyYW1lLmFhYmIueSAvIGVudC5zcHJpdGUuaW1hZ2UuaGVpZ2h0XHJcbiAgICApXHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gU2NlbmVcclxuXHJcbmZ1bmN0aW9uIFNjZW5lIChuYW1lLCBzeXN0ZW1zKSB7XHJcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWVcIilcclxuXHJcbiAgdGhpcy5uYW1lICAgID0gbmFtZVxyXG4gIHRoaXMuc3lzdGVtcyA9IHN5c3RlbXNcclxuICB0aGlzLmdhbWUgICAgPSBudWxsXHJcbn1cclxuXHJcblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xyXG4gIGNiKG51bGwsIG51bGwpICBcclxufVxyXG5cclxuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkVCkge1xyXG4gIGxldCBzdG9yZSA9IHRoaXMuZ2FtZS5lbnRpdHlTdG9yZVxyXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcclxuICBsZXQgaSAgICAgPSAtMVxyXG4gIGxldCBzeXN0ZW1cclxuXHJcbiAgd2hpbGUgKCsraSA8IGxlbikge1xyXG4gICAgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldIFxyXG4gICAgc3lzdGVtLnJ1bih0aGlzLCBzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxyXG4gIH1cclxufVxyXG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NlbmVNYW5hZ2VyXHJcblxyXG5mdW5jdGlvbiBTY2VuZU1hbmFnZXIgKHNjZW5lcz1bXSkge1xyXG4gIGlmIChzY2VuZXMubGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBvbmUgb3IgbW9yZSBzY2VuZXNcIilcclxuXHJcbiAgbGV0IGFjdGl2ZVNjZW5lSW5kZXggPSAwXHJcbiAgbGV0IHNjZW5lcyAgICAgICAgICAgPSBzY2VuZXNcclxuXHJcbiAgdGhpcy5zY2VuZXMgICAgICA9IHNjZW5lc1xyXG4gIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleF1cclxuXHJcbiAgdGhpcy50cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiAoc2NlbmVOYW1lKSB7XHJcbiAgICBsZXQgc2NlbmUgPSBmaW5kV2hlcmUoXCJuYW1lXCIsIHNjZW5lTmFtZSwgc2NlbmVzKVxyXG5cclxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihzY2VuZU5hbWUgKyBcIiBpcyBub3QgYSB2YWxpZCBzY2VuZSBuYW1lXCIpXHJcblxyXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxyXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgc2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleCArIDFdXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9yZSBzY2VuZXMhXCIpXHJcblxyXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBTeXN0ZW0gKGNvbXBvbmVudE5hbWVzPVtdKSB7XHJcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXHJcbn1cclxuXHJcbi8vc2NlbmUuZ2FtZS5jbG9ja1xyXG5TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICAvL2RvZXMgc29tZXRoaW5nIHcvIHRoZSBsaXN0IG9mIGVudGl0aWVzIHBhc3NlZCB0byBpdFxyXG59XHJcbiIsImxldCB7UGFkZGxlLCBCbG9jaywgRmlnaHRlcn0gPSByZXF1aXJlKFwiLi9hc3NlbWJsYWdlc1wiKVxyXG5sZXQgUGFkZGxlTW92ZXJTeXN0ZW0gICAgICAgPSByZXF1aXJlKFwiLi9QYWRkbGVNb3ZlclN5c3RlbVwiKVxyXG5sZXQgUmVuZGVyaW5nU3lzdGVtICAgICAgICAgPSByZXF1aXJlKFwiLi9SZW5kZXJpbmdTeXN0ZW1cIilcclxubGV0IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtID0gcmVxdWlyZShcIi4vS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cIilcclxubGV0IFNjZW5lICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVzdFNjZW5lXHJcblxyXG5mdW5jdGlvbiBUZXN0U2NlbmUgKCkge1xyXG4gIGxldCBzeXN0ZW1zID0gW1xyXG4gICAgbmV3IFBhZGRsZU1vdmVyU3lzdGVtLCBcclxuICAgIG5ldyBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSxcclxuICAgIG5ldyBSZW5kZXJpbmdTeXN0ZW1cclxuICBdXHJcblxyXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXHJcbn1cclxuXHJcblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcclxuXHJcblRlc3RTY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlLCBhdWRpb1N5c3RlbX0gPSB0aGlzLmdhbWUgXHJcbiAgbGV0IHtiZ30gPSBhdWRpb1N5c3RlbS5jaGFubmVsc1xyXG4gIGxldCBhc3NldHMgPSB7XHJcbiAgICAvL3NvdW5kczogeyBiZ011c2ljOiBcIi9wdWJsaWMvc291bmRzL2JnbTEubXAzXCIgfSxcclxuICAgIHRleHR1cmVzOiB7IFxyXG4gICAgICBwYWRkbGU6ICBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIixcclxuICAgICAgYmxvY2tzOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCIsXHJcbiAgICAgIGZpZ2h0ZXI6IFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcHVuY2gucG5nXCJcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XHJcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxyXG5cclxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXHJcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA0NCwgMjIsIDgwMCwgODAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgRmlnaHRlcih0ZXh0dXJlcy5maWdodGVyLCA3NiwgNTksIDUwMCwgNTAwKSlcclxuICAgIC8vYmcudm9sdW1lID0gMFxyXG4gICAgLy9iZy5sb29wKGNhY2hlLnNvdW5kcy5iZ011c2ljKVxyXG4gICAgY2IobnVsbClcclxuICB9KVxyXG59XHJcbiIsImxldCB7UGh5c2ljcywgUGxheWVyQ29udHJvbGxlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXHJcbmxldCB7U3ByaXRlfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcclxubGV0IEFuaW1hdGlvbiA9IHJlcXVpcmUoXCIuL0FuaW1hdGlvblwiKVxyXG5sZXQgRW50aXR5ICAgID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgID0gUGFkZGxlXHJcbm1vZHVsZS5leHBvcnRzLkJsb2NrICAgPSBCbG9ja1xyXG5tb2R1bGUuZXhwb3J0cy5GaWdodGVyID0gRmlnaHRlclxyXG5tb2R1bGUuZXhwb3J0cy5XYXRlciAgID0gV2F0ZXJcclxuXHJcbmZ1bmN0aW9uIFBhZGRsZSAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBQbGF5ZXJDb250cm9sbGVkKHRoaXMpXHJcbiAgU3ByaXRlKHRoaXMsIHcsIGgsIGltYWdlLCBcImlkbGVcIiwge1xyXG4gICAgaWRsZTogQW5pbWF0aW9uLmNyZWF0ZVNpbmdsZSgxMTIsIDI1LCAwLCAwKVxyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEJsb2NrIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIFNwcml0ZSh0aGlzLCB3LCBoLCBpbWFnZSwgXCJpZGxlXCIsIHtcclxuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoNDQsIDIyLCAwLCAwLCAzLCB0cnVlLCA1MDApXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gRmlnaHRlciAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBTcHJpdGUodGhpcywgdywgaCwgaW1hZ2UsIFwiZmlyZWJhbGxcIiwge1xyXG4gICAgZmlyZWJhbGw6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoMTc0LCAxMzQsIDAsIDAsIDI1LCB0cnVlKVxyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFdhdGVyICh3LCBoLCB4LCB5LCB0b3BDb2xvciwgYm90dG9tQ29sb3IpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzLlBoeXNpY3MgICAgICAgICAgPSBQaHlzaWNzXHJcbm1vZHVsZS5leHBvcnRzLlBsYXllckNvbnRyb2xsZWQgPSBQbGF5ZXJDb250cm9sbGVkXHJcbm1vZHVsZS5leHBvcnRzLlNwcml0ZSAgICAgICAgICAgPSBTcHJpdGVcclxubW9kdWxlLmV4cG9ydHMuUG9seWdvbiAgICAgICAgICA9IFBvbHlnb25cclxuXHJcbmZ1bmN0aW9uIFNwcml0ZSAoZSwgd2lkdGgsIGhlaWdodCwgaW1hZ2UsIGN1cnJlbnRBbmltYXRpb25OYW1lLCBhbmltYXRpb25zKSB7XHJcbiAgZS5zcHJpdGUgPSB7XHJcbiAgICB3aWR0aCxcclxuICAgIGhlaWdodCxcclxuICAgIGltYWdlLFxyXG4gICAgYW5pbWF0aW9ucyxcclxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbkluZGV4OiAwLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbjogICAgICBhbmltYXRpb25zW2N1cnJlbnRBbmltYXRpb25OYW1lXSxcclxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbWF0aW9uc1tjdXJyZW50QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBQb2x5Z29uIChlLCBwb2x5Z29uKSB7XHJcbiAgZS5wb2x5Z29uID0gcG9seWdvblxyXG59XHJcblxyXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XHJcbiAgZS5waHlzaWNzID0ge1xyXG4gICAgd2lkdGgsIFxyXG4gICAgaGVpZ2h0LCBcclxuICAgIHgsIFxyXG4gICAgeSwgXHJcbiAgICBkeDogIDAsIFxyXG4gICAgZHk6ICAwLCBcclxuICAgIGRkeDogMCwgXHJcbiAgICBkZHk6IDBcclxuICB9XHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGxheWVyQ29udHJvbGxlZCAoZSkge1xyXG4gIGUucGxheWVyQ29udHJvbGxlZCA9IHRydWVcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcclxubW9kdWxlLmV4cG9ydHMuaGFzS2V5cyAgID0gaGFzS2V5c1xyXG5cclxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXHJcbmZ1bmN0aW9uIGZpbmRXaGVyZSAoa2V5LCBwcm9wZXJ0eSwgYXJyYXlPZk9iamVjdHMpIHtcclxuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcclxuICBsZXQgaSAgICAgPSAtMVxyXG4gIGxldCBmb3VuZCA9IG51bGxcclxuXHJcbiAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XHJcbiAgICBpZiAoYXJyYXlPZk9iamVjdHNbaV1ba2V5XSA9PT0gcHJvcGVydHkpIHtcclxuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZm91bmRcclxufVxyXG5cclxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIFxyXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcclxuICByZXR1cm4gdHJ1ZVxyXG59XHJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxyXG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XHJcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcclxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxyXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcclxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxyXG4iLCJtb2R1bGUuZXhwb3J0cy5zcHJpdGVWZXJ0ZXhTaGFkZXIgPSBcIiBcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfcG9zaXRpb247IFxcXHJcbiAgYXR0cmlidXRlIHZlYzIgYV90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHVuaWZvcm0gdmVjMiB1X3dvcmxkU2l6ZTsgXFxcclxuICBcXFxyXG4gIHZhcnlpbmcgdmVjMiB2X3RleENvb3JkOyBcXFxyXG4gIFxcXHJcbiAgdmVjMiBub3JtICh2ZWMyIHBvc2l0aW9uKSB7IFxcXHJcbiAgICByZXR1cm4gcG9zaXRpb24gKiAyLjAgLSAxLjA7IFxcXHJcbiAgfSBcXFxyXG4gIFxcXHJcbiAgdm9pZCBtYWluKCkgeyBcXFxyXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcclxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IGFfcG9zaXRpb24gLyB1X3dvcmxkU2l6ZTsgXFxcclxuICAgIHZlYzIgcG9zaXRpb24gICAgICA9IGNsaXBTcGFjZSAqIG5vcm0oZnJvbVdvcmxkU2l6ZSk7IFxcXHJcbiAgICBcXFxyXG4gICAgdl90ZXhDb29yZCAgPSBhX3RleENvb3JkOyBcXFxyXG4gICAgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvc2l0aW9uLCAwLCAxKTsgXFxcclxuICB9XCJcclxuXHJcbm1vZHVsZS5leHBvcnRzLnNwcml0ZUZyYWdtZW50U2hhZGVyID0gXCJcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIHVuaWZvcm0gc2FtcGxlcjJEIHVfaW1hZ2U7IFxcXHJcbiAgXFxcclxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHZvaWQgbWFpbigpIHsgXFxcclxuICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X2ltYWdlLCB2X3RleENvb3JkKTsgXFxcclxuICB9XCJcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBvbHlnb25WZXJ0ZXhTaGFkZXIgPSBcIlxcXHJcbiAgYXR0cmlidXRlIHZlYzIgYV92ZXJ0ZXg7IFxcXHJcbiAgYXR0cmlidXRlIHZlYzQgYV92ZXJ0ZXhDb2xvcjsgXFxcclxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXHJcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXHJcbiAgdmVjMiBub3JtICh2ZWMyIHBvc2l0aW9uKSB7IFxcXHJcbiAgICByZXR1cm4gcG9zaXRpb24gKiAyLjAgLSAxLjA7IFxcXHJcbiAgfSBcXFxyXG4gIHZvaWQgbWFpbiAoKSB7IFxcXHJcbiAgICBtYXQyIGNsaXBTcGFjZSAgICAgPSBtYXQyKDEuMCwgMC4wLCAwLjAsIC0xLjApOyBcXFxyXG4gICAgdmVjMiBmcm9tV29ybGRTaXplID0gYV92ZXJ0ZXggLyB1X3dvcmxkU2l6ZTsgXFxcclxuICAgIHZlYzIgcG9zaXRpb24gICAgICA9IGNsaXBTcGFjZSAqIG5vcm0oZnJvbVdvcmxkU2l6ZSk7IFxcXHJcbiAgICBcXFxyXG4gICAgdl92ZXJ0ZXhDb2xvciA9IGFfdmVydGV4Q29sb3I7IFxcXHJcbiAgICBnbF9Qb3NpdGlvbiAgID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5wb2x5Z29uRnJhZ21lbnRTaGFkZXIgPSBcIlxcXHJcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxyXG4gIFxcXHJcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXHJcbiAgXFxcclxuICB2b2lkIG1haW4oKSB7IFxcXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIH1cIlxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcclxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XHJcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcclxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXHJcbiAgXHJcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxyXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxyXG5cclxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXHJcblxyXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpXHJcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXHJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcclxuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxyXG5cclxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxyXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXHJcbiAgcmV0dXJuIHByb2dyYW1cclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxyXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xyXG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG5cclxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxyXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIHJldHVybiB0ZXh0dXJlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cclxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcclxuIiwibGV0IExvYWRlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgICAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgRW50aXR5U3RvcmUgICAgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXHJcbmxldCBDbG9jayAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxyXG5sZXQgQ2FjaGUgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5sZXQgVGVzdFNjZW5lICAgICAgID0gcmVxdWlyZShcIi4vVGVzdFNjZW5lXCIpXHJcbmxldCBHYW1lICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9HYW1lXCIpXHJcbmxldCBJbnB1dE1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcclxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gICAgID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IGNhbnZhcyAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcclxuXHJcbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDI1XHJcbmNvbnN0IE1BWF9DT1VOVCAgICAgICA9IDEwMDBcclxuXHJcbmxldCBrZXlib2FyZE1hbmFnZXIgPSBuZXcgS2V5Ym9hcmRNYW5hZ2VyKGRvY3VtZW50KVxyXG5sZXQgaW5wdXRNYW5hZ2VyICAgID0gbmV3IElucHV0TWFuYWdlcihrZXlib2FyZE1hbmFnZXIpXHJcbmxldCBlbnRpdHlTdG9yZSAgICAgPSBuZXcgRW50aXR5U3RvcmVcclxubGV0IGNsb2NrICAgICAgICAgICA9IG5ldyBDbG9jayhEYXRlLm5vdylcclxubGV0IGNhY2hlICAgICAgICAgICA9IG5ldyBDYWNoZShbXCJzb3VuZHNcIiwgXCJ0ZXh0dXJlc1wiXSlcclxubGV0IGxvYWRlciAgICAgICAgICA9IG5ldyBMb2FkZXJcclxubGV0IHJlbmRlcmVyICAgICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgMTkyMCwgMTA4MClcclxubGV0IGF1ZGlvU3lzdGVtICAgICA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXHJcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcclxubGV0IGdhbWUgICAgICAgICAgICA9IG5ldyBHYW1lKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIGVudGl0eVN0b3JlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcclxuXHJcbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGNsb2NrICAgICAgICAgID0gZ2FtZS5jbG9ja1xyXG4gIGxldCBpbnB1dE1hbmFnZXIgICA9IGdhbWUuaW5wdXRNYW5hZ2VyXHJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XHJcbiAgICBjbG9jay50aWNrKClcclxuICAgIGlucHV0TWFuYWdlci5rZXlib2FyZE1hbmFnZXIudGljayhjbG9jay5kVClcclxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZShjbG9jay5kVClcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xyXG4gICAgZ2FtZS5yZW5kZXJlci5yZW5kZXIoKVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5nYW1lID0gZ2FtZVxyXG5cclxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgfSlcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxyXG4gIGdhbWUuc3RhcnQoKVxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcclxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXHJcbn0pXHJcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXHJcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcclxubW9kdWxlLmV4cG9ydHMuc2V0Qm94ICAgICAgICAgPSBzZXRCb3hcclxuXHJcbmNvbnN0IFBPSU5UX0RJTUVOU0lPTiAgICAgPSAyXHJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICAgICAgPSA2XHJcbmNvbnN0IEJPWF9MRU5HVEggICAgICAgICAgPSBQT0lOVF9ESU1FTlNJT04gKiBQT0lOVFNfUEVSX0JPWFxyXG5cclxuZnVuY3Rpb24gY2hlY2tUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgY3RvcikpIHRocm93IG5ldyBFcnJvcihcIk11c3QgYmUgb2YgdHlwZSBcIiArIGN0b3IubmFtZSlcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tWYWx1ZVR5cGUgKGluc3RhbmNlLCBjdG9yKSB7XHJcbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhpbnN0YW5jZSlcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSBjaGVja1R5cGUoaW5zdGFuY2Vba2V5c1tpXV0sIGN0b3IpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEJveCAoYm94QXJyYXksIGluZGV4LCB3LCBoLCB4LCB5KSB7XHJcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XHJcbiAgbGV0IHgxID0geFxyXG4gIGxldCB5MSA9IHkgXHJcbiAgbGV0IHgyID0geCArIHdcclxuICBsZXQgeTIgPSB5ICsgaFxyXG5cclxuICBib3hBcnJheVtpXSAgICA9IHgxXHJcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxyXG4gIGJveEFycmF5W2krMl0gID0geDFcclxuICBib3hBcnJheVtpKzNdICA9IHkyXHJcbiAgYm94QXJyYXlbaSs0XSAgPSB4MlxyXG4gIGJveEFycmF5W2krNV0gID0geTFcclxuXHJcbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxyXG4gIGJveEFycmF5W2krN10gID0geTJcclxuICBib3hBcnJheVtpKzhdICA9IHgyXHJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MlxyXG4gIGJveEFycmF5W2krMTBdID0geDJcclxuICBib3hBcnJheVtpKzExXSA9IHkxXHJcbn1cclxuIl19
