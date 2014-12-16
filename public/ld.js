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

var _ref = require("./gl-shaders");

var spriteVertexShader = _ref.spriteVertexShader;
var spriteFragmentShader = _ref.spriteFragmentShader;
var _ref2 = require("./gl-shaders");

var polygonVertexShader = _ref2.polygonVertexShader;
var polygonFragmentShader = _ref2.polygonFragmentShader;
var _ref3 = require("./gl-types");

var Shader = _ref3.Shader;
var Program = _ref3.Program;
var Texture = _ref3.Texture;
var _ref4 = require("./gl-buffer");

var updateBuffer = _ref4.updateBuffer;


module.exports = GLRenderer;

var POINT_DIMENSION = 2;
var COLOR_CHANNEL_COUNT = 4;
var POINTS_PER_BOX = 6;
var BOX_LENGTH = POINT_DIMENSION * POINTS_PER_BOX;
var MAX_VERTEX_COUNT = 1000;

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

//texture coords are initialized to 0 -> 1 texture coord space
function TextureCoordinatesArray(count) {
  var ar = new Float32Array(count * BOX_LENGTH);

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    setBox(ar, i, 1, 1, 0, 0);
  }
  return ar;
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

  //vertices and vertexColors are arrays or typed arrays
  //[x0, y0, x1, y1, ...]
  //[r0, g0, b0, a0, ...]
  this.addPolygon = function (vertices, vertexColors) {
    var vertexCount = vertices.length / POINT_DIMENSION;

    polygonBatch.vertices.set(vertices, polygonBatch.index);
    polygonBatch.vertexColors.set(vertexColors, polygonBatch.index);
    polygonBatch.index += vertexCount;
  };

  var resetPolygons = function (batch) {
    return batch.index = 0;
  };

  var drawPolygons = function (batch) {
    updateBuffer(gl, vertexBuffer, vertexLocation, POINT_DIMENSION, polygonBatch.vertices);
    updateBuffer(gl, vertexColorBuffer, vertexColorLocation, COLOR_CHANNEL_COUNT, polygonBatch.vertexColors);
    gl.drawArrays(gl.TRIANGLES, 0, polygonBatch.index * POINTS_PER_BOX);
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
    resetPolygons(polygonBatch);
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
    gl.uniform2f(worldSizePolygonLocation, 1920, 1080);
    drawPolygons(polygonBatch);
  };
}

},{"./gl-buffer":23,"./gl-shaders":24,"./gl-types":25}],9:[function(require,module,exports){
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

function Polygon(vertices, vertexColors) {
  this.vertices = vertices;
  this.vertexColors = vertexColors;
}

//x0, y0, x1, y1, x2, y2...
var vertices = new Float32Array([0, 800, 1920, 800, 0, 1080, 1920, 800, 1920, 1080, 0, 1080]);

//r,g,b,a...
var vertexColors = new Float32Array([0, 0, 0.5, 0.6, //light
0, 0, 0.5, 0.6, //light
0, 0, 1, 1, 0, 0, 0.5, 0.6, //light
0, 0, 1, 1, 0, 0, 1, 1]);

//TODO: This is a hack to test polygon rendering
var polygon = new Polygon(vertices, vertexColors);

RenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;
  var len = entities.length;
  var i = -1;
  var ent;
  var frame;

  renderer.flush();

  //TODO: For testing of polygon rendering
  renderer.addPolygon(polygon.vertices, polygon.vertexColors);

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

function checkType(instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name);
}

function checkValueType(instance, ctor) {
  var keys = Object.keys(instance);

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor);
}

},{}]},{},[26])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtc2hhZGVycy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtB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LEdBQUcsQ0FBQyxDQUFBO0FBQ2QsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFZCxVQUFRLENBQUMsQ0FBQyxDQUFDLEdBQU0sRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBOztBQUVuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNwQjs7QUFFRCxTQUFTLFFBQVEsQ0FBRSxLQUFLLEVBQUU7QUFDeEIsU0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7Q0FDNUM7O0FBRUQsU0FBUyxXQUFXLENBQUUsS0FBSyxFQUFFO0FBQzNCLFNBQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFBO0NBQzVDOztBQUVELFNBQVMsVUFBVSxDQUFFLEtBQUssRUFBRTtBQUMxQixNQUFJLEVBQUUsR0FBRyxJQUFJLFlB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Q0FBQTtBQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7O0FBRTlDLFNBQVMsU0FBUyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDbEMsTUFBSSxDQUFDLENBQUMsUUFBUSxZQUFZLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0NBQ2pGOztBQUVELFNBQVMsY0FBYyxDQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTs7QUFFaEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUN6RSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFBQkIgKHcsIGgsIHgsIHkpIHtcclxuICB0aGlzLnggPSB4XHJcbiAgdGhpcy55ID0geVxyXG4gIHRoaXMudyA9IHdcclxuICB0aGlzLmggPSBoXHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseFwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB4IH0gXHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHlcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geSB9IFxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ4XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHggKyB3IH1cclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeVwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB5ICsgaCB9XHJcbiAgfSlcclxufVxyXG4iLCJsZXQgQUFCQiA9IHJlcXVpcmUoXCIuL0FBQkJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uXHJcblxyXG5mdW5jdGlvbiBGcmFtZSAoYWFiYiwgZHVyYXRpb24pIHtcclxuICB0aGlzLmFhYmIgICAgID0gYWFiYlxyXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxyXG59XHJcblxyXG4vL3JhdGUgaXMgaW4gbXMuICBUaGlzIGlzIHRoZSB0aW1lIHBlciBmcmFtZSAoNDIgfiAyNGZwcylcclxuZnVuY3Rpb24gQW5pbWF0aW9uIChmcmFtZXMsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgdGhpcy5sb29wICAgPSBkb2VzTG9vcFxyXG4gIHRoaXMucmF0ZSAgID0gcmF0ZVxyXG4gIHRoaXMuZnJhbWVzID0gZnJhbWVzXHJcbn1cclxuXHJcbkFuaW1hdGlvbi5jcmVhdGVMaW5lYXIgPSBmdW5jdGlvbiAodywgaCwgeCwgeSwgY291bnQsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgbGV0IGZyYW1lcyA9IFtdXHJcbiAgbGV0IGkgICAgICA9IC0xXHJcbiAgbGV0IGVhY2hYXHJcbiAgbGV0IGFhYmJcclxuXHJcbiAgd2hpbGUgKCsraSA8IGNvdW50KSB7XHJcbiAgICBlYWNoWCA9IHggKyBpICogd1xyXG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcclxuICAgIGZyYW1lcy5wdXNoKG5ldyBGcmFtZShhYWJiLCByYXRlKSlcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgQW5pbWF0aW9uKGZyYW1lcywgZG9lc0xvb3AsIHJhdGUpXHJcbn1cclxuIiwiZnVuY3Rpb24gQ2hhbm5lbCAoY29udGV4dCwgbmFtZSkge1xyXG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcclxuICBcclxuICBsZXQgY29ubmVjdFBhbm5lciA9IGZ1bmN0aW9uIChzcmMsIHBhbm5lciwgY2hhbikge1xyXG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxyXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXHJcbiAgfVxyXG5cclxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xyXG4gICAgbGV0IHNob3VsZExvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2VcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XHJcbiAgICAgIGxldCBzcmMgPSBjaGFubmVsLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkgXHJcblxyXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxyXG4gICAgICBlbHNlICAgICAgICBzcmMuY29ubmVjdChjaGFubmVsKVxyXG5cclxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcclxuICAgICAgc3JjLmJ1ZmZlciA9IGJ1ZmZlclxyXG4gICAgICBzcmMuc3RhcnQoMClcclxuICAgICAgcmV0dXJuIHNyY1xyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGNoYW5uZWwuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxyXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cclxuICB9KVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cclxuICB9KVxyXG5cclxuICB0aGlzLm5hbWUgPSBuYW1lXHJcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxyXG4gIHRoaXMucGxheSA9IGJhc2VQbGF5KClcclxufVxyXG5cclxuZnVuY3Rpb24gQXVkaW9TeXN0ZW0gKGNoYW5uZWxOYW1lcykge1xyXG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcclxuICBsZXQgY2hhbm5lbHMgPSB7fVxyXG4gIGxldCBpICAgICAgICA9IC0xXHJcblxyXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xyXG4gICAgY2hhbm5lbHNbY2hhbm5lbE5hbWVzW2ldXSA9IG5ldyBDaGFubmVsKGNvbnRleHQsIGNoYW5uZWxOYW1lc1tpXSlcclxuICB9XHJcbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXHJcbiAgdGhpcy5jaGFubmVscyA9IGNoYW5uZWxzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXVkaW9TeXN0ZW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcclxuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXHJcblxyXG5mdW5jdGlvbiBDbG9jayAodGltZUZuPURhdGUubm93KSB7XHJcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcclxuICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKVxyXG4gIHRoaXMuZFQgPSAwXHJcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vbGRUaW1lID0gdGhpcy5uZXdUaW1lXHJcbiAgICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKSAgXHJcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcclxuICB9XHJcbn1cclxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XHJcbiIsImxldCB7aGFzS2V5c30gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcclxuXHJcbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xyXG4gIHRoaXMuZW50aXRpZXMgID0gW11cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcbn1cclxuXHJcbkVudGl0eVN0b3JlLnByb3RvdHlwZS5hZGRFbnRpdHkgPSBmdW5jdGlvbiAoZSkge1xyXG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXHJcblxyXG4gIHRoaXMuZW50aXRpZXMucHVzaChlKVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcclxuICBsZXQgaSA9IC0xXHJcbiAgbGV0IGVudGl0eVxyXG5cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcblxyXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcclxuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cclxuICAgIGlmIChoYXNLZXlzKGNvbXBvbmVudE5hbWVzLCBlbnRpdHkpKSB0aGlzLmxhc3RRdWVyeS5wdXNoKGVudGl0eSlcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XHJcbn1cclxuIiwibGV0IHtzcHJpdGVWZXJ0ZXhTaGFkZXIsIHNwcml0ZUZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcclxubGV0IHtwb2x5Z29uVmVydGV4U2hhZGVyLCBwb2x5Z29uRnJhZ21lbnRTaGFkZXJ9ID0gcmVxdWlyZShcIi4vZ2wtc2hhZGVyc1wiKVxyXG5sZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxyXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxyXG5cclxuY29uc3QgUE9JTlRfRElNRU5TSU9OICAgICA9IDJcclxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcclxuY29uc3QgUE9JTlRTX1BFUl9CT1ggICAgICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXHJcbmNvbnN0IE1BWF9WRVJURVhfQ09VTlQgICAgPSAxMDAwXHJcblxyXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgdywgaCwgeCwgeSkge1xyXG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxyXG4gIGxldCB4MSA9IHhcclxuICBsZXQgeTEgPSB5IFxyXG4gIGxldCB4MiA9IHggKyB3XHJcbiAgbGV0IHkyID0geSArIGhcclxuXHJcbiAgYm94QXJyYXlbaV0gICAgPSB4MVxyXG4gIGJveEFycmF5W2krMV0gID0geTFcclxuICBib3hBcnJheVtpKzJdICA9IHgyXHJcbiAgYm94QXJyYXlbaSszXSAgPSB5MVxyXG4gIGJveEFycmF5W2krNF0gID0geDFcclxuICBib3hBcnJheVtpKzVdICA9IHkyXHJcblxyXG4gIGJveEFycmF5W2krNl0gID0geDFcclxuICBib3hBcnJheVtpKzddICA9IHkyXHJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxyXG4gIGJveEFycmF5W2krOV0gID0geTFcclxuICBib3hBcnJheVtpKzEwXSA9IHgyXHJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MlxyXG59XHJcblxyXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxyXG59XHJcblxyXG4vL3RleHR1cmUgY29vcmRzIGFyZSBpbml0aWFsaXplZCB0byAwIC0+IDEgdGV4dHVyZSBjb29yZCBzcGFjZVxyXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcclxuICAgIHNldEJveChhciwgaSwgMSwgMSwgMCwgMClcclxuICB9IFxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBWZXJ0ZXhBcnJheSAoc2l6ZSkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiBQT0lOVF9ESU1FTlNJT04pXHJcbn1cclxuXHJcbi8vNCBmb3IgciwgZywgYiwgYVxyXG5mdW5jdGlvbiBWZXJ0ZXhDb2xvckFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSAqIDQpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcml0ZUJhdGNoIChzaXplKSB7XHJcbiAgdGhpcy5jb3VudCAgICAgID0gMFxyXG4gIHRoaXMuYm94ZXMgICAgICA9IEJveEFycmF5KHNpemUpXHJcbiAgdGhpcy5jZW50ZXJzICAgID0gQ2VudGVyQXJyYXkoc2l6ZSlcclxuICB0aGlzLnNjYWxlcyAgICAgPSBTY2FsZUFycmF5KHNpemUpXHJcbiAgdGhpcy5yb3RhdGlvbnMgID0gUm90YXRpb25BcnJheShzaXplKVxyXG4gIHRoaXMudGV4Q29vcmRzICA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KHNpemUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb25CYXRjaCAoc2l6ZSkge1xyXG4gIHRoaXMuaW5kZXggICAgICAgID0gMFxyXG4gIHRoaXMudmVydGljZXMgICAgID0gVmVydGV4QXJyYXkoc2l6ZSlcclxuICB0aGlzLnZlcnRleENvbG9ycyA9IFZlcnRleENvbG9yQXJyYXkoc2l6ZSlcclxufVxyXG5cclxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gMTAwXHJcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXHJcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxyXG4gIGxldCBzdnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgc3ByaXRlVmVydGV4U2hhZGVyKVxyXG4gIGxldCBzZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBzcHJpdGVGcmFnbWVudFNoYWRlcilcclxuICBsZXQgcHZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHBvbHlnb25WZXJ0ZXhTaGFkZXIpXHJcbiAgbGV0IHBmcyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIHBvbHlnb25GcmFnbWVudFNoYWRlcilcclxuICBsZXQgc3ByaXRlUHJvZ3JhbSAgPSBQcm9ncmFtKGdsLCBzdnMsIHNmcylcclxuICBsZXQgcG9seWdvblByb2dyYW0gPSBQcm9ncmFtKGdsLCBwdnMsIHBmcylcclxuXHJcbiAgLy9TcHJpdGUgc2hhZGVyIGJ1ZmZlcnNcclxuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcblxyXG4gIC8vcG9seWdvbiBzaGFkZXIgYnVmZmVyc1xyXG4gIGxldCB2ZXJ0ZXhCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHZlcnRleENvbG9yQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuXHJcbiAgLy9HUFUgYnVmZmVyIGxvY2F0aW9uc1xyXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXHJcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcclxuICAvL2xldCBjZW50ZXJMb2NhdGlvbiAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX2NlbnRlclwiKVxyXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcclxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXHJcblxyXG4gIGxldCB2ZXJ0ZXhMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwiYV92ZXJ0ZXhcIilcclxuICBsZXQgdmVydGV4Q29sb3JMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcImFfdmVydGV4Q29sb3JcIilcclxuXHJcbiAgLy9Vbmlmb3JtIGxvY2F0aW9uc1xyXG4gIGxldCB3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiAgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxyXG4gIGxldCB3b3JsZFNpemVQb2x5Z29uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwidV93b3JsZFNpemVcIilcclxuXHJcbiAgbGV0IGltYWdlVG9UZXh0dXJlTWFwID0gbmV3IE1hcCgpXHJcbiAgbGV0IHRleHR1cmVUb0JhdGNoTWFwID0gbmV3IE1hcCgpXHJcbiAgbGV0IHBvbHlnb25CYXRjaCAgICAgID0gbmV3IFBvbHlnb25CYXRjaChNQVhfVkVSVEVYX0NPVU5UKVxyXG5cclxuICBnbC5lbmFibGUoZ2wuQkxFTkQpXHJcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcclxuICBnbC5jbGVhckNvbG9yKDEuMCwgMS4wLCAxLjAsIDAuMClcclxuICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSlcclxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxyXG5cclxuICB0aGlzLmRpbWVuc2lvbnMgPSB7XHJcbiAgICB3aWR0aDogIHdpZHRoIHx8IDE5MjAsIFxyXG4gICAgaGVpZ2h0OiBoZWlnaHQgfHwgMTA4MFxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRCYXRjaCA9ICh0ZXh0dXJlKSA9PiB7XHJcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5zZXQodGV4dHVyZSwgbmV3IFNwcml0ZUJhdGNoKG1heFNwcml0ZUNvdW50KSlcclxuICAgIHJldHVybiB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodGV4dHVyZSlcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkVGV4dHVyZSA9IChpbWFnZSkgPT4ge1xyXG4gICAgbGV0IHRleHR1cmUgPSBUZXh0dXJlKGdsKVxyXG5cclxuICAgIGltYWdlVG9UZXh0dXJlTWFwLnNldChpbWFnZSwgdGV4dHVyZSlcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKVxyXG4gICAgcmV0dXJuIHRleHR1cmVcclxuICB9XHJcblxyXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcclxuICAgIGxldCByYXRpbyAgICAgICA9IHRoaXMuZGltZW5zaW9ucy53aWR0aCAvIHRoaXMuZGltZW5zaW9ucy5oZWlnaHRcclxuICAgIGxldCB0YXJnZXRSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XHJcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xyXG4gICAgbGV0IG5ld1dpZHRoICAgID0gdXNlV2lkdGggPyB3aWR0aCA6IChoZWlnaHQgKiByYXRpbykgXHJcbiAgICBsZXQgbmV3SGVpZ2h0ICAgPSB1c2VXaWR0aCA/ICh3aWR0aCAvIHJhdGlvKSA6IGhlaWdodFxyXG5cclxuICAgIGNhbnZhcy53aWR0aCAgPSBuZXdXaWR0aCBcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQgXHJcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZGRTcHJpdGUgPSAoaW1hZ2UsIHcsIGgsIHgsIHksIHRleHcsIHRleGgsIHRleHgsIHRleHkpID0+IHtcclxuICAgIGxldCB0eCAgICA9IGltYWdlVG9UZXh0dXJlTWFwLmdldChpbWFnZSkgfHwgdGhpcy5hZGRUZXh0dXJlKGltYWdlKVxyXG4gICAgbGV0IGJhdGNoID0gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHR4KSB8fCB0aGlzLmFkZEJhdGNoKHR4KVxyXG5cclxuICAgIHNldEJveChiYXRjaC5ib3hlcywgYmF0Y2guY291bnQsIHcsIGgsIHgsIHkpXHJcbiAgICBzZXRCb3goYmF0Y2gudGV4Q29vcmRzLCBiYXRjaC5jb3VudCwgdGV4dywgdGV4aCwgdGV4eCwgdGV4eSlcclxuICAgIGJhdGNoLmNvdW50KytcclxuICB9XHJcblxyXG4gIC8vdmVydGljZXMgYW5kIHZlcnRleENvbG9ycyBhcmUgYXJyYXlzIG9yIHR5cGVkIGFycmF5c1xyXG4gIC8vW3gwLCB5MCwgeDEsIHkxLCAuLi5dXHJcbiAgLy9bcjAsIGcwLCBiMCwgYTAsIC4uLl1cclxuICB0aGlzLmFkZFBvbHlnb24gPSAodmVydGljZXMsIHZlcnRleENvbG9ycykgPT4ge1xyXG4gICAgbGV0IHZlcnRleENvdW50ID0gdmVydGljZXMubGVuZ3RoIC8gUE9JTlRfRElNRU5TSU9OXHJcblxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRpY2VzLnNldCh2ZXJ0aWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRleENvbG9ycy5zZXQodmVydGV4Q29sb3JzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kZXggKz0gdmVydGV4Q291bnRcclxuICB9XHJcblxyXG4gIGxldCByZXNldFBvbHlnb25zID0gKGJhdGNoKSA9PiBiYXRjaC5pbmRleCA9IDBcclxuXHJcbiAgbGV0IGRyYXdQb2x5Z29ucyA9IChiYXRjaCkgPT4ge1xyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBcclxuICAgICAgdmVydGV4QnVmZmVyLCBcclxuICAgICAgdmVydGV4TG9jYXRpb24sIFxyXG4gICAgICBQT0lOVF9ESU1FTlNJT04sIFxyXG4gICAgICBwb2x5Z29uQmF0Y2gudmVydGljZXMpXHJcbiAgICB1cGRhdGVCdWZmZXIoXHJcbiAgICAgIGdsLCBcclxuICAgICAgdmVydGV4Q29sb3JCdWZmZXIsIFxyXG4gICAgICB2ZXJ0ZXhDb2xvckxvY2F0aW9uLCBcclxuICAgICAgQ09MT1JfQ0hBTk5FTF9DT1VOVCwgXHJcbiAgICAgIHBvbHlnb25CYXRjaC52ZXJ0ZXhDb2xvcnMpXHJcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgcG9seWdvbkJhdGNoLmluZGV4ICogUE9JTlRTX1BFUl9CT1gpXHJcbiAgfVxyXG5cclxuICBsZXQgcmVzZXRCYXRjaCA9IChiYXRjaCkgPT4gYmF0Y2guY291bnQgPSAwXHJcblxyXG4gIGxldCBkcmF3QmF0Y2ggPSAoYmF0Y2gsIHRleHR1cmUpID0+IHtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIGJveEJ1ZmZlciwgYm94TG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2guYm94ZXMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgY2VudGVyQnVmZmVyLCBjZW50ZXJMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBjZW50ZXJzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCByb3RhdGlvbkJ1ZmZlciwgcm90TG9jYXRpb24sIDEsIHJvdGF0aW9ucylcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgdGV4Q29vcmRCdWZmZXIsIHRleENvb3JkTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgYmF0Y2gudGV4Q29vcmRzKVxyXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGJhdGNoLmNvdW50ICogUE9JTlRTX1BFUl9CT1gpXHJcbiAgfVxyXG5cclxuICB0aGlzLmZsdXNoID0gKCkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuZm9yRWFjaChyZXNldEJhdGNoKVxyXG4gICAgcmVzZXRQb2x5Z29ucyhwb2x5Z29uQmF0Y2gpXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlbmRlciA9ICgpID0+IHtcclxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXHJcblxyXG4gICAgLy9TcHJpdGVzaGVldCBiYXRjaCByZW5kZXJpbmdcclxuICAgIGdsLnVzZVByb2dyYW0oc3ByaXRlUHJvZ3JhbSlcclxuICAgIC8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXHJcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplU3ByaXRlTG9jYXRpb24sIDE5MjAsIDEwODApXHJcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKGRyYXdCYXRjaClcclxuXHJcbiAgICAvL3BvbGdvbiByZW5kZXJpbmdcclxuICAgIGdsLnVzZVByb2dyYW0ocG9seWdvblByb2dyYW0pXHJcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplUG9seWdvbkxvY2F0aW9uLCAxOTIwLCAxMDgwKVxyXG4gICAgZHJhd1BvbHlnb25zKHBvbHlnb25CYXRjaClcclxuICB9XHJcbn1cclxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IElucHV0TWFuYWdlciA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgQ2xvY2sgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXHJcblxyXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxyXG5mdW5jdGlvbiBHYW1lIChjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLCByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIFxyXG4gICAgICAgICAgICAgICBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcclxuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxyXG4gIGNoZWNrVHlwZShpbnB1dE1hbmFnZXIsIElucHV0TWFuYWdlcilcclxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXHJcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxyXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXHJcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcclxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXHJcblxyXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcclxuICB0aGlzLmNhY2hlICAgICAgICA9IGNhY2hlIFxyXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXHJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXHJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcclxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxyXG5cclxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXHJcblxyXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXHJcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0TWFuYWdlclxyXG5cclxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xyXG5mdW5jdGlvbiBJbnB1dE1hbmFnZXIgKGtleWJvYXJkTWFuYWdlcikge1xyXG4gIGNoZWNrVHlwZShrZXlib2FyZE1hbmFnZXIsIEtleWJvYXJkTWFuYWdlcilcclxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxyXG5cclxuY29uc3QgS0VZX0NPVU5UID0gMjU2XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XHJcbiAgbGV0IGlzRG93bnMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGRvd25EdXJhdGlvbnMgPSBuZXcgVWludDMyQXJyYXkoS0VZX0NPVU5UKVxyXG4gIFxyXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdERvd25zW2tleUNvZGVdID0gIWlzRG93bnNba2V5Q29kZV1cclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcclxuICAgICAganVzdERvd25zW2ldID0gMFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXHJcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xyXG4gIHRoaXMuanVzdERvd25zICAgICA9IGp1c3REb3duc1xyXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcclxuXHJcbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcclxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcclxuICAgICAgaWYgKGlzRG93bnNbaV0pIGRvd25EdXJhdGlvbnNbaV0gKz0gZFRcclxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxyXG59XHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJyZW5kZXJhYmxlXCIsIFwiYW5pbWF0ZWRcIl0pXHJcbn1cclxuXHJcbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IGRUICA9IHNjZW5lLmdhbWUuY2xvY2suZFRcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCB0aW1lTGVmdFxyXG4gIGxldCBjdXJyZW50SW5kZXhcclxuICBsZXQgY3VycmVudEFuaW1cclxuICBsZXQgY3VycmVudEZyYW1lXHJcbiAgbGV0IG5leHRGcmFtZVxyXG4gIGxldCBvdmVyc2hvb3RcclxuICBsZXQgc2hvdWxkQWR2YW5jZVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBlbnQgICAgICAgICAgID0gZW50aXRpZXNbaV0gXHJcbiAgICBjdXJyZW50SW5kZXggID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleFxyXG4gICAgY3VycmVudEFuaW0gICA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uXHJcbiAgICBjdXJyZW50RnJhbWUgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleF1cclxuICAgIG5leHRGcmFtZSAgICAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4ICsgMV0gfHwgY3VycmVudEFuaW0uZnJhbWVzWzBdXHJcbiAgICB0aW1lTGVmdCAgICAgID0gZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lXHJcbiAgICBvdmVyc2hvb3QgICAgID0gdGltZUxlZnQgLSBkVCAgIFxyXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXHJcbiAgICAgIFxyXG4gICAgaWYgKHNob3VsZEFkdmFuY2UpIHtcclxuICAgICAgZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcclxuICAgICAgZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lICAgICA9IG5leHRGcmFtZS5kdXJhdGlvbiArIG92ZXJzaG9vdCBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcclxuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XHJcblxyXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcclxuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcclxuXHJcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXHJcblxyXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxyXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxyXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcclxuICAgICAgeGhyLnNlbmQobnVsbClcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxyXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxyXG5cclxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXHJcblxyXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXHJcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXHJcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICBcclxuICAgIGkub25sb2FkICA9IG9ubG9hZFxyXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxyXG4gICAgaS5zcmMgICAgID0gcGF0aFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XHJcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxyXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXHJcblxyXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxyXG4gICAgfSkgXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xyXG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcclxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcclxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxyXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcclxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcclxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxyXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcclxuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XHJcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNvdW5kQ291bnQtLVxyXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICB0ZXh0dXJlQ291bnQtLVxyXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc2hhZGVyQ291bnQtLVxyXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcclxuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XHJcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxyXG5cclxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcclxuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cclxuXHJcbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBQYWRkbGVNb3ZlclN5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXHJcbn1cclxuXHJcblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtjbG9jaywgaW5wdXRNYW5hZ2VyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQge2tleWJvYXJkTWFuYWdlcn0gPSBpbnB1dE1hbmFnZXJcclxuICBsZXQgbW92ZVNwZWVkID0gMVxyXG4gIGxldCBwYWRkbGUgICAgPSBlbnRpdGllc1swXVxyXG5cclxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcclxuICBpZiAoIXBhZGRsZSkgcmV0dXJuXHJcblxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzldKSBwYWRkbGUucGh5c2ljcy54ICs9IGNsb2NrLmRUICogbW92ZVNwZWVkXHJcbn1cclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb24gKHZlcnRpY2VzLCB2ZXJ0ZXhDb2xvcnMpIHtcclxuICB0aGlzLnZlcnRpY2VzICAgICA9IHZlcnRpY2VzICBcclxuICB0aGlzLnZlcnRleENvbG9ycyA9IHZlcnRleENvbG9yc1xyXG59XHJcblxyXG4vL3gwLCB5MCwgeDEsIHkxLCB4MiwgeTIuLi5cclxubGV0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgMCwgODAwLCBcclxuICAxOTIwLCA4MDAsIFxyXG4gIDAsIDEwODAsXHJcbiAgMTkyMCwgODAwLCBcclxuICAxOTIwLCAxMDgwLCBcclxuICAwLCAxMDgwXHJcbl0pXHJcblxyXG4vL3IsZyxiLGEuLi5cclxubGV0IHZlcnRleENvbG9ycyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gIDAsIDAsIDAuNSwgLjYsIC8vbGlnaHRcclxuICAwLCAwLCAwLjUsIC42LCAvL2xpZ2h0XHJcbiAgMCwgMCwgMSwgICAxLFxyXG4gIDAsIDAsIDAuNSwgLjYsIC8vbGlnaHRcclxuICAwLCAwLCAxLCAgIDEsXHJcbiAgMCwgMCwgMSwgICAxXHJcbl0pXHJcblxyXG4vL1RPRE86IFRoaXMgaXMgYSBoYWNrIHRvIHRlc3QgcG9seWdvbiByZW5kZXJpbmdcclxubGV0IHBvbHlnb24gPSBuZXcgUG9seWdvbih2ZXJ0aWNlcywgdmVydGV4Q29sb3JzKVxyXG5cclxuUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtyZW5kZXJlcn0gPSBzY2VuZS5nYW1lXHJcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxyXG4gIGxldCBpICAgPSAtMVxyXG4gIGxldCBlbnRcclxuICBsZXQgZnJhbWVcclxuXHJcbiAgcmVuZGVyZXIuZmx1c2goKVxyXG5cclxuICAvL1RPRE86IEZvciB0ZXN0aW5nIG9mIHBvbHlnb24gcmVuZGVyaW5nXHJcbiAgcmVuZGVyZXIuYWRkUG9seWdvbihwb2x5Z29uLnZlcnRpY2VzLCBwb2x5Z29uLnZlcnRleENvbG9ycylcclxuXHJcbiAgd2hpbGUgKCsraSA8IGxlbikge1xyXG4gICAgZW50ID0gZW50aXRpZXNbaV1cclxuXHJcbiAgICBpZiAoZW50LmFuaW1hdGVkKSB7XHJcbiAgICAgIGZyYW1lID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb24uZnJhbWVzW2VudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uSW5kZXhdXHJcbiAgICAgIHJlbmRlcmVyLmFkZFNwcml0ZShcclxuICAgICAgICBlbnQucmVuZGVyYWJsZS5pbWFnZSwgLy9pbWFnZVxyXG4gICAgICAgIGVudC5waHlzaWNzLndpZHRoLFxyXG4gICAgICAgIGVudC5waHlzaWNzLmhlaWdodCxcclxuICAgICAgICBlbnQucGh5c2ljcy54LFxyXG4gICAgICAgIGVudC5waHlzaWNzLnksXHJcbiAgICAgICAgZnJhbWUuYWFiYi53IC8gZW50LnJlbmRlcmFibGUuaW1hZ2Uud2lkdGgsXHJcbiAgICAgICAgZnJhbWUuYWFiYi5oIC8gZW50LnJlbmRlcmFibGUuaW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAgIGZyYW1lLmFhYmIueCAvIGVudC5yZW5kZXJhYmxlLmltYWdlLndpZHRoLFxyXG4gICAgICAgIGZyYW1lLmFhYmIueSAvIGVudC5yZW5kZXJhYmxlLmltYWdlLmhlaWdodFxyXG4gICAgICApXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZW5kZXJlci5hZGRTcHJpdGUoXHJcbiAgICAgICAgZW50LnJlbmRlcmFibGUuaW1hZ2UsIC8vaW1hZ2VcclxuICAgICAgICBlbnQucGh5c2ljcy53aWR0aCxcclxuICAgICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueCxcclxuICAgICAgICBlbnQucGh5c2ljcy55LFxyXG4gICAgICAgIDEsICAvL3RleHR1cmUgd2lkdGhcclxuICAgICAgICAxLCAgLy90ZXh0dXJlIGhlaWdodFxyXG4gICAgICAgIDAsICAvL3RleHR1cmUgeFxyXG4gICAgICAgIDAgICAvL3RleHR1cmUgeVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gU2NlbmVcclxuXHJcbmZ1bmN0aW9uIFNjZW5lIChuYW1lLCBzeXN0ZW1zKSB7XHJcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoXCJTY2VuZSBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIG5hbWVcIilcclxuXHJcbiAgdGhpcy5uYW1lICAgID0gbmFtZVxyXG4gIHRoaXMuc3lzdGVtcyA9IHN5c3RlbXNcclxuICB0aGlzLmdhbWUgICAgPSBudWxsXHJcbn1cclxuXHJcblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xyXG4gIGNiKG51bGwsIG51bGwpICBcclxufVxyXG5cclxuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkVCkge1xyXG4gIGxldCBzdG9yZSA9IHRoaXMuZ2FtZS5lbnRpdHlTdG9yZVxyXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcclxuICBsZXQgaSAgICAgPSAtMVxyXG4gIGxldCBzeXN0ZW1cclxuXHJcbiAgd2hpbGUgKCsraSA8IGxlbikge1xyXG4gICAgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldIFxyXG4gICAgc3lzdGVtLnJ1bih0aGlzLCBzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxyXG4gIH1cclxufVxyXG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NlbmVNYW5hZ2VyXHJcblxyXG5mdW5jdGlvbiBTY2VuZU1hbmFnZXIgKHNjZW5lcz1bXSkge1xyXG4gIGlmIChzY2VuZXMubGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBvbmUgb3IgbW9yZSBzY2VuZXNcIilcclxuXHJcbiAgbGV0IGFjdGl2ZVNjZW5lSW5kZXggPSAwXHJcbiAgbGV0IHNjZW5lcyAgICAgICAgICAgPSBzY2VuZXNcclxuXHJcbiAgdGhpcy5zY2VuZXMgICAgICA9IHNjZW5lc1xyXG4gIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleF1cclxuXHJcbiAgdGhpcy50cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiAoc2NlbmVOYW1lKSB7XHJcbiAgICBsZXQgc2NlbmUgPSBmaW5kV2hlcmUoXCJuYW1lXCIsIHNjZW5lTmFtZSwgc2NlbmVzKVxyXG5cclxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihzY2VuZU5hbWUgKyBcIiBpcyBub3QgYSB2YWxpZCBzY2VuZSBuYW1lXCIpXHJcblxyXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxyXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkdmFuY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgc2NlbmUgPSBzY2VuZXNbYWN0aXZlU2NlbmVJbmRleCArIDFdXHJcblxyXG4gICAgaWYgKCFzY2VuZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbW9yZSBzY2VuZXMhXCIpXHJcblxyXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXHJcbiAgfVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBTeXN0ZW0gKGNvbXBvbmVudE5hbWVzPVtdKSB7XHJcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXHJcbn1cclxuXHJcbi8vc2NlbmUuZ2FtZS5jbG9ja1xyXG5TeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICAvL2RvZXMgc29tZXRoaW5nIHcvIHRoZSBsaXN0IG9mIGVudGl0aWVzIHBhc3NlZCB0byBpdFxyXG59XHJcbiIsImxldCB7UGFkZGxlLCBCbG9jaywgRmlnaHRlcn0gPSByZXF1aXJlKFwiLi9hc3NlbWJsYWdlc1wiKVxyXG5sZXQgUGFkZGxlTW92ZXJTeXN0ZW0gICAgICAgPSByZXF1aXJlKFwiLi9QYWRkbGVNb3ZlclN5c3RlbVwiKVxyXG5sZXQgUmVuZGVyaW5nU3lzdGVtICAgICAgICAgPSByZXF1aXJlKFwiLi9SZW5kZXJpbmdTeXN0ZW1cIilcclxubGV0IEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtID0gcmVxdWlyZShcIi4vS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cIilcclxubGV0IFNjZW5lICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVzdFNjZW5lXHJcblxyXG5mdW5jdGlvbiBUZXN0U2NlbmUgKCkge1xyXG4gIGxldCBzeXN0ZW1zID0gW1xyXG4gICAgbmV3IFBhZGRsZU1vdmVyU3lzdGVtLCBcclxuICAgIG5ldyBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSxcclxuICAgIG5ldyBSZW5kZXJpbmdTeXN0ZW1cclxuICBdXHJcblxyXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXHJcbn1cclxuXHJcblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcclxuXHJcblRlc3RTY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlLCBhdWRpb1N5c3RlbX0gPSB0aGlzLmdhbWUgXHJcbiAgbGV0IHtiZ30gPSBhdWRpb1N5c3RlbS5jaGFubmVsc1xyXG4gIGxldCBhc3NldHMgPSB7XHJcbiAgICAvL3NvdW5kczogeyBiZ011c2ljOiBcIi9wdWJsaWMvc291bmRzL2JnbTEubXAzXCIgfSxcclxuICAgIHRleHR1cmVzOiB7IFxyXG4gICAgICBwYWRkbGU6ICBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3BhZGRsZS5wbmdcIixcclxuICAgICAgYmxvY2tzOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCIsXHJcbiAgICAgIGZpZ2h0ZXI6IFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcHVuY2gucG5nXCJcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxvYWRlci5sb2FkQXNzZXRzKGFzc2V0cywgZnVuY3Rpb24gKGVyciwgbG9hZGVkQXNzZXRzKSB7XHJcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxyXG5cclxuICAgIGNhY2hlLnNvdW5kcyAgID0gc291bmRzXHJcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDQwMCwgNDAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA0NCwgMjIsIDgwMCwgODAwKSlcclxuICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgRmlnaHRlcih0ZXh0dXJlcy5maWdodGVyLCA3NiwgNTksIDUwMCwgNTAwKSlcclxuICAgIC8vYmcudm9sdW1lID0gMFxyXG4gICAgLy9iZy5sb29wKGNhY2hlLnNvdW5kcy5iZ011c2ljKVxyXG4gICAgY2IobnVsbClcclxuICB9KVxyXG59XHJcbiIsImxldCB7UmVuZGVyYWJsZSwgUGh5c2ljcywgUGxheWVyQ29udHJvbGxlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXHJcbmxldCB7QW5pbWF0ZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxyXG5sZXQgQW5pbWF0aW9uID0gcmVxdWlyZShcIi4vQW5pbWF0aW9uXCIpXHJcbmxldCBFbnRpdHkgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzLlBhZGRsZSAgPSBQYWRkbGVcclxubW9kdWxlLmV4cG9ydHMuQmxvY2sgICA9IEJsb2NrXHJcbm1vZHVsZS5leHBvcnRzLkZpZ2h0ZXIgPSBGaWdodGVyXHJcblxyXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XHJcbiAgRW50aXR5LmNhbGwodGhpcylcclxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBQbGF5ZXJDb250cm9sbGVkKHRoaXMpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEJsb2NrIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgQW5pbWF0ZWQodGhpcywgXCJpZGxlXCIsIHtcclxuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoNDQsIDIyLCAwLCAwLCAzLCB0cnVlLCAxMDAwKVxyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEZpZ2h0ZXIgKGltYWdlLCB3LCBoLCB4LCB5KSB7XHJcbiAgRW50aXR5LmNhbGwodGhpcylcclxuICBSZW5kZXJhYmxlKHRoaXMsIGltYWdlLCB3LCBoKVxyXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcclxuICBBbmltYXRlZCh0aGlzLCBcImZpcmViYWxsXCIsIHtcclxuICAgIGZpcmViYWxsOiBBbmltYXRpb24uY3JlYXRlTGluZWFyKDE3NCwgMTM0LCAwLCAwLCAyNSwgdHJ1ZSlcclxuICB9KVxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzLlJlbmRlcmFibGUgICAgICAgPSBSZW5kZXJhYmxlXHJcbm1vZHVsZS5leHBvcnRzLlBoeXNpY3MgICAgICAgICAgPSBQaHlzaWNzXHJcbm1vZHVsZS5leHBvcnRzLlBsYXllckNvbnRyb2xsZWQgPSBQbGF5ZXJDb250cm9sbGVkXHJcbm1vZHVsZS5leHBvcnRzLkFuaW1hdGVkICAgICAgICAgPSBBbmltYXRlZFxyXG5cclxuZnVuY3Rpb24gUmVuZGVyYWJsZSAoZSwgaW1hZ2UsIHdpZHRoLCBoZWlnaHQpIHtcclxuICBlLnJlbmRlcmFibGUgPSB7XHJcbiAgICBpbWFnZSxcclxuICAgIHdpZHRoLFxyXG4gICAgaGVpZ2h0LFxyXG4gICAgcm90YXRpb246IDAsXHJcbiAgICBjZW50ZXI6IHtcclxuICAgICAgeDogd2lkdGggLyAyLFxyXG4gICAgICB5OiBoZWlnaHQgLyAyIFxyXG4gICAgfSxcclxuICAgIHNjYWxlOiB7XHJcbiAgICAgIHg6IDEsXHJcbiAgICAgIHk6IDEgXHJcbiAgICB9XHJcbiAgfSBcclxuICByZXR1cm4gZVxyXG59XHJcblxyXG5mdW5jdGlvbiBQaHlzaWNzIChlLCB3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XHJcbiAgZS5waHlzaWNzID0ge1xyXG4gICAgd2lkdGgsIFxyXG4gICAgaGVpZ2h0LCBcclxuICAgIHgsIFxyXG4gICAgeSwgXHJcbiAgICBkeDogIDAsIFxyXG4gICAgZHk6ICAwLCBcclxuICAgIGRkeDogMCwgXHJcbiAgICBkZHk6IDBcclxuICB9XHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGxheWVyQ29udHJvbGxlZCAoZSkge1xyXG4gIGUucGxheWVyQ29udHJvbGxlZCA9IHRydWVcclxufVxyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWQgKGUsIGRlZmF1bHRBbmltYXRpb25OYW1lLCBhbmltSGFzaCkge1xyXG4gIGUuYW5pbWF0ZWQgPSB7XHJcbiAgICBhbmltYXRpb25zOiAgICAgICAgICAgIGFuaW1IYXNoLFxyXG4gICAgY3VycmVudEFuaW1hdGlvbk5hbWU6ICBkZWZhdWx0QW5pbWF0aW9uTmFtZSxcclxuICAgIGN1cnJlbnRBbmltYXRpb25JbmRleDogMCxcclxuICAgIGN1cnJlbnRBbmltYXRpb246ICAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLFxyXG4gICAgdGltZVRpbGxOZXh0RnJhbWU6ICAgICBhbmltSGFzaFtkZWZhdWx0QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXHJcbiAgfSBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5maW5kV2hlcmUgPSBmaW5kV2hlcmVcclxubW9kdWxlLmV4cG9ydHMuaGFzS2V5cyAgID0gaGFzS2V5c1xyXG5cclxuLy86OiBbe31dIC0+IFN0cmluZyAtPiBNYXliZSBBXHJcbmZ1bmN0aW9uIGZpbmRXaGVyZSAoa2V5LCBwcm9wZXJ0eSwgYXJyYXlPZk9iamVjdHMpIHtcclxuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcclxuICBsZXQgaSAgICAgPSAtMVxyXG4gIGxldCBmb3VuZCA9IG51bGxcclxuXHJcbiAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XHJcbiAgICBpZiAoYXJyYXlPZk9iamVjdHNbaV1ba2V5XSA9PT0gcHJvcGVydHkpIHtcclxuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZm91bmRcclxufVxyXG5cclxuZnVuY3Rpb24gaGFzS2V5cyAoa2V5cywgb2JqKSB7XHJcbiAgbGV0IGkgPSAtMVxyXG4gIFxyXG4gIHdoaWxlIChrZXlzWysraV0pIGlmICghb2JqW2tleXNbaV1dKSByZXR1cm4gZmFsc2VcclxuICByZXR1cm4gdHJ1ZVxyXG59XHJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEJ1ZmZlciAtPiBJbnQgLT4gSW50IC0+IEZsb2F0MzJBcnJheVxyXG5mdW5jdGlvbiB1cGRhdGVCdWZmZXIgKGdsLCBidWZmZXIsIGxvYywgY2h1bmtTaXplLCBkYXRhKSB7XHJcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcclxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxyXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvYylcclxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxyXG4iLCJtb2R1bGUuZXhwb3J0cy5zcHJpdGVWZXJ0ZXhTaGFkZXIgPSBcIiBcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfcG9zaXRpb247IFxcXHJcbiAgYXR0cmlidXRlIHZlYzIgYV90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHVuaWZvcm0gdmVjMiB1X3dvcmxkU2l6ZTsgXFxcclxuICBcXFxyXG4gIHZhcnlpbmcgdmVjMiB2X3RleENvb3JkOyBcXFxyXG4gIFxcXHJcbiAgdmVjMiBub3JtICh2ZWMyIHBvc2l0aW9uKSB7IFxcXHJcbiAgICByZXR1cm4gcG9zaXRpb24gKiAyLjAgLSAxLjA7IFxcXHJcbiAgfSBcXFxyXG4gIFxcXHJcbiAgdm9pZCBtYWluKCkgeyBcXFxyXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcclxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IGFfcG9zaXRpb24gLyB1X3dvcmxkU2l6ZTsgXFxcclxuICAgIHZlYzIgcG9zaXRpb24gICAgICA9IGNsaXBTcGFjZSAqIG5vcm0oZnJvbVdvcmxkU2l6ZSk7IFxcXHJcbiAgICBcXFxyXG4gICAgdl90ZXhDb29yZCAgPSBhX3RleENvb3JkOyBcXFxyXG4gICAgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvc2l0aW9uLCAwLCAxKTsgXFxcclxuICB9XCJcclxuXHJcbm1vZHVsZS5leHBvcnRzLnNwcml0ZUZyYWdtZW50U2hhZGVyID0gXCJcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIHVuaWZvcm0gc2FtcGxlcjJEIHVfaW1hZ2U7IFxcXHJcbiAgXFxcclxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHZvaWQgbWFpbigpIHsgXFxcclxuICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X2ltYWdlLCB2X3RleENvb3JkKTsgXFxcclxuICB9XCJcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBvbHlnb25WZXJ0ZXhTaGFkZXIgPSBcIlxcXHJcbiAgYXR0cmlidXRlIHZlYzIgYV92ZXJ0ZXg7IFxcXHJcbiAgYXR0cmlidXRlIHZlYzQgYV92ZXJ0ZXhDb2xvcjsgXFxcclxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXHJcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXHJcbiAgdmVjMiBub3JtICh2ZWMyIHBvc2l0aW9uKSB7IFxcXHJcbiAgICByZXR1cm4gcG9zaXRpb24gKiAyLjAgLSAxLjA7IFxcXHJcbiAgfSBcXFxyXG4gIHZvaWQgbWFpbiAoKSB7IFxcXHJcbiAgICBtYXQyIGNsaXBTcGFjZSAgICAgPSBtYXQyKDEuMCwgMC4wLCAwLjAsIC0xLjApOyBcXFxyXG4gICAgdmVjMiBmcm9tV29ybGRTaXplID0gYV92ZXJ0ZXggLyB1X3dvcmxkU2l6ZTsgXFxcclxuICAgIHZlYzIgcG9zaXRpb24gICAgICA9IGNsaXBTcGFjZSAqIG5vcm0oZnJvbVdvcmxkU2l6ZSk7IFxcXHJcbiAgICBcXFxyXG4gICAgdl92ZXJ0ZXhDb2xvciA9IGFfdmVydGV4Q29sb3I7IFxcXHJcbiAgICBnbF9Qb3NpdGlvbiAgID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5wb2x5Z29uRnJhZ21lbnRTaGFkZXIgPSBcIlxcXHJcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxyXG4gIFxcXHJcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXHJcbiAgXFxcclxuICB2b2lkIG1haW4oKSB7IFxcXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIH1cIlxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBFTlVNIChWRVJURVggfHwgRlJBR01FTlQpIC0+IFN0cmluZyAoQ29kZSlcclxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XHJcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcclxuICBsZXQgaXNWYWxpZCA9IGZhbHNlXHJcbiAgXHJcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxyXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxyXG5cclxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXHJcblxyXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpXHJcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXHJcbmZ1bmN0aW9uIFByb2dyYW0gKGdsLCB2cywgZnMpIHtcclxuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxyXG5cclxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxyXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXHJcbiAgcmV0dXJuIHByb2dyYW1cclxufVxyXG5cclxuLy86OiA9PiBHTENvbnRleHQgLT4gVGV4dHVyZVxyXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xyXG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG5cclxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxyXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXHJcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSlcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIHJldHVybiB0ZXh0dXJlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcclxubW9kdWxlLmV4cG9ydHMuUHJvZ3JhbSA9IFByb2dyYW1cclxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcclxuIiwibGV0IExvYWRlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgICAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgRW50aXR5U3RvcmUgICAgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXHJcbmxldCBDbG9jayAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxyXG5sZXQgQ2FjaGUgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2FjaGVcIilcclxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5sZXQgVGVzdFNjZW5lICAgICAgID0gcmVxdWlyZShcIi4vVGVzdFNjZW5lXCIpXHJcbmxldCBHYW1lICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9HYW1lXCIpXHJcbmxldCBJbnB1dE1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcclxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gICAgID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IGNhbnZhcyAgICAgICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcclxuXHJcbmNvbnN0IFVQREFURV9JTlRFUlZBTCA9IDI1XHJcbmNvbnN0IE1BWF9DT1VOVCAgICAgICA9IDEwMDBcclxuXHJcbmxldCBrZXlib2FyZE1hbmFnZXIgPSBuZXcgS2V5Ym9hcmRNYW5hZ2VyKGRvY3VtZW50KVxyXG5sZXQgaW5wdXRNYW5hZ2VyICAgID0gbmV3IElucHV0TWFuYWdlcihrZXlib2FyZE1hbmFnZXIpXHJcbmxldCBlbnRpdHlTdG9yZSAgICAgPSBuZXcgRW50aXR5U3RvcmVcclxubGV0IGNsb2NrICAgICAgICAgICA9IG5ldyBDbG9jayhEYXRlLm5vdylcclxubGV0IGNhY2hlICAgICAgICAgICA9IG5ldyBDYWNoZShbXCJzb3VuZHNcIiwgXCJ0ZXh0dXJlc1wiXSlcclxubGV0IGxvYWRlciAgICAgICAgICA9IG5ldyBMb2FkZXJcclxubGV0IHJlbmRlcmVyICAgICAgICA9IG5ldyBHTFJlbmRlcmVyKGNhbnZhcywgMTkyMCwgMTA4MClcclxubGV0IGF1ZGlvU3lzdGVtICAgICA9IG5ldyBBdWRpb1N5c3RlbShbXCJtYWluXCIsIFwiYmdcIl0pXHJcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcclxubGV0IGdhbWUgICAgICAgICAgICA9IG5ldyBHYW1lKGNsb2NrLCBjYWNoZSwgbG9hZGVyLCBpbnB1dE1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIGVudGl0eVN0b3JlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcclxuXHJcbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdhbWUpIHtcclxuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXHJcbiAgbGV0IGNsb2NrICAgICAgICAgID0gZ2FtZS5jbG9ja1xyXG4gIGxldCBpbnB1dE1hbmFnZXIgICA9IGdhbWUuaW5wdXRNYW5hZ2VyXHJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XHJcbiAgICBjbG9jay50aWNrKClcclxuICAgIGlucHV0TWFuYWdlci5rZXlib2FyZE1hbmFnZXIudGljayhjbG9jay5kVClcclxuICAgIGdhbWUuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lLnVwZGF0ZShjbG9jay5kVClcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xyXG4gICAgZ2FtZS5yZW5kZXJlci5yZW5kZXIoKVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpICBcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5nYW1lID0gZ2FtZVxyXG5cclxuZnVuY3Rpb24gc2V0dXBEb2N1bWVudCAoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KSB7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXHJcbiAgfSlcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gIHNldHVwRG9jdW1lbnQoY2FudmFzLCBkb2N1bWVudCwgd2luZG93KVxyXG4gIGdhbWUuc3RhcnQoKVxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnYW1lKSlcclxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdhbWUpLCBVUERBVEVfSU5URVJWQUwpXHJcbn0pXHJcbiIsIm1vZHVsZS5leHBvcnRzLmNoZWNrVHlwZSAgICAgID0gY2hlY2tUeXBlXHJcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcbiJdfQ==
