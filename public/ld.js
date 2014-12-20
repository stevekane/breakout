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

},{"./functions":25}],8:[function(require,module,exports){
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
  gl.clearColor(0, 0, 0, 0);
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

},{"./gl-buffer":26,"./gl-shaders":27,"./gl-types":28,"./utils":30}],9:[function(require,module,exports){
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./InputManager":10,"./Loader":13,"./SceneManager":18,"./utils":30}],10:[function(require,module,exports){
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

},{"./KeyboardManager":11,"./utils":30}],11:[function(require,module,exports){
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

},{"./System":20}],13:[function(require,module,exports){
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

},{"./System":20}],15:[function(require,module,exports){
"use strict";

module.exports = Polygon;

function Polygon(vertices, indices, vertexColors) {
  this.vertices = vertices;
  this.indices = indices;
  this.vertexColors = vertexColors;
}

},{}],16:[function(require,module,exports){
"use strict";

var System = require("./System");

module.exports = PolygonRenderingSystem;

function PolygonRenderingSystem() {
  System.call(this, ["physics", "polygon"]);
}

PolygonRenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;
  var len = entities.length;
  var i = -1;
  var ent;

  renderer.flushPolygons();

  while (++i < len) {
    ent = entities[i];
    //TODO: vertices should be in local coords.  Need to translate to global
    renderer.addPolygon(ent.polygon.vertices, ent.polygon.indices, ent.polygon.vertexColors);
  }
};

},{"./System":20}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{"./functions":25}],19:[function(require,module,exports){
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

},{"./System":20}],20:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

//scene.game.clock
System.prototype.run = function (scene, entities) {};

},{}],21:[function(require,module,exports){
"use strict";

var _ref = require("./assemblages");

var Paddle = _ref.Paddle;
var Block = _ref.Block;
var Fighter = _ref.Fighter;
var Water = _ref.Water;
var PaddleMoverSystem = require("./PaddleMoverSystem");
var SpriteRenderingSystem = require("./SpriteRenderingSystem");
var PolygonRenderingSystem = require("./PolygonRenderingSystem");
var KeyframeAnimationSystem = require("./KeyframeAnimationSystem");
var Scene = require("./Scene");

module.exports = TestScene;

function TestScene() {
  var systems = [new PaddleMoverSystem(), new KeyframeAnimationSystem(), new PolygonRenderingSystem(), new SpriteRenderingSystem()];

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

    for (var i = 0; i < 20; ++i) {
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 100));
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 145));
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 190));
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 235));
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 280));
    }

    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 600, 600));
    entityStore.addEntity(new Fighter(textures.fighter, 76, 59, 500, 500));
    entityStore.addEntity(new Water(1920, 280, 0, 800, 100));
    //bg.volume = 0
    //bg.loop(cache.sounds.bgMusic)
    cb(null);
  });
};

},{"./KeyframeAnimationSystem":12,"./PaddleMoverSystem":14,"./PolygonRenderingSystem":16,"./Scene":17,"./SpriteRenderingSystem":19,"./assemblages":23}],22:[function(require,module,exports){
"use strict";

var Polygon = require("./Polygon");

module.exports = WaterPolygon;

var POINTS_PER_VERTEX = 2;
var COLOR_CHANNEL_COUNT = 4;
var INDICES_PER_QUAD = 6;
var QUAD_VERTEX_SIZE = 8;

function setVertex(vertices, index, x, y) {
  var i = index * POINTS_PER_VERTEX;

  vertices[i] = x;
  vertices[i + 1] = y;
}

function setColor(colors, index, color) {
  var i = index * COLOR_CHANNEL_COUNT;

  colors.set(color, i);
}

function WaterPolygon(w, h, x, y, sliceCount, topColor, bottomColor) {
  var vertexCount = 2 + (sliceCount * 2);
  var vertices = new Float32Array(vertexCount * POINTS_PER_VERTEX);
  var vertexColors = new Float32Array(vertexCount * COLOR_CHANNEL_COUNT);
  var indices = new Uint16Array(INDICES_PER_QUAD * sliceCount);
  var unitWidth = w / sliceCount;
  var i = -1;
  var j = -1;

  while (++i <= sliceCount) {
    setVertex(vertices, i, (x + unitWidth * i), y);
    setColor(vertexColors, i, topColor);
    setVertex(vertices, i + sliceCount + 1, (x + unitWidth * i), y + h);
    setColor(vertexColors, i + sliceCount + 1, bottomColor);
  }

  while (++j < sliceCount) {
    indices[j * INDICES_PER_QUAD] = j + 1;
    indices[j * INDICES_PER_QUAD + 1] = j;
    indices[j * INDICES_PER_QUAD + 2] = j + 1 + sliceCount;
    indices[j * INDICES_PER_QUAD + 3] = j + 1;
    indices[j * INDICES_PER_QUAD + 4] = j + 1 + sliceCount;
    indices[j * INDICES_PER_QUAD + 5] = j + 2 + sliceCount;
  }

  return new Polygon(vertices, indices, vertexColors);
}

},{"./Polygon":15}],23:[function(require,module,exports){
"use strict";

var _ref = require("./components");

var Physics = _ref.Physics;
var PlayerControlled = _ref.PlayerControlled;
var _ref2 = require("./components");

var Sprite = _ref2.Sprite;
var Polygon = _ref2.Polygon;
var Animation = require("./Animation");
var Entity = require("./Entity");
var WaterPolygon = require("./WaterPolygon");

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
    idle: Animation.createLinear(44, 22, 0, 0, 3, true, 1000)
  });
}

function Fighter(image, w, h, x, y) {
  Entity.call(this);
  Physics(this, w, h, x, y);
  Sprite(this, w, h, image, "fireball", {
    fireball: Animation.createLinear(174, 134, 0, 0, 25, true)
  });
}

function Water(w, h, x, y, sliceCount, topColor, bottomColor) {
  var _topColor = _topColor || [0, 0, 0.5, 0.5];
  var _bottomColor = _bottomColor || [0.7, 0.7, 0.8, 0.9];

  Entity.call(this);
  //TODO: Polygons should store local coordinates
  Physics(this, w, h, x, y);
  Polygon(this, WaterPolygon(w, h, x, y, sliceCount, _topColor, _bottomColor));
}

},{"./Animation":2,"./Entity":6,"./WaterPolygon":22,"./components":24}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],27:[function(require,module,exports){
"use strict";

module.exports.spriteVertexShader = "   precision highp float;     attribute vec2 a_position;   attribute vec2 a_texCoord;     uniform vec2 u_worldSize;     varying vec2 v_texCoord;     vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }     void main() {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_position / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_texCoord  = a_texCoord;     gl_Position = vec4(position, 0, 1);   }";

module.exports.spriteFragmentShader = "  precision highp float;     uniform sampler2D u_image;     varying vec2 v_texCoord;     void main() {     gl_FragColor = texture2D(u_image, v_texCoord);   }";

module.exports.polygonVertexShader = "  attribute vec2 a_vertex;   attribute vec4 a_vertexColor;   uniform vec2 u_worldSize;   varying vec4 v_vertexColor;   vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }   void main () {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_vertex / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_vertexColor = a_vertexColor;     gl_Position   = vec4(position, 0, 1);   }";

module.exports.polygonFragmentShader = "  precision highp float;     varying vec4 v_vertexColor;     void main() {     gl_FragColor = v_vertexColor;   }";

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{"./AudioSystem":3,"./Cache":4,"./Clock":5,"./EntityStore-Simple":7,"./GLRenderer":8,"./Game":9,"./InputManager":10,"./KeyboardManager":11,"./Loader":13,"./SceneManager":18,"./TestScene":21}],30:[function(require,module,exports){
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

},{}]},{},[29])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1BvbHlnb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1BvbHlnb25SZW5kZXJpbmdTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9TY2VuZU1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1Nwcml0ZVJlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1dhdGVyUG9seWdvbi5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvYXNzZW1ibGFnZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2NvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Z1bmN0aW9ucy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtYnVmZmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9nbC1zaGFkZXJzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9nbC10eXBlcy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvbGQuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsSUFBSSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQyxNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFVixRQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDakMsT0FBRyxFQUFBLFlBQUc7QUFBRSxhQUFPLENBQUMsQ0FBQTtLQUFFO0dBQ25CLENBQUMsQ0FBQTtBQUNGLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqQyxPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sQ0FBQyxDQUFBO0tBQUU7R0FDbkIsQ0FBQyxDQUFBO0FBQ0YsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQUU7R0FDdkIsQ0FBQyxDQUFBO0FBQ0YsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQUU7R0FDdkIsQ0FBQyxDQUFBO0NBQ0gsQ0FBQTs7Ozs7QUNsQkQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUU1QixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQTs7QUFFMUIsU0FBUyxLQUFLLENBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUM5QixNQUFJLENBQUMsSUFBSSxHQUFPLElBQUksQ0FBQTtBQUNwQixNQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtDQUN6Qjs7O0FBR0QsU0FBUyxTQUFTLENBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUs7TUFBVCxJQUFJLGdCQUFKLElBQUksR0FBQyxFQUFFO0FBQzNDLE1BQUksQ0FBQyxJQUFJLEdBQUssUUFBUSxDQUFBO0FBQ3RCLE1BQUksQ0FBQyxJQUFJLEdBQUssSUFBSSxDQUFBO0FBQ2xCLE1BQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0NBQ3JCOztBQUVELFNBQVMsQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUs7TUFBVCxJQUFJLGdCQUFKLElBQUksR0FBQyxFQUFFO0FBQ3JFLE1BQUksTUFBTSxHQUFHLEVBQUUsQ0FBQTtBQUNmLE1BQUksQ0FBQyxHQUFRLENBQUMsQ0FBQyxDQUFBO0FBQ2YsTUFBSSxLQUFLLENBQUE7QUFDVCxNQUFJLElBQUksQ0FBQTs7QUFFUixTQUFPLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRTtBQUNsQixTQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDakIsUUFBSSxHQUFJLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQ2hDLFVBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7R0FDbkM7O0FBRUQsU0FBTyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFBO0NBQzdDLENBQUE7O0FBRUQsU0FBUyxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUs7TUFBVCxJQUFJLGdCQUFKLElBQUksR0FBQyxFQUFFO0FBQ3BELE1BQUksSUFBSSxHQUFLLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQ2pDLE1BQUksTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7O0FBRXBDLFNBQU8sSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6QyxDQUFBOzs7OztBQ3BDRCxTQUFTLE9BQU8sQ0FBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQy9CLE1BQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQTs7QUFFbEMsTUFBSSxhQUFhLEdBQUcsVUFBVSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUMvQyxPQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ25CLFVBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7R0FDckIsQ0FBQTs7QUFFRCxNQUFJLFFBQVEsR0FBRyxVQUFVLE9BQU8sRUFBSztRQUFaLE9BQU8sZ0JBQVAsT0FBTyxHQUFDLEVBQUU7QUFDakMsUUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUE7O0FBRXRDLFdBQU8sVUFBVSxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQy9CLFVBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTs7QUFFOUMsVUFBSSxNQUFNLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUEsS0FDbkMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTs7QUFFaEMsU0FBRyxDQUFDLElBQUksR0FBSyxVQUFVLENBQUE7QUFDdkIsU0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDbkIsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNaLGFBQU8sR0FBRyxDQUFBO0tBQ1gsQ0FBQTtHQUNGLENBQUE7O0FBRUQsU0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBRXBDLFFBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxjQUFVLEVBQUUsSUFBSTtBQUNoQixPQUFHLEVBQUEsWUFBRztBQUFFLGFBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUE7S0FBRTtBQUNuQyxPQUFHLEVBQUEsVUFBQyxLQUFLLEVBQUU7QUFBRSxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7S0FBRTtHQUMxQyxDQUFDLENBQUE7O0FBRUYsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xDLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLE9BQUcsRUFBQSxZQUFHO0FBQUUsYUFBTyxPQUFPLENBQUE7S0FBRTtHQUN6QixDQUFDLENBQUE7O0FBRUYsTUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7QUFDaEIsTUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtBQUNsQyxNQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsRUFBRSxDQUFBO0NBQ3ZCOztBQUVELFNBQVMsV0FBVyxDQUFFLFlBQVksRUFBRTtBQUNsQyxNQUFJLE9BQU8sR0FBSSxJQUFJLFlBQVksRUFBQSxDQUFBO0FBQy9CLE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNqQixNQUFJLENBQUMsR0FBVSxDQUFDLENBQUMsQ0FBQTs7QUFFakIsU0FBTyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUN4QixZQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2xFO0FBQ0QsTUFBSSxDQUFDLE9BQU8sR0FBSSxPQUFPLENBQUE7QUFDdkIsTUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7Q0FDekI7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUE7Ozs7O0FDdEQ1QixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsS0FBSyxDQUFFLFFBQVEsRUFBRTtBQUN6QyxNQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtBQUM1RCxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ2pFLENBQUE7Ozs7O0FDSEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7O0FBRXRCLFNBQVMsS0FBSyxDQUFFLE1BQU07O01BQU4sTUFBTSxnQkFBTixNQUFNLEdBQUMsSUFBSSxDQUFDLEdBQUc7c0JBQUU7QUFDL0IsVUFBSyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUE7QUFDdkIsVUFBSyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUE7QUFDdkIsVUFBSyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ1gsVUFBSyxJQUFJLEdBQUcsWUFBWTtBQUN0QixVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7QUFDM0IsVUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEVBQUUsQ0FBQTtBQUN2QixVQUFJLENBQUMsRUFBRSxHQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtLQUMzQyxDQUFBO0dBQ0Y7Q0FBQTs7Ozs7O0FDVkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLE1BQU0sR0FBSSxFQUFFLENBQUE7Ozs7O1dDRHRCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQWpDLE9BQU8sUUFBUCxPQUFPOzs7QUFFWixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQTs7QUFFNUIsU0FBUyxXQUFXLENBQUUsR0FBRyxFQUFPO01BQVYsR0FBRyxnQkFBSCxHQUFHLEdBQUMsSUFBSTtBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFJLEVBQUUsQ0FBQTtBQUNuQixNQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM3QyxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTs7QUFFN0IsTUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDckIsU0FBTyxFQUFFLENBQUE7Q0FDVixDQUFBOztBQUVELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsY0FBYyxFQUFFO0FBQ3RELE1BQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ1YsTUFBSSxNQUFNLENBQUE7O0FBRVYsTUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7O0FBRW5CLFNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFVBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLFFBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUNqRTtBQUNELFNBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtDQUN0QixDQUFBOzs7OztXQzNCZ0QsT0FBTyxDQUFDLGNBQWMsQ0FBQzs7SUFBbkUsa0JBQWtCLFFBQWxCLGtCQUFrQjtJQUFFLG9CQUFvQixRQUFwQixvQkFBb0I7WUFDTSxPQUFPLENBQUMsY0FBYyxDQUFDOztJQUFyRSxtQkFBbUIsU0FBbkIsbUJBQW1CO0lBQUUscUJBQXFCLFNBQXJCLHFCQUFxQjtZQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDOztJQUE1QixNQUFNLFNBQU4sTUFBTTtZQUNzQixPQUFPLENBQUMsWUFBWSxDQUFDOztJQUFqRCxNQUFNLFNBQU4sTUFBTTtJQUFFLE9BQU8sU0FBUCxPQUFPO0lBQUUsT0FBTyxTQUFQLE9BQU87WUFDUixPQUFPLENBQUMsYUFBYSxDQUFDOztJQUF0QyxZQUFZLFNBQVosWUFBWTs7O0FBRWpCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFBOztBQUUzQixJQUFNLGVBQWUsR0FBTyxDQUFDLENBQUE7QUFDN0IsSUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUE7QUFDN0IsSUFBTSxjQUFjLEdBQVEsQ0FBQyxDQUFBO0FBQzdCLElBQU0sVUFBVSxHQUFZLGVBQWUsR0FBRyxjQUFjLENBQUE7QUFDNUQsSUFBTSxnQkFBZ0IsR0FBTSxPQUFPLENBQUE7O0FBRW5DLFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUN4QixTQUFPLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTtDQUM1Qzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUU7QUFDM0IsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFO0FBQzFCLE1BQUksRUFBRSxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQTs7QUFFN0MsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ3hELFNBQU8sRUFBRSxDQUFBO0NBQ1Y7O0FBRUQsU0FBUyxhQUFhLENBQUUsS0FBSyxFQUFFO0FBQzdCLFNBQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFBO0NBQ2hEOzs7QUFHRCxTQUFTLHVCQUF1QixDQUFFLEtBQUssRUFBRTtBQUN2QyxNQUFJLEVBQUUsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7O0FBRTdDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFVBQVUsRUFBRTtBQUN6RCxVQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtHQUMxQjtBQUNELFNBQU8sRUFBRSxDQUFBO0NBQ1Y7O0FBRUQsU0FBUyxVQUFVLENBQUUsSUFBSSxFQUFFO0FBQ3pCLFNBQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDN0I7O0FBRUQsU0FBUyxXQUFXLENBQUUsSUFBSSxFQUFFO0FBQzFCLFNBQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxDQUFBO0NBQ2hEOzs7QUFHRCxTQUFTLGdCQUFnQixDQUFFLElBQUksRUFBRTtBQUMvQixTQUFPLElBQUksWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQTtDQUNsQzs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxJQUFJLEVBQUU7QUFDMUIsTUFBSSxDQUFDLEtBQUssR0FBUSxDQUFDLENBQUE7QUFDbkIsTUFBSSxDQUFDLEtBQUssR0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEMsTUFBSSxDQUFDLE9BQU8sR0FBTSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbkMsTUFBSSxDQUFDLE1BQU0sR0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbEMsTUFBSSxDQUFDLFNBQVMsR0FBSSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDckMsTUFBSSxDQUFDLFNBQVMsR0FBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUNoRDs7QUFFRCxTQUFTLFlBQVksQ0FBRSxJQUFJLEVBQUU7QUFDM0IsTUFBSSxDQUFDLEtBQUssR0FBVSxDQUFDLENBQUE7QUFDckIsTUFBSSxDQUFDLE9BQU8sR0FBUSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEMsTUFBSSxDQUFDLFFBQVEsR0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDckMsTUFBSSxDQUFDLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtDQUMzQzs7QUFFRCxTQUFTLFVBQVUsQ0FBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTs7QUFDMUMsTUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFBO0FBQ3hCLE1BQUksSUFBSSxHQUFhLE1BQU0sQ0FBQTtBQUMzQixNQUFJLEVBQUUsR0FBZSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQy9DLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0FBQ3JFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3pFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO0FBQ3RFLE1BQUksR0FBRyxHQUFjLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO0FBQzFFLE1BQUksYUFBYSxHQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQzFDLE1BQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBOzs7QUFHMUMsTUFBSSxTQUFTLEdBQVEsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFBO0FBQ3RDLE1BQUksWUFBWSxHQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN0QyxNQUFJLFdBQVcsR0FBTSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDdEMsTUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFBO0FBQ3RDLE1BQUksY0FBYyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTs7O0FBR3RDLE1BQUksWUFBWSxHQUFRLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN6QyxNQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQTtBQUN6QyxNQUFJLFdBQVcsR0FBUyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUE7OztBQUd6QyxNQUFJLFdBQVcsR0FBUSxFQUFFLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ3hFLE1BQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQTs7Ozs7QUFLeEUsTUFBSSxjQUFjLEdBQVEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUMxRSxNQUFJLG1CQUFtQixHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7OztBQUcvRSxNQUFJLHVCQUF1QixHQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFDbEYsTUFBSSx3QkFBd0IsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFBOztBQUVuRixNQUFJLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDakMsTUFBSSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ2pDLE1BQUksWUFBWSxHQUFRLElBQUksWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUE7O0FBRTFELElBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ25CLElBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZCLElBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtBQUNsRCxJQUFFLENBQUMsVUFBVSxDQUFDLENBQUcsRUFBRSxDQUFHLEVBQUUsQ0FBRyxFQUFFLENBQUcsQ0FBQyxDQUFBO0FBQ2pDLElBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDcEMsSUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUE7O0FBRTdCLE1BQUksQ0FBQyxVQUFVLEdBQUc7QUFDaEIsU0FBSyxFQUFHLEtBQUssSUFBSSxJQUFJO0FBQ3JCLFVBQU0sRUFBRSxNQUFNLElBQUksSUFBSTtHQUN2QixDQUFBOztBQUVELE1BQUksQ0FBQyxRQUFRLEdBQUcsVUFBQyxPQUFPLEVBQUs7QUFDM0IscUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0FBQy9ELFdBQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQ3RDLENBQUE7O0FBRUQsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFDLEtBQUssRUFBSztBQUMzQixRQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7O0FBRXpCLHFCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDckMsTUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQ3RDLE1BQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDMUUsV0FBTyxPQUFPLENBQUE7R0FDZixDQUFBOztBQUVELE1BQUksQ0FBQyxNQUFNLEdBQUcsVUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFLO0FBQy9CLFFBQUksS0FBSyxHQUFTLE1BQUssVUFBVSxDQUFDLEtBQUssR0FBRyxNQUFLLFVBQVUsQ0FBQyxNQUFNLENBQUE7QUFDaEUsUUFBSSxXQUFXLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQTtBQUNoQyxRQUFJLFFBQVEsR0FBTSxLQUFLLElBQUksV0FBVyxDQUFBO0FBQ3RDLFFBQUksUUFBUSxHQUFNLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUE7QUFDckQsUUFBSSxTQUFTLEdBQUssUUFBUSxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQTs7QUFFckQsVUFBTSxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUE7QUFDeEIsVUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUE7QUFDekIsTUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQTtHQUN2QyxDQUFBOztBQUVELE1BQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBSztBQUM5RCxRQUFJLEVBQUUsR0FBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksTUFBSyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDbEUsUUFBSSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE1BQUssUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBOztBQUUxRCxVQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQzVDLFVBQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDNUQsU0FBSyxDQUFDLEtBQUssRUFBRSxDQUFBO0dBQ2QsQ0FBQTs7QUFFRCxNQUFJLENBQUMsVUFBVSxHQUFHLFVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUs7QUFDckQsUUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTs7QUFFaEMsZ0JBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdkQsZ0JBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDckQsZ0JBQVksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDL0QsZ0JBQVksQ0FBQyxLQUFLLElBQUksV0FBVyxDQUFBO0dBQ2xDLENBQUE7O0FBRUQsTUFBSSxhQUFhLEdBQUcsVUFBQyxLQUFLO1dBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQUEsQ0FBQTs7QUFFOUMsTUFBSSxZQUFZLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDNUIsZ0JBQVksQ0FBQyxFQUFFLEVBQ2IsWUFBWSxFQUNaLGNBQWMsRUFDZCxlQUFlLEVBQ2YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ2pCLGdCQUFZLENBQ1YsRUFBRSxFQUNGLGlCQUFpQixFQUNqQixtQkFBbUIsRUFDbkIsbUJBQW1CLEVBQ25CLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUNyQixNQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuRCxNQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN0RSxNQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFBO0dBQ2pFLENBQUE7O0FBRUQsTUFBSSxVQUFVLEdBQUcsVUFBQyxLQUFLO1dBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQUEsQ0FBQTs7QUFFM0MsTUFBSSxTQUFTLEdBQUcsVUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFLO0FBQ2xDLE1BQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUN0QyxnQkFBWSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7Ozs7QUFJdEUsZ0JBQVksQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDcEYsTUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFBO0dBQzdELENBQUE7O0FBRUQsTUFBSSxDQUFDLFlBQVksR0FBRztXQUFNLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7R0FBQSxDQUFBOztBQUUvRCxNQUFJLENBQUMsYUFBYSxHQUFHO1dBQU0sYUFBYSxDQUFDLFlBQVksQ0FBQztHQUFBLENBQUE7O0FBRXRELE1BQUksQ0FBQyxNQUFNLEdBQUcsWUFBTTtBQUNsQixNQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBOzs7QUFHN0IsTUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQTs7QUFFNUIsTUFBRSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDakQscUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBOzs7QUFHcEMsTUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQTs7QUFFN0IsTUFBRSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDbEQsZ0JBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQTtHQUMzQixDQUFBO0NBQ0Y7Ozs7O1dDM05pQixPQUFPLENBQUMsU0FBUyxDQUFDOztJQUEvQixTQUFTLFFBQVQsU0FBUztBQUNkLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQzVDLElBQUksS0FBSyxHQUFVLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUNyQyxJQUFJLE1BQU0sR0FBUyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDdEMsSUFBSSxVQUFVLEdBQUssT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQzFDLElBQUksV0FBVyxHQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUMzQyxJQUFJLEtBQUssR0FBVSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDckMsSUFBSSxXQUFXLEdBQUksT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7QUFDbEQsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7O0FBRTVDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBOzs7QUFHckIsU0FBUyxJQUFJLENBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQ3pELFdBQVcsRUFBRSxZQUFZLEVBQUU7QUFDeEMsV0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUN2QixXQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3ZCLFdBQVMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUE7QUFDckMsV0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUN6QixXQUFTLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQy9CLFdBQVMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUE7QUFDbkMsV0FBUyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuQyxXQUFTLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFBOztBQUVyQyxNQUFJLENBQUMsS0FBSyxHQUFVLEtBQUssQ0FBQTtBQUN6QixNQUFJLENBQUMsS0FBSyxHQUFVLEtBQUssQ0FBQTtBQUN6QixNQUFJLENBQUMsTUFBTSxHQUFTLE1BQU0sQ0FBQTtBQUMxQixNQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTtBQUNoQyxNQUFJLENBQUMsUUFBUSxHQUFPLFFBQVEsQ0FBQTtBQUM1QixNQUFJLENBQUMsV0FBVyxHQUFJLFdBQVcsQ0FBQTtBQUMvQixNQUFJLENBQUMsV0FBVyxHQUFJLFdBQVcsQ0FBQTtBQUMvQixNQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTs7O0FBR2hDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUNuRSxRQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0dBQ3hDO0NBQ0Y7O0FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBWTtBQUNqQyxNQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQTs7QUFFOUMsU0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbkQsWUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFDLEdBQUc7V0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0dBQUEsQ0FBQyxDQUFBO0NBQzFELENBQUE7O0FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsWUFBWSxFQUVqQyxDQUFBOzs7OztXQ2hEaUIsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7SUFBL0IsU0FBUyxRQUFULFNBQVM7QUFDZCxJQUFJLGVBQWUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQTs7QUFFbEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUE7OztBQUc3QixTQUFTLFlBQVksQ0FBRSxlQUFlLEVBQUU7QUFDdEMsV0FBUyxDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQTtBQUMzQyxNQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQTtDQUN2Qzs7Ozs7QUNURCxNQUFNLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQTs7QUFFaEMsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFBOztBQUVyQixTQUFTLGVBQWUsQ0FBRSxRQUFRLEVBQUU7QUFDbEMsTUFBSSxPQUFPLEdBQVMsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDN0MsTUFBSSxTQUFTLEdBQU8sSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDN0MsTUFBSSxPQUFPLEdBQVMsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDN0MsTUFBSSxhQUFhLEdBQUcsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7O0FBRTlDLE1BQUksYUFBYSxHQUFHLGdCQUFlO1FBQWIsT0FBTyxRQUFQLE9BQU87QUFDM0IsYUFBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3RDLFdBQU8sQ0FBQyxPQUFPLENBQUMsR0FBSyxJQUFJLENBQUE7R0FDMUIsQ0FBQTs7QUFFRCxNQUFJLFdBQVcsR0FBRyxpQkFBZTtRQUFiLE9BQU8sU0FBUCxPQUFPO0FBQ3pCLFdBQU8sQ0FBQyxPQUFPLENBQUMsR0FBSyxJQUFJLENBQUE7QUFDekIsV0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFLLEtBQUssQ0FBQTtHQUMzQixDQUFBOztBQUVELE1BQUksVUFBVSxHQUFHLFlBQU07QUFDckIsUUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7O0FBRVYsV0FBTyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUU7QUFDdEIsYUFBTyxDQUFDLENBQUMsQ0FBQyxHQUFLLENBQUMsQ0FBQTtBQUNoQixlQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2hCLGFBQU8sQ0FBQyxDQUFDLENBQUMsR0FBSyxDQUFDLENBQUE7S0FDakI7R0FDRixDQUFBOztBQUVELE1BQUksQ0FBQyxPQUFPLEdBQVMsT0FBTyxDQUFBO0FBQzVCLE1BQUksQ0FBQyxPQUFPLEdBQVMsT0FBTyxDQUFBO0FBQzVCLE1BQUksQ0FBQyxTQUFTLEdBQU8sU0FBUyxDQUFBO0FBQzlCLE1BQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFBOztBQUVsQyxNQUFJLENBQUMsSUFBSSxHQUFHLFVBQUMsRUFBRSxFQUFLO0FBQ2xCLFFBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBOztBQUVWLFdBQU8sRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFO0FBQ3RCLGVBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUE7QUFDcEIsYUFBTyxDQUFDLENBQUMsQ0FBQyxHQUFLLEtBQUssQ0FBQTtBQUNwQixVQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBLEtBQ3RCLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDckM7R0FDRixDQUFBOztBQUVELFVBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFDbkQsVUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUMvQyxVQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0NBQzlDOzs7OztBQ2pERCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7O0FBRWhDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUE7O0FBRXhDLFNBQVMsdUJBQXVCLEdBQUk7QUFDbEMsUUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0NBQzlCOztBQUVELHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFO0FBQ2pFLE1BQUksRUFBRSxHQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQTtBQUM3QixNQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFLLENBQUMsQ0FBQyxDQUFBO0FBQ1osTUFBSSxHQUFHLENBQUE7QUFDUCxNQUFJLFFBQVEsQ0FBQTtBQUNaLE1BQUksWUFBWSxDQUFBO0FBQ2hCLE1BQUksV0FBVyxDQUFBO0FBQ2YsTUFBSSxZQUFZLENBQUE7QUFDaEIsTUFBSSxTQUFTLENBQUE7QUFDYixNQUFJLFNBQVMsQ0FBQTtBQUNiLE1BQUksYUFBYSxDQUFBOztBQUVqQixTQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNoQixPQUFHLEdBQWEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzNCLGdCQUFZLEdBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQTtBQUNoRCxlQUFXLEdBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQTtBQUMzQyxnQkFBWSxHQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7QUFDaEQsYUFBUyxHQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDN0UsWUFBUSxHQUFRLEdBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUE7QUFDNUMsYUFBUyxHQUFPLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDN0IsaUJBQWEsR0FBRyxTQUFTLElBQUksQ0FBQyxDQUFBOztBQUU5QixRQUFJLGFBQWEsRUFBRTtBQUNqQixTQUFHLENBQUMsTUFBTSxDQUFDLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3hFLFNBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEdBQU8sU0FBUyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUE7S0FDbEUsTUFBTTtBQUNMLFNBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFBO0tBQ3pDO0dBQ0Y7Q0FDRixDQUFBOzs7OztBQ3RDRCxTQUFTLE1BQU0sR0FBSTs7QUFDakIsTUFBSSxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUEsQ0FBQTs7QUFFL0IsTUFBSSxPQUFPLEdBQUcsVUFBQyxJQUFJLEVBQUs7QUFDdEIsV0FBTyxVQUFVLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDekIsVUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7O0FBRW5ELFVBQUksR0FBRyxHQUFHLElBQUksY0FBYyxFQUFBLENBQUE7O0FBRTVCLFNBQUcsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBQ3ZCLFNBQUcsQ0FBQyxNQUFNLEdBQVM7ZUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUM7T0FBQSxDQUFBO0FBQy9DLFNBQUcsQ0FBQyxPQUFPLEdBQVE7ZUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUM7T0FBQSxDQUFBO0FBQ2hFLFNBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMzQixTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ2YsQ0FBQTtHQUNGLENBQUE7O0FBRUQsTUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ3ZDLE1BQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFbEMsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7O0FBRTVCLE1BQUksQ0FBQyxXQUFXLEdBQUcsVUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFLO0FBQy9CLFFBQUksQ0FBQyxHQUFTLElBQUksS0FBSyxFQUFBLENBQUE7QUFDdkIsUUFBSSxNQUFNLEdBQUk7YUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUFBLENBQUE7QUFDL0IsUUFBSSxPQUFPLEdBQUc7YUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FBQSxDQUFBOztBQUUzRCxLQUFDLENBQUMsTUFBTSxHQUFJLE1BQU0sQ0FBQTtBQUNsQixLQUFDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtBQUNuQixLQUFDLENBQUMsR0FBRyxHQUFPLElBQUksQ0FBQTtHQUNqQixDQUFBOztBQUVELE1BQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFLO0FBQzdCLGNBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFLO0FBQ2hDLFVBQUksYUFBYSxHQUFHLFVBQUMsTUFBTTtlQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO09BQUEsQ0FBQTtBQUNoRCxVQUFJLGFBQWEsR0FBRyxFQUFFLENBQUE7O0FBRXRCLGNBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQTtLQUMvRCxDQUFDLENBQUE7R0FDSCxDQUFBOztBQUVELE1BQUksQ0FBQyxVQUFVLEdBQUcsZ0JBQThCLEVBQUUsRUFBSztRQUFuQyxNQUFNLFFBQU4sTUFBTTtRQUFFLFFBQVEsUUFBUixRQUFRO1FBQUUsT0FBTyxRQUFQLE9BQU87QUFDM0MsUUFBSSxTQUFTLEdBQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUE7QUFDNUMsUUFBSSxXQUFXLEdBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUE7QUFDOUMsUUFBSSxVQUFVLEdBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUE7QUFDN0MsUUFBSSxVQUFVLEdBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQTtBQUNuQyxRQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JDLFFBQUksV0FBVyxHQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUE7QUFDcEMsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxDQUFDLEdBQWMsQ0FBQyxDQUFDLENBQUE7QUFDckIsUUFBSSxHQUFHLEdBQVk7QUFDakIsWUFBTSxFQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFO0tBQ3JDLENBQUE7O0FBRUQsUUFBSSxTQUFTLEdBQUcsWUFBTTtBQUNwQixVQUFJLFVBQVUsSUFBSSxDQUFDLElBQUksWUFBWSxJQUFJLENBQUMsSUFBSSxXQUFXLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7S0FDNUUsQ0FBQTs7QUFFRCxRQUFJLGFBQWEsR0FBRyxVQUFDLElBQUksRUFBRSxJQUFJLEVBQUs7QUFDbEMsZ0JBQVUsRUFBRSxDQUFBO0FBQ1osU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7QUFDdkIsZUFBUyxFQUFFLENBQUE7S0FDWixDQUFBOztBQUVELFFBQUksZUFBZSxHQUFHLFVBQUMsSUFBSSxFQUFFLElBQUksRUFBSztBQUNwQyxrQkFBWSxFQUFFLENBQUE7QUFDZCxTQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUN6QixlQUFTLEVBQUUsQ0FBQTtLQUNaLENBQUE7O0FBRUQsUUFBSSxjQUFjLEdBQUcsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFLO0FBQ25DLGlCQUFXLEVBQUUsQ0FBQTtBQUNiLFNBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ3hCLGVBQVMsRUFBRSxDQUFBO0tBQ1osQ0FBQTs7QUFFRCxXQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFOztBQUNyQixZQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUE7O0FBRXRCLGNBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUs7QUFDekMsdUJBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDekIsQ0FBQyxDQUFBOztLQUNIO0FBQ0QsV0FBTyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTs7QUFDdkIsWUFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUV4QixjQUFLLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFLO0FBQzdDLHlCQUFlLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1NBQzNCLENBQUMsQ0FBQTs7S0FDSDtBQUNELFdBQU8sVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7O0FBQ3RCLFlBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQTs7QUFFdkIsY0FBSyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUMzQyx3QkFBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUMxQixDQUFDLENBQUE7O0tBQ0g7R0FDRixDQUFBO0NBQ0Y7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7Ozs7O0FDckd2QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7O0FBRWhDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUE7O0FBRWxDLFNBQVMsaUJBQWlCLEdBQUk7QUFDNUIsUUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFBO0NBQ25EOztBQUVELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxLQUFLLEVBQUUsUUFBUSxFQUFFO01BQ3RELEtBQUssR0FBa0IsS0FBSyxDQUFDLElBQUksQ0FBakMsS0FBSztNQUFFLFlBQVksR0FBSSxLQUFLLENBQUMsSUFBSSxDQUExQixZQUFZO01BQ25CLGVBQWUsR0FBSSxZQUFZLENBQS9CLGVBQWU7QUFDcEIsTUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFBO0FBQ2pCLE1BQUksTUFBTSxHQUFNLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTs7O0FBRzNCLE1BQUksQ0FBQyxNQUFNLEVBQUUsT0FBTTs7QUFFbkIsTUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFBO0FBQ3pFLE1BQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxHQUFHLFNBQVMsQ0FBQTtDQUMxRSxDQUFBOzs7OztBQ25CRCxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTs7QUFFeEIsU0FBUyxPQUFPLENBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUU7QUFDakQsTUFBSSxDQUFDLFFBQVEsR0FBTyxRQUFRLENBQUE7QUFDNUIsTUFBSSxDQUFDLE9BQU8sR0FBUSxPQUFPLENBQUE7QUFDM0IsTUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7Q0FDakM7Ozs7O0FDTkQsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBOztBQUVoQyxNQUFNLENBQUMsT0FBTyxHQUFHLHNCQUFzQixDQUFBOztBQUV2QyxTQUFTLHNCQUFzQixHQUFJO0FBQ2pDLFFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7Q0FDMUM7O0FBRUQsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxVQUFVLEtBQUssRUFBRSxRQUFRLEVBQUU7TUFDM0QsUUFBUSxHQUFJLEtBQUssQ0FBQyxJQUFJLENBQXRCLFFBQVE7QUFDYixNQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFLLENBQUMsQ0FBQyxDQUFBO0FBQ1osTUFBSSxHQUFHLENBQUE7O0FBRVAsVUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFBOztBQUV4QixTQUFPLEVBQUcsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNqQixPQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUVqQixZQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7R0FDekY7Q0FDRixDQUFBOzs7OztBQ3JCRCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTs7QUFFdEIsU0FBUyxLQUFLLENBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUM3QixNQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQTs7QUFFL0QsTUFBSSxDQUFDLElBQUksR0FBTSxJQUFJLENBQUE7QUFDbkIsTUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7QUFDdEIsTUFBSSxDQUFDLElBQUksR0FBTSxJQUFJLENBQUE7Q0FDcEI7O0FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsVUFBVSxFQUFFLEVBQUU7QUFDcEMsSUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUNmLENBQUE7O0FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxFQUFFLEVBQUU7QUFDckMsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUE7QUFDakMsTUFBSSxHQUFHLEdBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7QUFDL0IsTUFBSSxDQUFDLEdBQU8sQ0FBQyxDQUFDLENBQUE7QUFDZCxNQUFJLE1BQU0sQ0FBQTs7QUFFVixTQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUNoQixVQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN4QixVQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0dBQ3JEO0NBQ0YsQ0FBQTs7Ozs7V0N4QmlCLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0lBQW5DLFNBQVMsUUFBVCxTQUFTOzs7QUFFZCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQTs7QUFFN0IsU0FBUyxZQUFZLENBQUUsT0FBTSxFQUFLO01BQVgsT0FBTSxnQkFBTixPQUFNLEdBQUMsRUFBRTtBQUM5QixNQUFJLE9BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQTs7QUFFMUUsTUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUE7QUFDeEIsTUFBSSxPQUFNLEdBQWEsT0FBTSxDQUFBOztBQUU3QixNQUFJLENBQUMsTUFBTSxHQUFRLE9BQU0sQ0FBQTtBQUN6QixNQUFJLENBQUMsV0FBVyxHQUFHLE9BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBOztBQUUzQyxNQUFJLENBQUMsWUFBWSxHQUFHLFVBQVUsU0FBUyxFQUFFO0FBQ3ZDLFFBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU0sQ0FBQyxDQUFBOztBQUVoRCxRQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLDRCQUE0QixDQUFDLENBQUE7O0FBRXJFLG9CQUFnQixHQUFHLE9BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDeEMsUUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUE7R0FDekIsQ0FBQTs7QUFFRCxNQUFJLENBQUMsT0FBTyxHQUFHLFlBQVk7QUFDekIsUUFBSSxLQUFLLEdBQUcsT0FBTSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFBOztBQUV4QyxRQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFNLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO0dBQzlDLENBQUE7Q0FDRjs7Ozs7QUM3QkQsSUFBSSxNQUFNLEdBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBOztBQUVqQyxNQUFNLENBQUMsT0FBTyxHQUFHLHFCQUFxQixDQUFBOztBQUV0QyxTQUFTLHFCQUFxQixHQUFJO0FBQ2hDLFFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7Q0FDekM7O0FBRUQscUJBQXFCLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxVQUFVLEtBQUssRUFBRSxRQUFRLEVBQUU7TUFDMUQsUUFBUSxHQUFJLEtBQUssQ0FBQyxJQUFJLENBQXRCLFFBQVE7QUFDYixNQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFLLENBQUMsQ0FBQyxDQUFBO0FBQ1osTUFBSSxHQUFHLENBQUE7QUFDUCxNQUFJLEtBQUssQ0FBQTs7QUFFVCxVQUFRLENBQUMsWUFBWSxFQUFFLENBQUE7O0FBRXZCLFNBQU8sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFO0FBQ2hCLE9BQUcsR0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDbkIsU0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQTs7QUFFNUUsWUFBUSxDQUFDLFNBQVMsQ0FDaEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQ2hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNqQixHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFDbEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ2IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUNyQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQ3RDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUN2QyxDQUFBO0dBQ0Y7Q0FDRixDQUFBOzs7OztBQ2pDRCxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTs7QUFFdkIsU0FBUyxNQUFNLENBQUUsY0FBYyxFQUFLO01BQW5CLGNBQWMsZ0JBQWQsY0FBYyxHQUFDLEVBQUU7QUFDaEMsTUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7Q0FDckM7OztBQUdELE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUVqRCxDQUFBOzs7OztXQ1RxQyxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUF6RCxNQUFNLFFBQU4sTUFBTTtJQUFFLEtBQUssUUFBTCxLQUFLO0lBQUUsT0FBTyxRQUFQLE9BQU87SUFBRSxLQUFLLFFBQUwsS0FBSztBQUNsQyxJQUFJLGlCQUFpQixHQUFTLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQzVELElBQUkscUJBQXFCLEdBQUssT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUE7QUFDaEUsSUFBSSxzQkFBc0IsR0FBSSxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQTtBQUNqRSxJQUFJLHVCQUF1QixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO0FBQ2xFLElBQUksS0FBSyxHQUFxQixPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7O0FBRWhELE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFBOztBQUUxQixTQUFTLFNBQVMsR0FBSTtBQUNwQixNQUFJLE9BQU8sR0FBRyxDQUNaLElBQUksaUJBQWlCLEVBQUEsRUFDckIsSUFBSSx1QkFBdUIsRUFBQSxFQUMzQixJQUFJLHNCQUFzQixFQUFBLEVBQzFCLElBQUkscUJBQXFCLEVBQUEsQ0FDMUIsQ0FBQTs7QUFFRCxPQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7Q0FDbEM7O0FBRUQsU0FBUyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFFcEQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsVUFBVSxFQUFFLEVBQUU7TUFDbkMsS0FBSyxHQUFzQyxJQUFJLENBQUMsSUFBSSxDQUFwRCxLQUFLO01BQUUsTUFBTSxHQUE4QixJQUFJLENBQUMsSUFBSSxDQUE3QyxNQUFNO01BQUUsV0FBVyxHQUFpQixJQUFJLENBQUMsSUFBSSxDQUFyQyxXQUFXO01BQUUsV0FBVyxHQUFJLElBQUksQ0FBQyxJQUFJLENBQXhCLFdBQVc7TUFDdkMsRUFBRSxHQUFJLFdBQVcsQ0FBQyxRQUFRLENBQTFCLEVBQUU7QUFDUCxNQUFJLE1BQU0sR0FBRzs7QUFFWCxZQUFRLEVBQUU7QUFDUixZQUFNLEVBQUcsaUNBQWlDO0FBQzFDLFlBQU0sRUFBRyxpQ0FBaUM7QUFDMUMsYUFBTyxFQUFFLGdDQUFnQztLQUMxQztHQUNGLENBQUE7O0FBRUQsUUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxHQUFHLEVBQUUsWUFBWSxFQUFFO1FBQ2hELFFBQVEsR0FBWSxZQUFZLENBQWhDLFFBQVE7UUFBRSxNQUFNLEdBQUksWUFBWSxDQUF0QixNQUFNOzs7QUFFckIsU0FBSyxDQUFDLE1BQU0sR0FBSyxNQUFNLENBQUE7QUFDdkIsU0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7O0FBRXpCLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDM0IsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDM0UsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDM0UsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDM0UsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDM0UsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7S0FDNUU7O0FBRUQsZUFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDckUsZUFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDdEUsZUFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTs7O0FBR3hELE1BQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtHQUNULENBQUMsQ0FBQTtDQUNILENBQUE7Ozs7O0FDdkRELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7QUFFbEMsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUE7O0FBRTdCLElBQU0saUJB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QyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFBQkIgKHcsIGgsIHgsIHkpIHtcclxuICB0aGlzLnggPSB4XHJcbiAgdGhpcy55ID0geVxyXG4gIHRoaXMudyA9IHdcclxuICB0aGlzLmggPSBoXHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseFwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB4IH0gXHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHlcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geSB9IFxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ4XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHggKyB3IH1cclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeVwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB5ICsgaCB9XHJcbiAgfSlcclxufVxyXG4iLCJsZXQgQUFCQiA9IHJlcXVpcmUoXCIuL0FBQkJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uXHJcblxyXG5mdW5jdGlvbiBGcmFtZSAoYWFiYiwgZHVyYXRpb24pIHtcclxuICB0aGlzLmFhYmIgICAgID0gYWFiYlxyXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxyXG59XHJcblxyXG4vL3JhdGUgaXMgaW4gbXMuICBUaGlzIGlzIHRoZSB0aW1lIHBlciBmcmFtZSAoNDIgfiAyNGZwcylcclxuZnVuY3Rpb24gQW5pbWF0aW9uIChmcmFtZXMsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgdGhpcy5sb29wICAgPSBkb2VzTG9vcFxyXG4gIHRoaXMucmF0ZSAgID0gcmF0ZVxyXG4gIHRoaXMuZnJhbWVzID0gZnJhbWVzXHJcbn1cclxuXHJcbkFuaW1hdGlvbi5jcmVhdGVMaW5lYXIgPSBmdW5jdGlvbiAodywgaCwgeCwgeSwgY291bnQsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgbGV0IGZyYW1lcyA9IFtdXHJcbiAgbGV0IGkgICAgICA9IC0xXHJcbiAgbGV0IGVhY2hYXHJcbiAgbGV0IGFhYmJcclxuXHJcbiAgd2hpbGUgKCsraSA8IGNvdW50KSB7XHJcbiAgICBlYWNoWCA9IHggKyBpICogd1xyXG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcclxuICAgIGZyYW1lcy5wdXNoKG5ldyBGcmFtZShhYWJiLCByYXRlKSlcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgQW5pbWF0aW9uKGZyYW1lcywgZG9lc0xvb3AsIHJhdGUpXHJcbn1cclxuXHJcbkFuaW1hdGlvbi5jcmVhdGVTaW5nbGUgPSBmdW5jdGlvbiAodywgaCwgeCwgeSwgcmF0ZT00Mykge1xyXG4gIGxldCBhYWJiICAgPSBuZXcgQUFCQih3LCBoLCB4LCB5KVxyXG4gIGxldCBmcmFtZXMgPSBbbmV3IEZyYW1lKGFhYmIsIHJhdGUpXVxyXG5cclxuICByZXR1cm4gbmV3IEFuaW1hdGlvbihmcmFtZXMsIHRydWUsIHJhdGUpXHJcbn1cclxuIiwiZnVuY3Rpb24gQ2hhbm5lbCAoY29udGV4dCwgbmFtZSkge1xyXG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcclxuICBcclxuICBsZXQgY29ubmVjdFBhbm5lciA9IGZ1bmN0aW9uIChzcmMsIHBhbm5lciwgY2hhbikge1xyXG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxyXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXHJcbiAgfVxyXG5cclxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xyXG4gICAgbGV0IHNob3VsZExvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2VcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XHJcbiAgICAgIGxldCBzcmMgPSBjaGFubmVsLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkgXHJcblxyXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxyXG4gICAgICBlbHNlICAgICAgICBzcmMuY29ubmVjdChjaGFubmVsKVxyXG5cclxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcclxuICAgICAgc3JjLmJ1ZmZlciA9IGJ1ZmZlclxyXG4gICAgICBzcmMuc3RhcnQoMClcclxuICAgICAgcmV0dXJuIHNyY1xyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGNoYW5uZWwuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxyXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cclxuICB9KVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cclxuICB9KVxyXG5cclxuICB0aGlzLm5hbWUgPSBuYW1lXHJcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxyXG4gIHRoaXMucGxheSA9IGJhc2VQbGF5KClcclxufVxyXG5cclxuZnVuY3Rpb24gQXVkaW9TeXN0ZW0gKGNoYW5uZWxOYW1lcykge1xyXG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcclxuICBsZXQgY2hhbm5lbHMgPSB7fVxyXG4gIGxldCBpICAgICAgICA9IC0xXHJcblxyXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xyXG4gICAgY2hhbm5lbHNbY2hhbm5lbE5hbWVzW2ldXSA9IG5ldyBDaGFubmVsKGNvbnRleHQsIGNoYW5uZWxOYW1lc1tpXSlcclxuICB9XHJcbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXHJcbiAgdGhpcy5jaGFubmVscyA9IGNoYW5uZWxzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXVkaW9TeXN0ZW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcclxuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXHJcblxyXG5mdW5jdGlvbiBDbG9jayAodGltZUZuPURhdGUubm93KSB7XHJcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcclxuICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKVxyXG4gIHRoaXMuZFQgPSAwXHJcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vbGRUaW1lID0gdGhpcy5uZXdUaW1lXHJcbiAgICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKSAgXHJcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcclxuICB9XHJcbn1cclxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XHJcbiIsImxldCB7aGFzS2V5c30gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcclxuXHJcbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xyXG4gIHRoaXMuZW50aXRpZXMgID0gW11cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcbn1cclxuXHJcbkVudGl0eVN0b3JlLnByb3RvdHlwZS5hZGRFbnRpdHkgPSBmdW5jdGlvbiAoZSkge1xyXG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXHJcblxyXG4gIHRoaXMuZW50aXRpZXMucHVzaChlKVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcclxuICBsZXQgaSA9IC0xXHJcbiAgbGV0IGVudGl0eVxyXG5cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcblxyXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcclxuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cclxuICAgIGlmIChoYXNLZXlzKGNvbXBvbmVudE5hbWVzLCBlbnRpdHkpKSB0aGlzLmxhc3RRdWVyeS5wdXNoKGVudGl0eSlcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XHJcbn1cclxuIiwibGV0IHtzcHJpdGVWZXJ0ZXhTaGFkZXIsIHNwcml0ZUZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcclxubGV0IHtwb2x5Z29uVmVydGV4U2hhZGVyLCBwb2x5Z29uRnJhZ21lbnRTaGFkZXJ9ID0gcmVxdWlyZShcIi4vZ2wtc2hhZGVyc1wiKVxyXG5sZXQge3NldEJveH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxyXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxyXG5cclxuY29uc3QgUE9JTlRfRElNRU5TSU9OICAgICA9IDJcclxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcclxuY29uc3QgUE9JTlRTX1BFUl9CT1ggICAgICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXHJcbmNvbnN0IE1BWF9WRVJURVhfQ09VTlQgICAgPSAxMDAwMDAwXHJcblxyXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxyXG59XHJcblxyXG4vL3RleHR1cmUgY29vcmRzIGFyZSBpbml0aWFsaXplZCB0byAwIC0+IDEgdGV4dHVyZSBjb29yZCBzcGFjZVxyXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcclxuICAgIHNldEJveChhciwgaSwgMSwgMSwgMCwgMClcclxuICB9IFxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBJbmRleEFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShzaXplKVxyXG59XHJcblxyXG5mdW5jdGlvbiBWZXJ0ZXhBcnJheSAoc2l6ZSkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiBQT0lOVF9ESU1FTlNJT04pXHJcbn1cclxuXHJcbi8vNCBmb3IgciwgZywgYiwgYVxyXG5mdW5jdGlvbiBWZXJ0ZXhDb2xvckFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSAqIDQpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcml0ZUJhdGNoIChzaXplKSB7XHJcbiAgdGhpcy5jb3VudCAgICAgID0gMFxyXG4gIHRoaXMuYm94ZXMgICAgICA9IEJveEFycmF5KHNpemUpXHJcbiAgdGhpcy5jZW50ZXJzICAgID0gQ2VudGVyQXJyYXkoc2l6ZSlcclxuICB0aGlzLnNjYWxlcyAgICAgPSBTY2FsZUFycmF5KHNpemUpXHJcbiAgdGhpcy5yb3RhdGlvbnMgID0gUm90YXRpb25BcnJheShzaXplKVxyXG4gIHRoaXMudGV4Q29vcmRzICA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KHNpemUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb25CYXRjaCAoc2l6ZSkge1xyXG4gIHRoaXMuaW5kZXggICAgICAgID0gMFxyXG4gIHRoaXMuaW5kaWNlcyAgICAgID0gSW5kZXhBcnJheShzaXplKVxyXG4gIHRoaXMudmVydGljZXMgICAgID0gVmVydGV4QXJyYXkoc2l6ZSlcclxuICB0aGlzLnZlcnRleENvbG9ycyA9IFZlcnRleENvbG9yQXJyYXkoc2l6ZSlcclxufVxyXG5cclxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gMTAwXHJcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXHJcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxyXG4gIGxldCBzdnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgc3ByaXRlVmVydGV4U2hhZGVyKVxyXG4gIGxldCBzZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBzcHJpdGVGcmFnbWVudFNoYWRlcilcclxuICBsZXQgcHZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHBvbHlnb25WZXJ0ZXhTaGFkZXIpXHJcbiAgbGV0IHBmcyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIHBvbHlnb25GcmFnbWVudFNoYWRlcilcclxuICBsZXQgc3ByaXRlUHJvZ3JhbSAgPSBQcm9ncmFtKGdsLCBzdnMsIHNmcylcclxuICBsZXQgcG9seWdvblByb2dyYW0gPSBQcm9ncmFtKGdsLCBwdnMsIHBmcylcclxuXHJcbiAgLy9TcHJpdGUgc2hhZGVyIGJ1ZmZlcnNcclxuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcblxyXG4gIC8vcG9seWdvbiBzaGFkZXIgYnVmZmVyc1xyXG4gIGxldCB2ZXJ0ZXhCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHZlcnRleENvbG9yQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgaW5kZXhCdWZmZXIgICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG5cclxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXHJcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfcG9zaXRpb25cIilcclxuICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNwcml0ZVByb2dyYW0sIFwiYV90ZXhDb29yZFwiKVxyXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXHJcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxyXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcclxuXHJcbiAgbGV0IHZlcnRleExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJhX3ZlcnRleFwiKVxyXG4gIGxldCB2ZXJ0ZXhDb2xvckxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwiYV92ZXJ0ZXhDb2xvclwiKVxyXG5cclxuICAvL1VuaWZvcm0gbG9jYXRpb25zXHJcbiAgbGV0IHdvcmxkU2l6ZVNwcml0ZUxvY2F0aW9uICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXHJcbiAgbGV0IHdvcmxkU2l6ZVBvbHlnb25Mb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxyXG5cclxuICBsZXQgaW1hZ2VUb1RleHR1cmVNYXAgPSBuZXcgTWFwKClcclxuICBsZXQgdGV4dHVyZVRvQmF0Y2hNYXAgPSBuZXcgTWFwKClcclxuICBsZXQgcG9seWdvbkJhdGNoICAgICAgPSBuZXcgUG9seWdvbkJhdGNoKE1BWF9WRVJURVhfQ09VTlQpXHJcblxyXG4gIGdsLmVuYWJsZShnbC5CTEVORClcclxuICBnbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKVxyXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXHJcbiAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAwLjApXHJcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuXHJcbiAgdGhpcy5kaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcclxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuc2V0KHRleHR1cmUsIG5ldyBTcHJpdGVCYXRjaChtYXhTcHJpdGVDb3VudCkpXHJcbiAgICByZXR1cm4gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHRleHR1cmUpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcclxuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcclxuXHJcbiAgICBpbWFnZVRvVGV4dHVyZU1hcC5zZXQoaW1hZ2UsIHRleHR1cmUpXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSlcclxuICAgIHJldHVybiB0ZXh0dXJlXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XHJcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XHJcbiAgICBsZXQgdGFyZ2V0UmF0aW8gPSB3aWR0aCAvIGhlaWdodFxyXG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cclxuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxyXG4gICAgbGV0IG5ld0hlaWdodCAgID0gdXNlV2lkdGggPyAod2lkdGggLyByYXRpbykgOiBoZWlnaHRcclxuXHJcbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gbmV3SGVpZ2h0IFxyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkU3ByaXRlID0gKGltYWdlLCB3LCBoLCB4LCB5LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KSA9PiB7XHJcbiAgICBsZXQgdHggICAgPSBpbWFnZVRvVGV4dHVyZU1hcC5nZXQoaW1hZ2UpIHx8IHRoaXMuYWRkVGV4dHVyZShpbWFnZSlcclxuICAgIGxldCBiYXRjaCA9IHRleHR1cmVUb0JhdGNoTWFwLmdldCh0eCkgfHwgdGhpcy5hZGRCYXRjaCh0eClcclxuXHJcbiAgICBzZXRCb3goYmF0Y2guYm94ZXMsIGJhdGNoLmNvdW50LCB3LCBoLCB4LCB5KVxyXG4gICAgc2V0Qm94KGJhdGNoLnRleENvb3JkcywgYmF0Y2guY291bnQsIHRleHcsIHRleGgsIHRleHgsIHRleHkpXHJcbiAgICBiYXRjaC5jb3VudCsrXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFBvbHlnb24gPSAodmVydGljZXMsIGluZGljZXMsIHZlcnRleENvbG9ycykgPT4ge1xyXG4gICAgbGV0IHZlcnRleENvdW50ID0gaW5kaWNlcy5sZW5ndGhcclxuXHJcbiAgICBwb2x5Z29uQmF0Y2gudmVydGljZXMuc2V0KHZlcnRpY2VzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kaWNlcy5zZXQoaW5kaWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRleENvbG9ycy5zZXQodmVydGV4Q29sb3JzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kZXggKz0gdmVydGV4Q291bnRcclxuICB9XHJcblxyXG4gIGxldCByZXNldFBvbHlnb25zID0gKGJhdGNoKSA9PiBiYXRjaC5pbmRleCA9IDBcclxuXHJcbiAgbGV0IGRyYXdQb2x5Z29ucyA9IChiYXRjaCkgPT4ge1xyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBcclxuICAgICAgdmVydGV4QnVmZmVyLCBcclxuICAgICAgdmVydGV4TG9jYXRpb24sIFxyXG4gICAgICBQT0lOVF9ESU1FTlNJT04sIFxyXG4gICAgICBiYXRjaC52ZXJ0aWNlcylcclxuICAgIHVwZGF0ZUJ1ZmZlcihcclxuICAgICAgZ2wsIFxyXG4gICAgICB2ZXJ0ZXhDb2xvckJ1ZmZlciwgXHJcbiAgICAgIHZlcnRleENvbG9yTG9jYXRpb24sIFxyXG4gICAgICBDT0xPUl9DSEFOTkVMX0NPVU5ULCBcclxuICAgICAgYmF0Y2gudmVydGV4Q29sb3JzKVxyXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kZXhCdWZmZXIpXHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBiYXRjaC5pbmRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpXHJcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBiYXRjaC5pbmRleCwgZ2wuVU5TSUdORURfU0hPUlQsIDApXHJcbiAgfVxyXG5cclxuICBsZXQgcmVzZXRCYXRjaCA9IChiYXRjaCkgPT4gYmF0Y2guY291bnQgPSAwXHJcblxyXG4gIGxldCBkcmF3QmF0Y2ggPSAoYmF0Y2gsIHRleHR1cmUpID0+IHtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2guYm94ZXMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgY2VudGVyQnVmZmVyLCBjZW50ZXJMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBjZW50ZXJzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgdGV4Q29vcmRCdWZmZXIsIHRleENvb3JkTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2gudGV4Q29vcmRzKVxyXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGJhdGNoLmNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbiAgfVxyXG5cclxuICB0aGlzLmZsdXNoU3ByaXRlcyA9ICgpID0+IHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2gocmVzZXRCYXRjaClcclxuXHJcbiAgdGhpcy5mbHVzaFBvbHlnb25zID0gKCkgPT4gcmVzZXRQb2x5Z29ucyhwb2x5Z29uQmF0Y2gpXHJcblxyXG4gIHRoaXMucmVuZGVyID0gKCkgPT4ge1xyXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcclxuXHJcbiAgICAvL1Nwcml0ZXNoZWV0IGJhdGNoIHJlbmRlcmluZ1xyXG4gICAgZ2wudXNlUHJvZ3JhbShzcHJpdGVQcm9ncmFtKVxyXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcclxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiwgMTkyMCwgMTA4MClcclxuICAgIHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2goZHJhd0JhdGNoKVxyXG5cclxuICAgIC8vcG9sZ29uIHJlbmRlcmluZ1xyXG4gICAgZ2wudXNlUHJvZ3JhbShwb2x5Z29uUHJvZ3JhbSlcclxuICAgIC8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXHJcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplUG9seWdvbkxvY2F0aW9uLCAxOTIwLCAxMDgwKVxyXG4gICAgZHJhd1BvbHlnb25zKHBvbHlnb25CYXRjaClcclxuICB9XHJcbn1cclxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IElucHV0TWFuYWdlciA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgQ2xvY2sgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXHJcblxyXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxyXG5mdW5jdGlvbiBHYW1lIChjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLCByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIFxyXG4gICAgICAgICAgICAgICBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcclxuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxyXG4gIGNoZWNrVHlwZShpbnB1dE1hbmFnZXIsIElucHV0TWFuYWdlcilcclxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXHJcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxyXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXHJcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcclxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXHJcblxyXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcclxuICB0aGlzLmNhY2hlICAgICAgICA9IGNhY2hlIFxyXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXHJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXHJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcclxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxyXG5cclxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXHJcblxyXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXHJcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0TWFuYWdlclxyXG5cclxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xyXG5mdW5jdGlvbiBJbnB1dE1hbmFnZXIgKGtleWJvYXJkTWFuYWdlcikge1xyXG4gIGNoZWNrVHlwZShrZXlib2FyZE1hbmFnZXIsIEtleWJvYXJkTWFuYWdlcilcclxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxyXG5cclxuY29uc3QgS0VZX0NPVU5UID0gMjU2XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XHJcbiAgbGV0IGlzRG93bnMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGRvd25EdXJhdGlvbnMgPSBuZXcgVWludDMyQXJyYXkoS0VZX0NPVU5UKVxyXG4gIFxyXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdERvd25zW2tleUNvZGVdID0gIWlzRG93bnNba2V5Q29kZV1cclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcclxuICAgICAganVzdERvd25zW2ldID0gMFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXHJcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xyXG4gIHRoaXMuanVzdERvd25zICAgICA9IGp1c3REb3duc1xyXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcclxuXHJcbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcclxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcclxuICAgICAgaWYgKGlzRG93bnNbaV0pIGRvd25EdXJhdGlvbnNbaV0gKz0gZFRcclxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxyXG59XHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJzcHJpdGVcIl0pXHJcbn1cclxuXHJcbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IGRUICA9IHNjZW5lLmdhbWUuY2xvY2suZFRcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCB0aW1lTGVmdFxyXG4gIGxldCBjdXJyZW50SW5kZXhcclxuICBsZXQgY3VycmVudEFuaW1cclxuICBsZXQgY3VycmVudEZyYW1lXHJcbiAgbGV0IG5leHRGcmFtZVxyXG4gIGxldCBvdmVyc2hvb3RcclxuICBsZXQgc2hvdWxkQWR2YW5jZVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBlbnQgICAgICAgICAgID0gZW50aXRpZXNbaV0gXHJcbiAgICBjdXJyZW50SW5kZXggID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXhcclxuICAgIGN1cnJlbnRBbmltICAgPSBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb25cclxuICAgIGN1cnJlbnRGcmFtZSAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4XVxyXG4gICAgbmV4dEZyYW1lICAgICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXggKyAxXSB8fCBjdXJyZW50QW5pbS5mcmFtZXNbMF1cclxuICAgIHRpbWVMZWZ0ICAgICAgPSBlbnQuc3ByaXRlLnRpbWVUaWxsTmV4dEZyYW1lXHJcbiAgICBvdmVyc2hvb3QgICAgID0gdGltZUxlZnQgLSBkVCAgIFxyXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXHJcbiAgICAgIFxyXG4gICAgaWYgKHNob3VsZEFkdmFuY2UpIHtcclxuICAgICAgZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXggPSBjdXJyZW50QW5pbS5mcmFtZXMuaW5kZXhPZihuZXh0RnJhbWUpXHJcbiAgICAgIGVudC5zcHJpdGUudGltZVRpbGxOZXh0RnJhbWUgICAgID0gbmV4dEZyYW1lLmR1cmF0aW9uICsgb3ZlcnNob290IFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcclxuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XHJcblxyXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcclxuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcclxuXHJcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXHJcblxyXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxyXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxyXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcclxuICAgICAgeGhyLnNlbmQobnVsbClcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxyXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxyXG5cclxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXHJcblxyXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXHJcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXHJcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICBcclxuICAgIGkub25sb2FkICA9IG9ubG9hZFxyXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxyXG4gICAgaS5zcmMgICAgID0gcGF0aFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XHJcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxyXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXHJcblxyXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxyXG4gICAgfSkgXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xyXG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcclxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcclxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxyXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcclxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcclxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxyXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcclxuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XHJcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNvdW5kQ291bnQtLVxyXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICB0ZXh0dXJlQ291bnQtLVxyXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc2hhZGVyQ291bnQtLVxyXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcclxuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XHJcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxyXG5cclxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcclxuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cclxuXHJcbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBQYWRkbGVNb3ZlclN5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXHJcbn1cclxuXHJcblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtjbG9jaywgaW5wdXRNYW5hZ2VyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQge2tleWJvYXJkTWFuYWdlcn0gPSBpbnB1dE1hbmFnZXJcclxuICBsZXQgbW92ZVNwZWVkID0gMVxyXG4gIGxldCBwYWRkbGUgICAgPSBlbnRpdGllc1swXVxyXG5cclxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcclxuICBpZiAoIXBhZGRsZSkgcmV0dXJuXHJcblxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzldKSBwYWRkbGUucGh5c2ljcy54ICs9IGNsb2NrLmRUICogbW92ZVNwZWVkXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBQb2x5Z29uXHJcblxyXG5mdW5jdGlvbiBQb2x5Z29uICh2ZXJ0aWNlcywgaW5kaWNlcywgdmVydGV4Q29sb3JzKSB7XHJcbiAgdGhpcy52ZXJ0aWNlcyAgICAgPSB2ZXJ0aWNlc1xyXG4gIHRoaXMuaW5kaWNlcyAgICAgID0gaW5kaWNlc1xyXG4gIHRoaXMudmVydGV4Q29sb3JzID0gdmVydGV4Q29sb3JzXHJcbn1cclxuXHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9seWdvblJlbmRlcmluZ1N5c3RlbVxyXG5cclxuZnVuY3Rpb24gUG9seWdvblJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBvbHlnb25cIl0pXHJcbn1cclxuXHJcblBvbHlnb25SZW5kZXJpbmdTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG5cclxuICByZW5kZXJlci5mbHVzaFBvbHlnb25zKClcclxuICBcclxuICB3aGlsZSAoKysgaSA8IGxlbikge1xyXG4gICAgZW50ID0gZW50aXRpZXNbaV0gXHJcbiAgICAvL1RPRE86IHZlcnRpY2VzIHNob3VsZCBiZSBpbiBsb2NhbCBjb29yZHMuICBOZWVkIHRvIHRyYW5zbGF0ZSB0byBnbG9iYWxcclxuICAgIHJlbmRlcmVyLmFkZFBvbHlnb24oZW50LnBvbHlnb24udmVydGljZXMsIGVudC5wb2x5Z29uLmluZGljZXMsIGVudC5wb2x5Z29uLnZlcnRleENvbG9ycylcclxuICB9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxyXG5cclxuZnVuY3Rpb24gU2NlbmUgKG5hbWUsIHN5c3RlbXMpIHtcclxuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxyXG5cclxuICB0aGlzLm5hbWUgICAgPSBuYW1lXHJcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xyXG4gIHRoaXMuZ2FtZSAgICA9IG51bGxcclxufVxyXG5cclxuU2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgY2IobnVsbCwgbnVsbCkgIFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRUKSB7XHJcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGxlbiAgID0gdGhpcy5zeXN0ZW1zLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IHN5c3RlbVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXHJcbiAgICBzeXN0ZW0ucnVuKHRoaXMsIHN0b3JlLnF1ZXJ5KHN5c3RlbS5jb21wb25lbnROYW1lcykpXHJcbiAgfVxyXG59XHJcbiIsImxldCB7ZmluZFdoZXJlfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcclxuXHJcbmZ1bmN0aW9uIFNjZW5lTWFuYWdlciAoc2NlbmVzPVtdKSB7XHJcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxyXG5cclxuICBsZXQgYWN0aXZlU2NlbmVJbmRleCA9IDBcclxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xyXG5cclxuICB0aGlzLnNjZW5lcyAgICAgID0gc2NlbmVzXHJcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxyXG5cclxuICB0aGlzLnRyYW5zaXRpb25UbyA9IGZ1bmN0aW9uIChzY2VuZU5hbWUpIHtcclxuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKHNjZW5lTmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHNjZW5lIG5hbWVcIilcclxuXHJcbiAgICBhY3RpdmVTY2VuZUluZGV4ID0gc2NlbmVzLmluZGV4T2Yoc2NlbmUpXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVcclxuICB9XHJcblxyXG4gIHRoaXMuYWR2YW5jZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb3JlIHNjZW5lcyFcIilcclxuXHJcbiAgICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzWysrYWN0aXZlU2NlbmVJbmRleF1cclxuICB9XHJcbn1cclxuIiwibGV0IFN5c3RlbSAgPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3ByaXRlUmVuZGVyaW5nU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBTcHJpdGVSZW5kZXJpbmdTeXN0ZW0gKCkge1xyXG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJzcHJpdGVcIl0pXHJcbn1cclxuXHJcblNwcml0ZVJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xyXG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxyXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcclxuICBsZXQgaSAgID0gLTFcclxuICBsZXQgZW50XHJcbiAgbGV0IGZyYW1lXHJcblxyXG4gIHJlbmRlcmVyLmZsdXNoU3ByaXRlcygpXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIGVudCAgID0gZW50aXRpZXNbaV1cclxuICAgIGZyYW1lID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uLmZyYW1lc1tlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb25JbmRleF1cclxuXHJcbiAgICByZW5kZXJlci5hZGRTcHJpdGUoXHJcbiAgICAgIGVudC5zcHJpdGUuaW1hZ2UsXHJcbiAgICAgIGVudC5waHlzaWNzLndpZHRoLFxyXG4gICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXHJcbiAgICAgIGVudC5waHlzaWNzLngsXHJcbiAgICAgIGVudC5waHlzaWNzLnksXHJcbiAgICAgIGZyYW1lLmFhYmIudyAvIGVudC5zcHJpdGUuaW1hZ2Uud2lkdGgsXHJcbiAgICAgIGZyYW1lLmFhYmIuaCAvIGVudC5zcHJpdGUuaW1hZ2UuaGVpZ2h0LFxyXG4gICAgICBmcmFtZS5hYWJiLnggLyBlbnQuc3ByaXRlLmltYWdlLndpZHRoLFxyXG4gICAgICBmcmFtZS5hYWJiLnkgLyBlbnQuc3ByaXRlLmltYWdlLmhlaWdodFxyXG4gICAgKVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbVxyXG5cclxuZnVuY3Rpb24gU3lzdGVtIChjb21wb25lbnROYW1lcz1bXSkge1xyXG4gIHRoaXMuY29tcG9uZW50TmFtZXMgPSBjb21wb25lbnROYW1lc1xyXG59XHJcblxyXG4vL3NjZW5lLmdhbWUuY2xvY2tcclxuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgLy9kb2VzIHNvbWV0aGluZyB3LyB0aGUgbGlzdCBvZiBlbnRpdGllcyBwYXNzZWQgdG8gaXRcclxufVxyXG4iLCJsZXQge1BhZGRsZSwgQmxvY2ssIEZpZ2h0ZXIsIFdhdGVyfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXHJcbmxldCBQYWRkbGVNb3ZlclN5c3RlbSAgICAgICA9IHJlcXVpcmUoXCIuL1BhZGRsZU1vdmVyU3lzdGVtXCIpXHJcbmxldCBTcHJpdGVSZW5kZXJpbmdTeXN0ZW0gICA9IHJlcXVpcmUoXCIuL1Nwcml0ZVJlbmRlcmluZ1N5c3RlbVwiKVxyXG5sZXQgUG9seWdvblJlbmRlcmluZ1N5c3RlbSAgPSByZXF1aXJlKFwiLi9Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtXCIpXHJcbmxldCBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSA9IHJlcXVpcmUoXCIuL0tleWZyYW1lQW5pbWF0aW9uU3lzdGVtXCIpXHJcbmxldCBTY2VuZSAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxyXG5cclxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcclxuICBsZXQgc3lzdGVtcyA9IFtcclxuICAgIG5ldyBQYWRkbGVNb3ZlclN5c3RlbSwgXHJcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXHJcbiAgICBuZXcgUG9seWdvblJlbmRlcmluZ1N5c3RlbSxcclxuICAgIG5ldyBTcHJpdGVSZW5kZXJpbmdTeXN0ZW0sXHJcbiAgXVxyXG5cclxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxyXG59XHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZSwgYXVkaW9TeXN0ZW19ID0gdGhpcy5nYW1lIFxyXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcclxuICBsZXQgYXNzZXRzID0ge1xyXG4gICAgLy9zb3VuZHM6IHsgYmdNdXNpYzogXCIvcHVibGljL3NvdW5kcy9iZ20xLm1wM1wiIH0sXHJcbiAgICB0ZXh0dXJlczogeyBcclxuICAgICAgcGFkZGxlOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIsXHJcbiAgICAgIGJsb2NrczogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvYmxvY2tzLnBuZ1wiLFxyXG4gICAgICBmaWdodGVyOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3B1bmNoLnBuZ1wiXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xyXG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcclxuXHJcbiAgICBjYWNoZS5zb3VuZHMgICA9IHNvdW5kc1xyXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjA7ICsraSkge1xyXG4gICAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEJsb2NrKHRleHR1cmVzLmJsb2NrcywgOTAsIDQ1LCA2MCArIDkwICogaSwgMTAwKSkgXHJcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxNDUpKSBcclxuICAgICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBCbG9jayh0ZXh0dXJlcy5ibG9ja3MsIDkwLCA0NSwgNjAgKyA5MCAqIGksIDE5MCkpIFxyXG4gICAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEJsb2NrKHRleHR1cmVzLmJsb2NrcywgOTAsIDQ1LCA2MCArIDkwICogaSwgMjM1KSkgXHJcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAyODApKSBcclxuICAgIH1cclxuXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDYwMCwgNjAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgRmlnaHRlcih0ZXh0dXJlcy5maWdodGVyLCA3NiwgNTksIDUwMCwgNTAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgV2F0ZXIoMTkyMCwgMjgwLCAwLCA4MDAsIDEwMCkpXHJcbiAgICAvL2JnLnZvbHVtZSA9IDBcclxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcclxuICAgIGNiKG51bGwpXHJcbiAgfSlcclxufVxyXG4iLCJsZXQgUG9seWdvbiA9IHJlcXVpcmUoXCIuL1BvbHlnb25cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2F0ZXJQb2x5Z29uXHJcblxyXG5jb25zdCBQT0lOVFNfUEVSX1ZFUlRFWCAgID0gMlxyXG5jb25zdCBDT0xPUl9DSEFOTkVMX0NPVU5UID0gNFxyXG5jb25zdCBJTkRJQ0VTX1BFUl9RVUFEICAgID0gNlxyXG5jb25zdCBRVUFEX1ZFUlRFWF9TSVpFICAgID0gOFxyXG5cclxuZnVuY3Rpb24gc2V0VmVydGV4ICh2ZXJ0aWNlcywgaW5kZXgsIHgsIHkpIHtcclxuICBsZXQgaSA9IGluZGV4ICogUE9JTlRTX1BFUl9WRVJURVhcclxuXHJcbiAgdmVydGljZXNbaV0gICA9IHhcclxuICB2ZXJ0aWNlc1tpKzFdID0geVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRDb2xvciAoY29sb3JzLCBpbmRleCwgY29sb3IpIHtcclxuICBsZXQgaSA9IGluZGV4ICogQ09MT1JfQ0hBTk5FTF9DT1VOVFxyXG5cclxuICBjb2xvcnMuc2V0KGNvbG9yLCBpKVxyXG59XHJcblxyXG5mdW5jdGlvbiBXYXRlclBvbHlnb24gKHcsIGgsIHgsIHksIHNsaWNlQ291bnQsIHRvcENvbG9yLCBib3R0b21Db2xvcikge1xyXG4gIGxldCB2ZXJ0ZXhDb3VudCAgPSAyICsgKHNsaWNlQ291bnQgKiAyKVxyXG4gIGxldCB2ZXJ0aWNlcyAgICAgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRleENvdW50ICogUE9JTlRTX1BFUl9WRVJURVgpXHJcbiAgbGV0IHZlcnRleENvbG9ycyA9IG5ldyBGbG9hdDMyQXJyYXkodmVydGV4Q291bnQgKiBDT0xPUl9DSEFOTkVMX0NPVU5UKVxyXG4gIGxldCBpbmRpY2VzICAgICAgPSBuZXcgVWludDE2QXJyYXkoSU5ESUNFU19QRVJfUVVBRCAqIHNsaWNlQ291bnQpXHJcbiAgbGV0IHVuaXRXaWR0aCAgICA9IHcgLyBzbGljZUNvdW50XHJcbiAgbGV0IGkgICAgICAgICAgICA9IC0xXHJcbiAgbGV0IGogICAgICAgICAgICA9IC0xXHJcblxyXG4gIHdoaWxlICggKytpIDw9IHNsaWNlQ291bnQgKSB7XHJcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGksICh4ICsgdW5pdFdpZHRoICogaSksIHkpXHJcbiAgICBzZXRDb2xvcih2ZXJ0ZXhDb2xvcnMsIGksIHRvcENvbG9yKVxyXG4gICAgc2V0VmVydGV4KHZlcnRpY2VzLCBpICsgc2xpY2VDb3VudCArIDEsICh4ICsgdW5pdFdpZHRoICogaSksIHkgKyBoKVxyXG4gICAgc2V0Q29sb3IodmVydGV4Q29sb3JzLCBpICsgc2xpY2VDb3VudCArIDEsIGJvdHRvbUNvbG9yKVxyXG4gIH1cclxuXHJcbiAgd2hpbGUgKCArKyBqIDwgc2xpY2VDb3VudCApIHtcclxuICAgIGluZGljZXNbaipJTkRJQ0VTX1BFUl9RVUFEXSAgID0gaiArIDFcclxuICAgIGluZGljZXNbaipJTkRJQ0VTX1BFUl9RVUFEKzFdID0galxyXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMl0gPSBqICsgMSArIHNsaWNlQ291bnRcclxuICAgIGluZGljZXNbaipJTkRJQ0VTX1BFUl9RVUFEKzNdID0gaiArIDFcclxuICAgIGluZGljZXNbaipJTkRJQ0VTX1BFUl9RVUFEKzRdID0gaiArIDEgKyBzbGljZUNvdW50XHJcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCs1XSA9IGogKyAyICsgc2xpY2VDb3VudFxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBQb2x5Z29uKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpXHJcbn1cclxuIiwibGV0IHtQaHlzaWNzLCBQbGF5ZXJDb250cm9sbGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcclxubGV0IHtTcHJpdGUsIFBvbHlnb259ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxyXG5sZXQgQW5pbWF0aW9uICAgID0gcmVxdWlyZShcIi4vQW5pbWF0aW9uXCIpXHJcbmxldCBFbnRpdHkgICAgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcclxubGV0IFdhdGVyUG9seWdvbiA9IHJlcXVpcmUoXCIuL1dhdGVyUG9seWdvblwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMuUGFkZGxlICA9IFBhZGRsZVxyXG5tb2R1bGUuZXhwb3J0cy5CbG9jayAgID0gQmxvY2tcclxubW9kdWxlLmV4cG9ydHMuRmlnaHRlciA9IEZpZ2h0ZXJcclxubW9kdWxlLmV4cG9ydHMuV2F0ZXIgICA9IFdhdGVyXHJcblxyXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XHJcbiAgRW50aXR5LmNhbGwodGhpcylcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxyXG4gIFNwcml0ZSh0aGlzLCB3LCBoLCBpbWFnZSwgXCJpZGxlXCIsIHtcclxuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVTaW5nbGUoMTEyLCAyNSwgMCwgMClcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBTcHJpdGUodGhpcywgdywgaCwgaW1hZ2UsIFwiaWRsZVwiLCB7XHJcbiAgICBpZGxlOiBBbmltYXRpb24uY3JlYXRlTGluZWFyKDQ0LCAyMiwgMCwgMCwgMywgdHJ1ZSwgMTAwMClcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBGaWdodGVyIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIFNwcml0ZSh0aGlzLCB3LCBoLCBpbWFnZSwgXCJmaXJlYmFsbFwiLCB7XHJcbiAgICBmaXJlYmFsbDogQW5pbWF0aW9uLmNyZWF0ZUxpbmVhcigxNzQsIDEzNCwgMCwgMCwgMjUsIHRydWUpXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gV2F0ZXIgKHcsIGgsIHgsIHksIHNsaWNlQ291bnQsIHRvcENvbG9yLCBib3R0b21Db2xvcikge1xyXG4gIGxldCB0b3BDb2xvciAgICA9IHRvcENvbG9yIHx8IFswLCAwLCAuNSwgLjVdXHJcbiAgbGV0IGJvdHRvbUNvbG9yID0gYm90dG9tQ29sb3IgfHwgWy43LCAuNywgLjgsIC45XVxyXG5cclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIC8vVE9ETzogUG9seWdvbnMgc2hvdWxkIHN0b3JlIGxvY2FsIGNvb3JkaW5hdGVzXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIFBvbHlnb24odGhpcywgV2F0ZXJQb2x5Z29uKHcsIGgsIHgsIHksIHNsaWNlQ291bnQsIHRvcENvbG9yLCBib3R0b21Db2xvcikpXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuUGh5c2ljcyAgICAgICAgICA9IFBoeXNpY3NcclxubW9kdWxlLmV4cG9ydHMuUGxheWVyQ29udHJvbGxlZCA9IFBsYXllckNvbnRyb2xsZWRcclxubW9kdWxlLmV4cG9ydHMuU3ByaXRlICAgICAgICAgICA9IFNwcml0ZVxyXG5tb2R1bGUuZXhwb3J0cy5Qb2x5Z29uICAgICAgICAgID0gUG9seWdvblxyXG5cclxuZnVuY3Rpb24gU3ByaXRlIChlLCB3aWR0aCwgaGVpZ2h0LCBpbWFnZSwgY3VycmVudEFuaW1hdGlvbk5hbWUsIGFuaW1hdGlvbnMpIHtcclxuICBlLnNwcml0ZSA9IHtcclxuICAgIHdpZHRoLFxyXG4gICAgaGVpZ2h0LFxyXG4gICAgaW1hZ2UsXHJcbiAgICBhbmltYXRpb25zLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbk5hbWUsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uSW5kZXg6IDAsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1hdGlvbnNbY3VycmVudEFuaW1hdGlvbk5hbWVdLFxyXG4gICAgdGltZVRpbGxOZXh0RnJhbWU6ICAgICBhbmltYXRpb25zW2N1cnJlbnRBbmltYXRpb25OYW1lXS5mcmFtZXNbMF0uZHVyYXRpb25cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb24gKGUsIHBvbHlnb24pIHtcclxuICBlLnBvbHlnb24gPSBwb2x5Z29uXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcclxuICBlLnBoeXNpY3MgPSB7XHJcbiAgICB3aWR0aCwgXHJcbiAgICBoZWlnaHQsIFxyXG4gICAgeCwgXHJcbiAgICB5LCBcclxuICAgIGR4OiAgMCwgXHJcbiAgICBkeTogIDAsIFxyXG4gICAgZGR4OiAwLCBcclxuICAgIGRkeTogMFxyXG4gIH1cclxuICByZXR1cm4gZVxyXG59XHJcblxyXG5mdW5jdGlvbiBQbGF5ZXJDb250cm9sbGVkIChlKSB7XHJcbiAgZS5wbGF5ZXJDb250cm9sbGVkID0gdHJ1ZVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzLmZpbmRXaGVyZSA9IGZpbmRXaGVyZVxyXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXHJcblxyXG4vLzo6IFt7fV0gLT4gU3RyaW5nIC0+IE1heWJlIEFcclxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xyXG4gIGxldCBsZW4gICA9IGFycmF5T2ZPYmplY3RzLmxlbmd0aFxyXG4gIGxldCBpICAgICA9IC0xXHJcbiAgbGV0IGZvdW5kID0gbnVsbFxyXG5cclxuICB3aGlsZSAoICsraSA8IGxlbiApIHtcclxuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xyXG4gICAgICBmb3VuZCA9IGFycmF5T2ZPYmplY3RzW2ldXHJcbiAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmb3VuZFxyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNLZXlzIChrZXlzLCBvYmopIHtcclxuICBsZXQgaSA9IC0xXHJcbiAgXHJcbiAgd2hpbGUgKGtleXNbKytpXSkgaWYgKCFvYmpba2V5c1tpXV0pIHJldHVybiBmYWxzZVxyXG4gIHJldHVybiB0cnVlXHJcbn1cclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gQnVmZmVyIC0+IEludCAtPiBJbnQgLT4gRmxvYXQzMkFycmF5XHJcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxyXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXHJcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxyXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMudXBkYXRlQnVmZmVyID0gdXBkYXRlQnVmZmVyXHJcbiIsIm1vZHVsZS5leHBvcnRzLnNwcml0ZVZlcnRleFNoYWRlciA9IFwiIFxcXHJcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxyXG4gIFxcXHJcbiAgYXR0cmlidXRlIHZlYzIgYV9wb3NpdGlvbjsgXFxcclxuICBhdHRyaWJ1dGUgdmVjMiBhX3RleENvb3JkOyBcXFxyXG4gIFxcXHJcbiAgdW5pZm9ybSB2ZWMyIHVfd29ybGRTaXplOyBcXFxyXG4gIFxcXHJcbiAgdmFyeWluZyB2ZWMyIHZfdGV4Q29vcmQ7IFxcXHJcbiAgXFxcclxuICB2ZWMyIG5vcm0gKHZlYzIgcG9zaXRpb24pIHsgXFxcclxuICAgIHJldHVybiBwb3NpdGlvbiAqIDIuMCAtIDEuMDsgXFxcclxuICB9IFxcXHJcbiAgXFxcclxuICB2b2lkIG1haW4oKSB7IFxcXHJcbiAgICBtYXQyIGNsaXBTcGFjZSAgICAgPSBtYXQyKDEuMCwgMC4wLCAwLjAsIC0xLjApOyBcXFxyXG4gICAgdmVjMiBmcm9tV29ybGRTaXplID0gYV9wb3NpdGlvbiAvIHVfd29ybGRTaXplOyBcXFxyXG4gICAgdmVjMiBwb3NpdGlvbiAgICAgID0gY2xpcFNwYWNlICogbm9ybShmcm9tV29ybGRTaXplKTsgXFxcclxuICAgIFxcXHJcbiAgICB2X3RleENvb3JkICA9IGFfdGV4Q29vcmQ7IFxcXHJcbiAgICBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zaXRpb24sIDAsIDEpOyBcXFxyXG4gIH1cIlxyXG5cclxubW9kdWxlLmV4cG9ydHMuc3ByaXRlRnJhZ21lbnRTaGFkZXIgPSBcIlxcXHJcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxyXG4gIFxcXHJcbiAgdW5pZm9ybSBzYW1wbGVyMkQgdV9pbWFnZTsgXFxcclxuICBcXFxyXG4gIHZhcnlpbmcgdmVjMiB2X3RleENvb3JkOyBcXFxyXG4gIFxcXHJcbiAgdm9pZCBtYWluKCkgeyBcXFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVfaW1hZ2UsIHZfdGV4Q29vcmQpOyBcXFxyXG4gIH1cIlxyXG5cclxubW9kdWxlLmV4cG9ydHMucG9seWdvblZlcnRleFNoYWRlciA9IFwiXFxcclxuICBhdHRyaWJ1dGUgdmVjMiBhX3ZlcnRleDsgXFxcclxuICBhdHRyaWJ1dGUgdmVjNCBhX3ZlcnRleENvbG9yOyBcXFxyXG4gIHVuaWZvcm0gdmVjMiB1X3dvcmxkU2l6ZTsgXFxcclxuICB2YXJ5aW5nIHZlYzQgdl92ZXJ0ZXhDb2xvcjsgXFxcclxuICB2ZWMyIG5vcm0gKHZlYzIgcG9zaXRpb24pIHsgXFxcclxuICAgIHJldHVybiBwb3NpdGlvbiAqIDIuMCAtIDEuMDsgXFxcclxuICB9IFxcXHJcbiAgdm9pZCBtYWluICgpIHsgXFxcclxuICAgIG1hdDIgY2xpcFNwYWNlICAgICA9IG1hdDIoMS4wLCAwLjAsIDAuMCwgLTEuMCk7IFxcXHJcbiAgICB2ZWMyIGZyb21Xb3JsZFNpemUgPSBhX3ZlcnRleCAvIHVfd29ybGRTaXplOyBcXFxyXG4gICAgdmVjMiBwb3NpdGlvbiAgICAgID0gY2xpcFNwYWNlICogbm9ybShmcm9tV29ybGRTaXplKTsgXFxcclxuICAgIFxcXHJcbiAgICB2X3ZlcnRleENvbG9yID0gYV92ZXJ0ZXhDb2xvcjsgXFxcclxuICAgIGdsX1Bvc2l0aW9uICAgPSB2ZWM0KHBvc2l0aW9uLCAwLCAxKTsgXFxcclxuICB9XCJcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBvbHlnb25GcmFnbWVudFNoYWRlciA9IFwiXFxcclxuICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7IFxcXHJcbiAgXFxcclxuICB2YXJ5aW5nIHZlYzQgdl92ZXJ0ZXhDb2xvcjsgXFxcclxuICBcXFxyXG4gIHZvaWQgbWFpbigpIHsgXFxcclxuICAgIGdsX0ZyYWdDb2xvciA9IHZfdmVydGV4Q29sb3I7IFxcXHJcbiAgfVwiXHJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxyXG5mdW5jdGlvbiBTaGFkZXIgKGdsLCB0eXBlLCBzcmMpIHtcclxuICBsZXQgc2hhZGVyICA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKVxyXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcclxuICBcclxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXHJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXHJcblxyXG4gIGlzVmFsaWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUylcclxuXHJcbiAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgdmFsaWQgc2hhZGVyOiBcXG5cIiArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSlcclxuICByZXR1cm4gICAgICAgIHNoYWRlclxyXG59XHJcblxyXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBWZXJ0ZXhTaGFkZXIgLT4gRnJhZ21lbnRTaGFkZXJcclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xyXG4gIGxldCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSh2cywgZnMpXHJcblxyXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcclxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpXHJcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcclxuICByZXR1cm4gcHJvZ3JhbVxyXG59XHJcblxyXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXHJcbmZ1bmN0aW9uIFRleHR1cmUgKGdsKSB7XHJcbiAgbGV0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcblxyXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXHJcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgcmV0dXJuIHRleHR1cmVcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuU2hhZGVyICA9IFNoYWRlclxyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxyXG5tb2R1bGUuZXhwb3J0cy5UZXh0dXJlID0gVGV4dHVyZVxyXG4iLCJsZXQgTG9hZGVyICAgICAgICAgID0gcmVxdWlyZShcIi4vTG9hZGVyXCIpXHJcbmxldCBHTFJlbmRlcmVyICAgICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IENsb2NrICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0Nsb2NrXCIpXHJcbmxldCBDYWNoZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxyXG5sZXQgU2NlbmVNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXHJcbmxldCBUZXN0U2NlbmUgICAgICAgPSByZXF1aXJlKFwiLi9UZXN0U2NlbmVcIilcclxubGV0IEdhbWUgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcclxubGV0IElucHV0TWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcbmxldCBBdWRpb1N5c3RlbSAgICAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxyXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxyXG5cclxuY29uc3QgVVBEQVRFX0lOVEVSVkFMID0gMjVcclxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxyXG5cclxubGV0IGtleWJvYXJkTWFuYWdlciA9IG5ldyBLZXlib2FyZE1hbmFnZXIoZG9jdW1lbnQpXHJcbmxldCBpbnB1dE1hbmFnZXIgICAgPSBuZXcgSW5wdXRNYW5hZ2VyKGtleWJvYXJkTWFuYWdlcilcclxubGV0IGVudGl0eVN0b3JlICAgICA9IG5ldyBFbnRpdHlTdG9yZVxyXG5sZXQgY2xvY2sgICAgICAgICAgID0gbmV3IENsb2NrKERhdGUubm93KVxyXG5sZXQgY2FjaGUgICAgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxyXG5sZXQgbG9hZGVyICAgICAgICAgID0gbmV3IExvYWRlclxyXG5sZXQgcmVuZGVyZXIgICAgICAgID0gbmV3IEdMUmVuZGVyZXIoY2FudmFzLCAxOTIwLCAxMDgwKVxyXG5sZXQgYXVkaW9TeXN0ZW0gICAgID0gbmV3IEF1ZGlvU3lzdGVtKFtcIm1haW5cIiwgXCJiZ1wiXSlcclxubGV0IHNjZW5lTWFuYWdlciAgICA9IG5ldyBTY2VuZU1hbmFnZXIoW25ldyBUZXN0U2NlbmVdKVxyXG5sZXQgZ2FtZSAgICAgICAgICAgID0gbmV3IEdhbWUoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgZW50aXR5U3RvcmUsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVNYW5hZ2VyKVxyXG5cclxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ2FtZSkge1xyXG4gIGxldCBzdG9yZSAgICAgICAgICA9IGdhbWUuZW50aXR5U3RvcmVcclxuICBsZXQgY2xvY2sgICAgICAgICAgPSBnYW1lLmNsb2NrXHJcbiAgbGV0IGlucHV0TWFuYWdlciAgID0gZ2FtZS5pbnB1dE1hbmFnZXJcclxuICBsZXQgY29tcG9uZW50TmFtZXMgPSBbXCJyZW5kZXJhYmxlXCIsIFwicGh5c2ljc1wiXVxyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcclxuICAgIGNsb2NrLnRpY2soKVxyXG4gICAgaW5wdXRNYW5hZ2VyLmtleWJvYXJkTWFuYWdlci50aWNrKGNsb2NrLmRUKVxyXG4gICAgZ2FtZS5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmUudXBkYXRlKGNsb2NrLmRUKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdhbWUpIHtcclxuICByZXR1cm4gZnVuY3Rpb24gYW5pbWF0ZSAoKSB7XHJcbiAgICBnYW1lLnJlbmRlcmVyLnJlbmRlcigpXHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgIFxyXG4gIH1cclxufVxyXG5cclxud2luZG93LmdhbWUgPSBnYW1lXHJcblxyXG5mdW5jdGlvbiBzZXR1cERvY3VtZW50IChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpIHtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcclxuICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZW5kZXJlci5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodClcclxuICB9KVxyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgc2V0dXBEb2N1bWVudChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpXHJcbiAgZ2FtZS5zdGFydCgpXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdhbWUpKVxyXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSksIFVQREFURV9JTlRFUlZBTClcclxufSlcclxuIiwibW9kdWxlLmV4cG9ydHMuY2hlY2tUeXBlICAgICAgPSBjaGVja1R5cGVcclxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxyXG5tb2R1bGUuZXhwb3J0cy5zZXRCb3ggICAgICAgICA9IHNldEJveFxyXG5cclxuY29uc3QgUE9JTlRfRElNRU5TSU9OICAgICA9IDJcclxuY29uc3QgUE9JTlRTX1BFUl9CT1ggICAgICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXHJcblxyXG5mdW5jdGlvbiBjaGVja1R5cGUgKGluc3RhbmNlLCBjdG9yKSB7XHJcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBjdG9yKSkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBiZSBvZiB0eXBlIFwiICsgY3Rvci5uYW1lKVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1ZhbHVlVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKGluc3RhbmNlKVxyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIGNoZWNrVHlwZShpbnN0YW5jZVtrZXlzW2ldXSwgY3RvcilcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0Qm94IChib3hBcnJheSwgaW5kZXgsIHcsIGgsIHgsIHkpIHtcclxuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcclxuICBsZXQgeDEgPSB4XHJcbiAgbGV0IHkxID0geSBcclxuICBsZXQgeDIgPSB4ICsgd1xyXG4gIGxldCB5MiA9IHkgKyBoXHJcblxyXG4gIGJveEFycmF5W2ldICAgID0geDFcclxuICBib3hBcnJheVtpKzFdICA9IHkxXHJcbiAgYm94QXJyYXlbaSsyXSAgPSB4MVxyXG4gIGJveEFycmF5W2krM10gID0geTJcclxuICBib3hBcnJheVtpKzRdICA9IHgyXHJcbiAgYm94QXJyYXlbaSs1XSAgPSB5MVxyXG5cclxuICBib3hBcnJheVtpKzZdICA9IHgxXHJcbiAgYm94QXJyYXlbaSs3XSAgPSB5MlxyXG4gIGJveEFycmF5W2krOF0gID0geDJcclxuICBib3hBcnJheVtpKzldICA9IHkyXHJcbiAgYm94QXJyYXlbaSsxMF0gPSB4MlxyXG4gIGJveEFycmF5W2krMTFdID0geTFcclxufVxyXG4iXX0=
