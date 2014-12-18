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

var _ref = require("./utils");

var setBox = _ref.setBox;
var System = require("./System");

module.exports = RenderingSystem;

function RenderingSystem() {
  System.call(this, ["physics", "renderable"]);
}

function Polygon(vertices, indices, vertexColors) {
  this.vertices = vertices;
  this.indices = indices;
  this.vertexColors = vertexColors;
}

var POINTS_PER_VERTEX = 2;
var COLOR_CHANNEL_COUNT = 4;
var INDICES_PER_QUAD = 6;
var QUAD_VERTEX_SIZE = 8;
var QUAD_COLOR_SIZE = 16;

function setVertex(vertices, index, x, y) {
  var _i = index * POINTS_PER_VERTEX;

  vertices[_i] = x;
  vertices[_i + 1] = y;
}

function setColor(colors, index, color) {
  var _i2 = index * COLOR_CHANNEL_COUNT;

  colors.set(color, _i2);
}

//colors passed in as 4 length arrays [r, g, b, a]
//(i, i + sliceCount + 1, i + 1), (i + sliceCount + 1, i + sliceCount + 2, i + 1)
function createWater(w, h, x, y, sliceCount, topColor, bottomColor) {
  var vertexCount = 2 + (sliceCount * 2);
  var vertices = new Float32Array(vertexCount * POINTS_PER_VERTEX);
  var vertexColors = new Float32Array(vertexCount * COLOR_CHANNEL_COUNT);
  var indices = new Uint16Array(INDICES_PER_QUAD * sliceCount);
  var unitWidth = w / sliceCount;
  var _i3 = -1;
  var j = -1;

  while (++_i3 <= sliceCount) {
    setVertex(vertices, _i3, (x + unitWidth * _i3), y);
    setColor(vertexColors, _i3, topColor);
    setVertex(vertices, _i3 + sliceCount + 1, (x + unitWidth * _i3), y + h);
    setColor(vertexColors, _i3 + sliceCount + 1, bottomColor);
  }

  while (++j < sliceCount) {
    indices[j * INDICES_PER_QUAD] = j;
    indices[j * INDICES_PER_QUAD + 1] = j + sliceCount + 1;
    indices[j * INDICES_PER_QUAD + 2] = j + 1;
    indices[j * INDICES_PER_QUAD + 3] = j + sliceCount + 1;
    indices[j * INDICES_PER_QUAD + 4] = j + sliceCount + 2;
    indices[j * INDICES_PER_QUAD + 5] = j + 1;
  }

  return new Polygon(vertices, indices, vertexColors);
}

window.createWater = createWater;

var waterVerts = new Float32Array([0, 800, 1920, 800, 0, 1080, 1920, 1080]);
var waterIndices = new Uint16Array([0, 2, 1, 2, 3, 1]);
var waterColors = new Float32Array([0, 0, 0.5, 0.6, 0, 0, 0.5, 0.6, 0, 0, 1, 1, 0, 0, 1, 1]);

//let water = new Polygon(waterVerts, waterIndices, waterColors)
var water = createWater(1920, 280, 0, 800, 100, [0, 0, 0.5, 0.6], [0, 0, 1, 1]);

for (var i = 0; i < 100; ++i) {
  water.vertices[i * 2 + 1] += (Math.sin(i) * 10);
}

window.water = water;

RenderingSystem.prototype.run = function (scene, entities) {
  var renderer = scene.game.renderer;
  var len = entities.length;
  var _i4 = -1;
  var ent;
  var frame;

  renderer.flush();

  //TODO: For testing of polygon rendering
  renderer.addPolygon(water.vertices, water.indices, water.vertexColors);

  while (++_i4 < len) {
    ent = entities[_i4];

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

},{"./System":18,"./utils":27}],16:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BQUJCLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9BbmltYXRpb24uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9DYWNoZS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvQ2xvY2suanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0VudGl0eS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvRW50aXR5U3RvcmUtU2ltcGxlLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HTFJlbmRlcmVyLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9HYW1lLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9JbnB1dE1hbmFnZXIuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0tleWJvYXJkTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL0xvYWRlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvUGFkZGxlTW92ZXJTeXN0ZW0uanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1JlbmRlcmluZ1N5c3RlbS5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL1NjZW5lTWFuYWdlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvU3lzdGVtLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9UZXN0U2NlbmUuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2Fzc2VtYmxhZ2VzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9jb21wb25lbnRzLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy9mdW5jdGlvbnMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2dsLWJ1ZmZlci5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtc2hhZGVycy5qcyIsIkM6L1VzZXJzL2thbmVzXzAwMC9wcm9qZWN0cy9icmVha291dC9zcmMvZ2wtdHlwZXMuanMiLCJDOi9Vc2Vycy9rYW5lc18wMDAvcHJvamVjdHMvYnJlYWtvdXQvc3JjL2xkLmpzIiwiQzovVXNlcnMva2FuZXNfMDAwL3Byb2plY3RzL2JyZWFrb3V0L3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtB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QUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDNUMsTUFBSSxDQUFDLEdBQUksVUFBVSxHQUFHLEtBQUssQ0FBQTtBQUMzQixNQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2QsTUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFZCxVQUFRLENBQUMsQ0FBQyxDQUFDLEdBQU0sRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBOztBQUVuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFBQkIgKHcsIGgsIHgsIHkpIHtcclxuICB0aGlzLnggPSB4XHJcbiAgdGhpcy55ID0geVxyXG4gIHRoaXMudyA9IHdcclxuICB0aGlzLmggPSBoXHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseFwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB4IH0gXHJcbiAgfSlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHlcIiwge1xyXG4gICAgZ2V0KCkgeyByZXR1cm4geSB9IFxyXG4gIH0pXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ4XCIsIHtcclxuICAgIGdldCgpIHsgcmV0dXJuIHggKyB3IH1cclxuICB9KVxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeVwiLCB7XHJcbiAgICBnZXQoKSB7IHJldHVybiB5ICsgaCB9XHJcbiAgfSlcclxufVxyXG4iLCJsZXQgQUFCQiA9IHJlcXVpcmUoXCIuL0FBQkJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uXHJcblxyXG5mdW5jdGlvbiBGcmFtZSAoYWFiYiwgZHVyYXRpb24pIHtcclxuICB0aGlzLmFhYmIgICAgID0gYWFiYlxyXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxyXG59XHJcblxyXG4vL3JhdGUgaXMgaW4gbXMuICBUaGlzIGlzIHRoZSB0aW1lIHBlciBmcmFtZSAoNDIgfiAyNGZwcylcclxuZnVuY3Rpb24gQW5pbWF0aW9uIChmcmFtZXMsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgdGhpcy5sb29wICAgPSBkb2VzTG9vcFxyXG4gIHRoaXMucmF0ZSAgID0gcmF0ZVxyXG4gIHRoaXMuZnJhbWVzID0gZnJhbWVzXHJcbn1cclxuXHJcbkFuaW1hdGlvbi5jcmVhdGVMaW5lYXIgPSBmdW5jdGlvbiAodywgaCwgeCwgeSwgY291bnQsIGRvZXNMb29wLCByYXRlPTQyKSB7XHJcbiAgbGV0IGZyYW1lcyA9IFtdXHJcbiAgbGV0IGkgICAgICA9IC0xXHJcbiAgbGV0IGVhY2hYXHJcbiAgbGV0IGFhYmJcclxuXHJcbiAgd2hpbGUgKCsraSA8IGNvdW50KSB7XHJcbiAgICBlYWNoWCA9IHggKyBpICogd1xyXG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcclxuICAgIGZyYW1lcy5wdXNoKG5ldyBGcmFtZShhYWJiLCByYXRlKSlcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgQW5pbWF0aW9uKGZyYW1lcywgZG9lc0xvb3AsIHJhdGUpXHJcbn1cclxuIiwiZnVuY3Rpb24gQ2hhbm5lbCAoY29udGV4dCwgbmFtZSkge1xyXG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcclxuICBcclxuICBsZXQgY29ubmVjdFBhbm5lciA9IGZ1bmN0aW9uIChzcmMsIHBhbm5lciwgY2hhbikge1xyXG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxyXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXHJcbiAgfVxyXG5cclxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xyXG4gICAgbGV0IHNob3VsZExvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2VcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XHJcbiAgICAgIGxldCBzcmMgPSBjaGFubmVsLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkgXHJcblxyXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxyXG4gICAgICBlbHNlICAgICAgICBzcmMuY29ubmVjdChjaGFubmVsKVxyXG5cclxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcclxuICAgICAgc3JjLmJ1ZmZlciA9IGJ1ZmZlclxyXG4gICAgICBzcmMuc3RhcnQoMClcclxuICAgICAgcmV0dXJuIHNyY1xyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGNoYW5uZWwuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxyXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cclxuICB9KVxyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cclxuICB9KVxyXG5cclxuICB0aGlzLm5hbWUgPSBuYW1lXHJcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxyXG4gIHRoaXMucGxheSA9IGJhc2VQbGF5KClcclxufVxyXG5cclxuZnVuY3Rpb24gQXVkaW9TeXN0ZW0gKGNoYW5uZWxOYW1lcykge1xyXG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcclxuICBsZXQgY2hhbm5lbHMgPSB7fVxyXG4gIGxldCBpICAgICAgICA9IC0xXHJcblxyXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xyXG4gICAgY2hhbm5lbHNbY2hhbm5lbE5hbWVzW2ldXSA9IG5ldyBDaGFubmVsKGNvbnRleHQsIGNoYW5uZWxOYW1lc1tpXSlcclxuICB9XHJcbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXHJcbiAgdGhpcy5jaGFubmVscyA9IGNoYW5uZWxzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXVkaW9TeXN0ZW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcclxuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyArK2kpIHRoaXNba2V5TmFtZXNbaV1dID0ge31cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXHJcblxyXG5mdW5jdGlvbiBDbG9jayAodGltZUZuPURhdGUubm93KSB7XHJcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcclxuICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKVxyXG4gIHRoaXMuZFQgPSAwXHJcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vbGRUaW1lID0gdGhpcy5uZXdUaW1lXHJcbiAgICB0aGlzLm5ld1RpbWUgPSB0aW1lRm4oKSAgXHJcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcclxuICB9XHJcbn1cclxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW50aXR5ICgpIHt9XHJcbiIsImxldCB7aGFzS2V5c30gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW50aXR5U3RvcmVcclxuXHJcbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xyXG4gIHRoaXMuZW50aXRpZXMgID0gW11cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcbn1cclxuXHJcbkVudGl0eVN0b3JlLnByb3RvdHlwZS5hZGRFbnRpdHkgPSBmdW5jdGlvbiAoZSkge1xyXG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXHJcblxyXG4gIHRoaXMuZW50aXRpZXMucHVzaChlKVxyXG4gIHJldHVybiBpZFxyXG59XHJcblxyXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcclxuICBsZXQgaSA9IC0xXHJcbiAgbGV0IGVudGl0eVxyXG5cclxuICB0aGlzLmxhc3RRdWVyeSA9IFtdXHJcblxyXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcclxuICAgIGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cclxuICAgIGlmIChoYXNLZXlzKGNvbXBvbmVudE5hbWVzLCBlbnRpdHkpKSB0aGlzLmxhc3RRdWVyeS5wdXNoKGVudGl0eSlcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMubGFzdFF1ZXJ5XHJcbn1cclxuIiwibGV0IHtzcHJpdGVWZXJ0ZXhTaGFkZXIsIHNwcml0ZUZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcclxubGV0IHtwb2x5Z29uVmVydGV4U2hhZGVyLCBwb2x5Z29uRnJhZ21lbnRTaGFkZXJ9ID0gcmVxdWlyZShcIi4vZ2wtc2hhZGVyc1wiKVxyXG5sZXQge3NldEJveH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxyXG5sZXQge3VwZGF0ZUJ1ZmZlcn0gPSByZXF1aXJlKFwiLi9nbC1idWZmZXJcIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxyXG5cclxuY29uc3QgUE9JTlRfRElNRU5TSU9OICAgICA9IDJcclxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcclxuY29uc3QgUE9JTlRTX1BFUl9CT1ggICAgICA9IDZcclxuY29uc3QgQk9YX0xFTkdUSCAgICAgICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXHJcbmNvbnN0IE1BWF9WRVJURVhfQ09VTlQgICAgPSAxMDAwMDAwXHJcblxyXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxufVxyXG5cclxuZnVuY3Rpb24gU2NhbGVBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSBhcltpXSA9IDFcclxuICByZXR1cm4gYXJcclxufVxyXG5cclxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcclxuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxyXG59XHJcblxyXG4vL3RleHR1cmUgY29vcmRzIGFyZSBpbml0aWFsaXplZCB0byAwIC0+IDEgdGV4dHVyZSBjb29yZCBzcGFjZVxyXG5mdW5jdGlvbiBUZXh0dXJlQ29vcmRpbmF0ZXNBcnJheSAoY291bnQpIHtcclxuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyBpICs9IEJPWF9MRU5HVEgpIHtcclxuICAgIHNldEJveChhciwgaSwgMSwgMSwgMCwgMClcclxuICB9IFxyXG4gIHJldHVybiBhclxyXG59XHJcblxyXG5mdW5jdGlvbiBJbmRleEFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShzaXplKVxyXG59XHJcblxyXG5mdW5jdGlvbiBWZXJ0ZXhBcnJheSAoc2l6ZSkge1xyXG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiBQT0lOVF9ESU1FTlNJT04pXHJcbn1cclxuXHJcbi8vNCBmb3IgciwgZywgYiwgYVxyXG5mdW5jdGlvbiBWZXJ0ZXhDb2xvckFycmF5IChzaXplKSB7XHJcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSAqIDQpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcml0ZUJhdGNoIChzaXplKSB7XHJcbiAgdGhpcy5jb3VudCAgICAgID0gMFxyXG4gIHRoaXMuYm94ZXMgICAgICA9IEJveEFycmF5KHNpemUpXHJcbiAgdGhpcy5jZW50ZXJzICAgID0gQ2VudGVyQXJyYXkoc2l6ZSlcclxuICB0aGlzLnNjYWxlcyAgICAgPSBTY2FsZUFycmF5KHNpemUpXHJcbiAgdGhpcy5yb3RhdGlvbnMgID0gUm90YXRpb25BcnJheShzaXplKVxyXG4gIHRoaXMudGV4Q29vcmRzICA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KHNpemUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb25CYXRjaCAoc2l6ZSkge1xyXG4gIHRoaXMuaW5kZXggICAgICAgID0gMFxyXG4gIHRoaXMuaW5kaWNlcyAgICAgID0gSW5kZXhBcnJheShzaXplKVxyXG4gIHRoaXMudmVydGljZXMgICAgID0gVmVydGV4QXJyYXkoc2l6ZSlcclxuICB0aGlzLnZlcnRleENvbG9ycyA9IFZlcnRleENvbG9yQXJyYXkoc2l6ZSlcclxufVxyXG5cclxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgbGV0IG1heFNwcml0ZUNvdW50ID0gMTAwXHJcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXHJcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxyXG4gIGxldCBzdnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuVkVSVEVYX1NIQURFUiwgc3ByaXRlVmVydGV4U2hhZGVyKVxyXG4gIGxldCBzZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBzcHJpdGVGcmFnbWVudFNoYWRlcilcclxuICBsZXQgcHZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHBvbHlnb25WZXJ0ZXhTaGFkZXIpXHJcbiAgbGV0IHBmcyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIHBvbHlnb25GcmFnbWVudFNoYWRlcilcclxuICBsZXQgc3ByaXRlUHJvZ3JhbSAgPSBQcm9ncmFtKGdsLCBzdnMsIHNmcylcclxuICBsZXQgcG9seWdvblByb2dyYW0gPSBQcm9ncmFtKGdsLCBwdnMsIHBmcylcclxuXHJcbiAgLy9TcHJpdGUgc2hhZGVyIGJ1ZmZlcnNcclxuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCBjZW50ZXJCdWZmZXIgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG4gIGxldCB0ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcblxyXG4gIC8vcG9seWdvbiBzaGFkZXIgYnVmZmVyc1xyXG4gIGxldCB2ZXJ0ZXhCdWZmZXIgICAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXHJcbiAgbGV0IHZlcnRleENvbG9yQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcclxuICBsZXQgaW5kZXhCdWZmZXIgICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxyXG5cclxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXHJcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfcG9zaXRpb25cIilcclxuICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNwcml0ZVByb2dyYW0sIFwiYV90ZXhDb29yZFwiKVxyXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXHJcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxyXG4gIC8vbGV0IHJvdExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcm90YXRpb25cIilcclxuXHJcbiAgbGV0IHZlcnRleExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJhX3ZlcnRleFwiKVxyXG4gIGxldCB2ZXJ0ZXhDb2xvckxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwiYV92ZXJ0ZXhDb2xvclwiKVxyXG5cclxuICAvL1VuaWZvcm0gbG9jYXRpb25zXHJcbiAgbGV0IHdvcmxkU2l6ZVNwcml0ZUxvY2F0aW9uICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXHJcbiAgbGV0IHdvcmxkU2l6ZVBvbHlnb25Mb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxyXG5cclxuICBsZXQgaW1hZ2VUb1RleHR1cmVNYXAgPSBuZXcgTWFwKClcclxuICBsZXQgdGV4dHVyZVRvQmF0Y2hNYXAgPSBuZXcgTWFwKClcclxuICBsZXQgcG9seWdvbkJhdGNoICAgICAgPSBuZXcgUG9seWdvbkJhdGNoKE1BWF9WRVJURVhfQ09VTlQpXHJcblxyXG4gIGdsLmVuYWJsZShnbC5CTEVORClcclxuICBnbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKVxyXG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpXHJcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXHJcbiAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuXHJcbiAgdGhpcy5kaW1lbnNpb25zID0ge1xyXG4gICAgd2lkdGg6ICB3aWR0aCB8fCAxOTIwLCBcclxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xyXG4gICAgdGV4dHVyZVRvQmF0Y2hNYXAuc2V0KHRleHR1cmUsIG5ldyBTcHJpdGVCYXRjaChtYXhTcHJpdGVDb3VudCkpXHJcbiAgICByZXR1cm4gdGV4dHVyZVRvQmF0Y2hNYXAuZ2V0KHRleHR1cmUpXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFRleHR1cmUgPSAoaW1hZ2UpID0+IHtcclxuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcclxuXHJcbiAgICBpbWFnZVRvVGV4dHVyZU1hcC5zZXQoaW1hZ2UsIHRleHR1cmUpXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSlcclxuICAgIHJldHVybiB0ZXh0dXJlXHJcbiAgfVxyXG5cclxuICB0aGlzLnJlc2l6ZSA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XHJcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XHJcbiAgICBsZXQgdGFyZ2V0UmF0aW8gPSB3aWR0aCAvIGhlaWdodFxyXG4gICAgbGV0IHVzZVdpZHRoICAgID0gcmF0aW8gPj0gdGFyZ2V0UmF0aW9cclxuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxyXG4gICAgbGV0IG5ld0hlaWdodCAgID0gdXNlV2lkdGggPyAod2lkdGggLyByYXRpbykgOiBoZWlnaHRcclxuXHJcbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gbmV3SGVpZ2h0IFxyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodClcclxuICB9XHJcblxyXG4gIHRoaXMuYWRkU3ByaXRlID0gKGltYWdlLCB3LCBoLCB4LCB5LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KSA9PiB7XHJcbiAgICBsZXQgdHggICAgPSBpbWFnZVRvVGV4dHVyZU1hcC5nZXQoaW1hZ2UpIHx8IHRoaXMuYWRkVGV4dHVyZShpbWFnZSlcclxuICAgIGxldCBiYXRjaCA9IHRleHR1cmVUb0JhdGNoTWFwLmdldCh0eCkgfHwgdGhpcy5hZGRCYXRjaCh0eClcclxuXHJcbiAgICBzZXRCb3goYmF0Y2guYm94ZXMsIGJhdGNoLmNvdW50LCB3LCBoLCB4LCB5KVxyXG4gICAgc2V0Qm94KGJhdGNoLnRleENvb3JkcywgYmF0Y2guY291bnQsIHRleHcsIHRleGgsIHRleHgsIHRleHkpXHJcbiAgICBiYXRjaC5jb3VudCsrXHJcbiAgfVxyXG5cclxuICB0aGlzLmFkZFBvbHlnb24gPSAodmVydGljZXMsIGluZGljZXMsIHZlcnRleENvbG9ycykgPT4ge1xyXG4gICAgbGV0IHZlcnRleENvdW50ID0gaW5kaWNlcy5sZW5ndGhcclxuXHJcbiAgICBwb2x5Z29uQmF0Y2gudmVydGljZXMuc2V0KHZlcnRpY2VzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kaWNlcy5zZXQoaW5kaWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxyXG4gICAgcG9seWdvbkJhdGNoLnZlcnRleENvbG9ycy5zZXQodmVydGV4Q29sb3JzLCBwb2x5Z29uQmF0Y2guaW5kZXgpXHJcbiAgICBwb2x5Z29uQmF0Y2guaW5kZXggKz0gdmVydGV4Q291bnRcclxuICB9XHJcblxyXG4gIGxldCByZXNldFBvbHlnb25zID0gKGJhdGNoKSA9PiBiYXRjaC5pbmRleCA9IDBcclxuXHJcbiAgbGV0IGRyYXdQb2x5Z29ucyA9IChiYXRjaCkgPT4ge1xyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBcclxuICAgICAgdmVydGV4QnVmZmVyLCBcclxuICAgICAgdmVydGV4TG9jYXRpb24sIFxyXG4gICAgICBQT0lOVF9ESU1FTlNJT04sIFxyXG4gICAgICBiYXRjaC52ZXJ0aWNlcylcclxuICAgIHVwZGF0ZUJ1ZmZlcihcclxuICAgICAgZ2wsIFxyXG4gICAgICB2ZXJ0ZXhDb2xvckJ1ZmZlciwgXHJcbiAgICAgIHZlcnRleENvbG9yTG9jYXRpb24sIFxyXG4gICAgICBDT0xPUl9DSEFOTkVMX0NPVU5ULCBcclxuICAgICAgYmF0Y2gudmVydGV4Q29sb3JzKVxyXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kZXhCdWZmZXIpXHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBiYXRjaC5pbmRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpXHJcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBiYXRjaC5pbmRleCwgZ2wuVU5TSUdORURfU0hPUlQsIDApXHJcbiAgICAvL2dsLmRyYXdFbGVtZW50cyhnbC5MSU5FX0xPT1AsIGJhdGNoLmluZGV4LCBnbC5VTlNJR05FRF9TSE9SVCwgMClcclxuICB9XHJcblxyXG4gIGxldCByZXNldEJhdGNoID0gKGJhdGNoKSA9PiBiYXRjaC5jb3VudCA9IDBcclxuXHJcbiAgbGV0IGRyYXdCYXRjaCA9IChiYXRjaCwgdGV4dHVyZSkgPT4ge1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSlcclxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgYm94QnVmZmVyLCBib3hMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC5ib3hlcylcclxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXHJcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgc2NhbGVCdWZmZXIsIHNjYWxlTG9jYXRpb24sIFBPSU5UX0RJTUVOU0lPTiwgc2NhbGVzKVxyXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHJvdGF0aW9uQnVmZmVyLCByb3RMb2NhdGlvbiwgMSwgcm90YXRpb25zKVxyXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC50ZXhDb29yZHMpXHJcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgYmF0Y2guY291bnQgKiBQT0lOVFNfUEVSX0JPWClcclxuICB9XHJcblxyXG4gIHRoaXMuZmx1c2ggPSAoKSA9PiB7XHJcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKHJlc2V0QmF0Y2gpXHJcbiAgICByZXNldFBvbHlnb25zKHBvbHlnb25CYXRjaClcclxuICB9XHJcblxyXG4gIHRoaXMucmVuZGVyID0gKCkgPT4ge1xyXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcclxuXHJcbiAgICAvL1Nwcml0ZXNoZWV0IGJhdGNoIHJlbmRlcmluZ1xyXG4gICAgZ2wudXNlUHJvZ3JhbShzcHJpdGVQcm9ncmFtKVxyXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcclxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiwgMTkyMCwgMTA4MClcclxuICAgIHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2goZHJhd0JhdGNoKVxyXG5cclxuICAgIC8vcG9sZ29uIHJlbmRlcmluZ1xyXG4gICAgZ2wudXNlUHJvZ3JhbShwb2x5Z29uUHJvZ3JhbSlcclxuICAgIC8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXHJcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplUG9seWdvbkxvY2F0aW9uLCAxOTIwLCAxMDgwKVxyXG4gICAgZHJhd1BvbHlnb25zKHBvbHlnb25CYXRjaClcclxuICB9XHJcbn1cclxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IElucHV0TWFuYWdlciA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxyXG5sZXQgQ2xvY2sgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxyXG5sZXQgR0xSZW5kZXJlciAgID0gcmVxdWlyZShcIi4vR0xSZW5kZXJlclwiKVxyXG5sZXQgQXVkaW9TeXN0ZW0gID0gcmVxdWlyZShcIi4vQXVkaW9TeXN0ZW1cIilcclxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBFbnRpdHlTdG9yZSAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcclxubGV0IFNjZW5lTWFuYWdlciA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lXHJcblxyXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxyXG5mdW5jdGlvbiBHYW1lIChjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLCByZW5kZXJlciwgYXVkaW9TeXN0ZW0sIFxyXG4gICAgICAgICAgICAgICBlbnRpdHlTdG9yZSwgc2NlbmVNYW5hZ2VyKSB7XHJcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcclxuICBjaGVja1R5cGUoY2FjaGUsIENhY2hlKVxyXG4gIGNoZWNrVHlwZShpbnB1dE1hbmFnZXIsIElucHV0TWFuYWdlcilcclxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXHJcbiAgY2hlY2tUeXBlKHJlbmRlcmVyLCBHTFJlbmRlcmVyKVxyXG4gIGNoZWNrVHlwZShhdWRpb1N5c3RlbSwgQXVkaW9TeXN0ZW0pXHJcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcclxuICBjaGVja1R5cGUoc2NlbmVNYW5hZ2VyLCBTY2VuZU1hbmFnZXIpXHJcblxyXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcclxuICB0aGlzLmNhY2hlICAgICAgICA9IGNhY2hlIFxyXG4gIHRoaXMubG9hZGVyICAgICAgID0gbG9hZGVyXHJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcclxuICB0aGlzLnJlbmRlcmVyICAgICA9IHJlbmRlcmVyXHJcbiAgdGhpcy5hdWRpb1N5c3RlbSAgPSBhdWRpb1N5c3RlbVxyXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcclxuICB0aGlzLnNjZW5lTWFuYWdlciA9IHNjZW5lTWFuYWdlclxyXG5cclxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuc2NlbmVNYW5hZ2VyLnNjZW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgdGhpcy5zY2VuZU1hbmFnZXIuc2NlbmVzW2ldLmdhbWUgPSB0aGlzXHJcbiAgfVxyXG59XHJcblxyXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICBsZXQgc3RhcnRTY2VuZSA9IHRoaXMuc2NlbmVNYW5hZ2VyLmFjdGl2ZVNjZW5lXHJcblxyXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXHJcbiAgc3RhcnRTY2VuZS5zZXR1cCgoZXJyKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIGNvbXBsZXRlZFwiKSlcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAvL3doYXQgZG9lcyB0aGlzIGV2ZW4gbWVhbj9cclxufVxyXG4iLCJsZXQge2NoZWNrVHlwZX0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxyXG5sZXQgS2V5Ym9hcmRNYW5hZ2VyID0gcmVxdWlyZShcIi4vS2V5Ym9hcmRNYW5hZ2VyXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0TWFuYWdlclxyXG5cclxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xyXG5mdW5jdGlvbiBJbnB1dE1hbmFnZXIgKGtleWJvYXJkTWFuYWdlcikge1xyXG4gIGNoZWNrVHlwZShrZXlib2FyZE1hbmFnZXIsIEtleWJvYXJkTWFuYWdlcilcclxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkTWFuYWdlclxyXG5cclxuY29uc3QgS0VZX0NPVU5UID0gMjU2XHJcblxyXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XHJcbiAgbGV0IGlzRG93bnMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3REb3ducyAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXHJcbiAgbGV0IGRvd25EdXJhdGlvbnMgPSBuZXcgVWludDMyQXJyYXkoS0VZX0NPVU5UKVxyXG4gIFxyXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xyXG4gICAganVzdERvd25zW2tleUNvZGVdID0gIWlzRG93bnNba2V5Q29kZV1cclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IHRydWVcclxuICB9XHJcblxyXG4gIGxldCBoYW5kbGVLZXlVcCA9ICh7a2V5Q29kZX0pID0+IHtcclxuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcclxuICAgIGlzRG93bnNba2V5Q29kZV0gICA9IGZhbHNlXHJcbiAgfVxyXG5cclxuICBsZXQgaGFuZGxlQmx1ciA9ICgpID0+IHtcclxuICAgIGxldCBpID0gLTFcclxuXHJcbiAgICB3aGlsZSAoKytpIDwgS0VZX0NPVU5UKSB7XHJcbiAgICAgIGlzRG93bnNbaV0gICA9IDBcclxuICAgICAganVzdERvd25zW2ldID0gMFxyXG4gICAgICBqdXN0VXBzW2ldICAgPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmlzRG93bnMgICAgICAgPSBpc0Rvd25zXHJcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xyXG4gIHRoaXMuanVzdERvd25zICAgICA9IGp1c3REb3duc1xyXG4gIHRoaXMuZG93bkR1cmF0aW9ucyA9IGRvd25EdXJhdGlvbnNcclxuXHJcbiAgdGhpcy50aWNrID0gKGRUKSA9PiB7XHJcbiAgICBsZXQgaSA9IC0xXHJcblxyXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xyXG4gICAgICBqdXN0RG93bnNbaV0gPSBmYWxzZSBcclxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcclxuICAgICAgaWYgKGlzRG93bnNbaV0pIGRvd25EdXJhdGlvbnNbaV0gKz0gZFRcclxuICAgICAgZWxzZSAgICAgICAgICAgIGRvd25EdXJhdGlvbnNbaV0gPSAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBoYW5kbGVLZXlVcClcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyKVxyXG59XHJcbiIsImxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIEtleWZyYW1lQW5pbWF0aW9uU3lzdGVtICgpIHtcclxuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJyZW5kZXJhYmxlXCIsIFwiYW5pbWF0ZWRcIl0pXHJcbn1cclxuXHJcbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IGRUICA9IHNjZW5lLmdhbWUuY2xvY2suZFRcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCB0aW1lTGVmdFxyXG4gIGxldCBjdXJyZW50SW5kZXhcclxuICBsZXQgY3VycmVudEFuaW1cclxuICBsZXQgY3VycmVudEZyYW1lXHJcbiAgbGV0IG5leHRGcmFtZVxyXG4gIGxldCBvdmVyc2hvb3RcclxuICBsZXQgc2hvdWxkQWR2YW5jZVxyXG5cclxuICB3aGlsZSAoKytpIDwgbGVuKSB7XHJcbiAgICBlbnQgICAgICAgICAgID0gZW50aXRpZXNbaV0gXHJcbiAgICBjdXJyZW50SW5kZXggID0gZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleFxyXG4gICAgY3VycmVudEFuaW0gICA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uXHJcbiAgICBjdXJyZW50RnJhbWUgID0gY3VycmVudEFuaW0uZnJhbWVzW2N1cnJlbnRJbmRleF1cclxuICAgIG5leHRGcmFtZSAgICAgPSBjdXJyZW50QW5pbS5mcmFtZXNbY3VycmVudEluZGV4ICsgMV0gfHwgY3VycmVudEFuaW0uZnJhbWVzWzBdXHJcbiAgICB0aW1lTGVmdCAgICAgID0gZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lXHJcbiAgICBvdmVyc2hvb3QgICAgID0gdGltZUxlZnQgLSBkVCAgIFxyXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXHJcbiAgICAgIFxyXG4gICAgaWYgKHNob3VsZEFkdmFuY2UpIHtcclxuICAgICAgZW50LmFuaW1hdGVkLmN1cnJlbnRBbmltYXRpb25JbmRleCA9IGN1cnJlbnRBbmltLmZyYW1lcy5pbmRleE9mKG5leHRGcmFtZSlcclxuICAgICAgZW50LmFuaW1hdGVkLnRpbWVUaWxsTmV4dEZyYW1lICAgICA9IG5leHRGcmFtZS5kdXJhdGlvbiArIG92ZXJzaG9vdCBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVudC5hbmltYXRlZC50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiZnVuY3Rpb24gTG9hZGVyICgpIHtcclxuICBsZXQgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0XHJcblxyXG4gIGxldCBsb2FkWEhSID0gKHR5cGUpID0+IHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcclxuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcclxuXHJcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QgXHJcblxyXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gdHlwZVxyXG4gICAgICB4aHIub25sb2FkICAgICAgID0gKCkgPT4gY2IobnVsbCwgeGhyLnJlc3BvbnNlKVxyXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcclxuICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcclxuICAgICAgeGhyLnNlbmQobnVsbClcclxuICAgIH0gXHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxyXG4gIGxldCBsb2FkU3RyaW5nID0gbG9hZFhIUihcInN0cmluZ1wiKVxyXG5cclxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXHJcblxyXG4gIHRoaXMubG9hZFRleHR1cmUgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXHJcbiAgICBsZXQgb25sb2FkICA9ICgpID0+IGNiKG51bGwsIGkpXHJcbiAgICBsZXQgb25lcnJvciA9ICgpID0+IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpXHJcbiAgICBcclxuICAgIGkub25sb2FkICA9IG9ubG9hZFxyXG4gICAgaS5vbmVycm9yID0gb25lcnJvclxyXG4gICAgaS5zcmMgICAgID0gcGF0aFxyXG4gIH1cclxuXHJcbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcclxuICAgIGxvYWRCdWZmZXIocGF0aCwgKGVyciwgYmluYXJ5KSA9PiB7XHJcbiAgICAgIGxldCBkZWNvZGVTdWNjZXNzID0gKGJ1ZmZlcikgPT4gY2IobnVsbCwgYnVmZmVyKSAgIFxyXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXHJcblxyXG4gICAgICBhdWRpb0N0eC5kZWNvZGVBdWRpb0RhdGEoYmluYXJ5LCBkZWNvZGVTdWNjZXNzLCBkZWNvZGVGYWlsdXJlKVxyXG4gICAgfSkgXHJcbiAgfVxyXG5cclxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xyXG4gICAgbGV0IHNvdW5kS2V5cyAgICA9IE9iamVjdC5rZXlzKHNvdW5kcyB8fCB7fSlcclxuICAgIGxldCB0ZXh0dXJlS2V5cyAgPSBPYmplY3Qua2V5cyh0ZXh0dXJlcyB8fCB7fSlcclxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxyXG4gICAgbGV0IHNvdW5kQ291bnQgICA9IHNvdW5kS2V5cy5sZW5ndGhcclxuICAgIGxldCB0ZXh0dXJlQ291bnQgPSB0ZXh0dXJlS2V5cy5sZW5ndGhcclxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxyXG4gICAgbGV0IGkgICAgICAgICAgICA9IC0xXHJcbiAgICBsZXQgaiAgICAgICAgICAgID0gLTFcclxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxyXG4gICAgbGV0IG91dCAgICAgICAgICA9IHtcclxuICAgICAgc291bmRzOnt9LCB0ZXh0dXJlczoge30sIHNoYWRlcnM6IHt9IFxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjaGVja0RvbmUgPSAoKSA9PiB7XHJcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XHJcbiAgICAgIHNvdW5kQ291bnQtLVxyXG4gICAgICBvdXQuc291bmRzW25hbWVdID0gZGF0YVxyXG4gICAgICBjaGVja0RvbmUoKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xyXG4gICAgICB0ZXh0dXJlQ291bnQtLVxyXG4gICAgICBvdXQudGV4dHVyZXNbbmFtZV0gPSBkYXRhXHJcbiAgICAgIGNoZWNrRG9uZSgpXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgc2hhZGVyQ291bnQtLVxyXG4gICAgICBvdXQuc2hhZGVyc1tuYW1lXSA9IGRhdGFcclxuICAgICAgY2hlY2tEb25lKClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcclxuICAgICAgbGV0IGtleSA9IHNvdW5kS2V5c1tpXVxyXG5cclxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNvdW5kKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlICh0ZXh0dXJlS2V5c1srK2pdKSB7XHJcbiAgICAgIGxldCBrZXkgPSB0ZXh0dXJlS2V5c1tqXVxyXG5cclxuICAgICAgdGhpcy5sb2FkVGV4dHVyZSh0ZXh0dXJlc1trZXldLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgcmVnaXN0ZXJUZXh0dXJlKGtleSwgZGF0YSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHdoaWxlIChzaGFkZXJLZXlzWysra10pIHtcclxuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cclxuXHJcbiAgICAgIHRoaXMubG9hZFNoYWRlcihzaGFkZXJzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxyXG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXHJcblxyXG5mdW5jdGlvbiBQYWRkbGVNb3ZlclN5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXHJcbn1cclxuXHJcblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgbGV0IHtjbG9jaywgaW5wdXRNYW5hZ2VyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQge2tleWJvYXJkTWFuYWdlcn0gPSBpbnB1dE1hbmFnZXJcclxuICBsZXQgbW92ZVNwZWVkID0gMVxyXG4gIGxldCBwYWRkbGUgICAgPSBlbnRpdGllc1swXVxyXG5cclxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcclxuICBpZiAoIXBhZGRsZSkgcmV0dXJuXHJcblxyXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcclxuICBpZiAoa2V5Ym9hcmRNYW5hZ2VyLmlzRG93bnNbMzldKSBwYWRkbGUucGh5c2ljcy54ICs9IGNsb2NrLmRUICogbW92ZVNwZWVkXHJcbn1cclxuIiwibGV0IHtzZXRCb3h9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcclxubGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJpbmdTeXN0ZW1cclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmluZ1N5c3RlbSAoKSB7XHJcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInJlbmRlcmFibGVcIl0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvbHlnb24gKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpIHtcclxuICB0aGlzLnZlcnRpY2VzICAgICA9IHZlcnRpY2VzXHJcbiAgdGhpcy5pbmRpY2VzICAgICAgPSBpbmRpY2VzXHJcbiAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSB2ZXJ0ZXhDb2xvcnNcclxufVxyXG5cclxuY29uc3QgUE9JTlRTX1BFUl9WRVJURVggICA9IDJcclxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcclxuY29uc3QgSU5ESUNFU19QRVJfUVVBRCAgICA9IDZcclxuY29uc3QgUVVBRF9WRVJURVhfU0laRSAgICA9IDhcclxuY29uc3QgUVVBRF9DT0xPUl9TSVpFICAgICA9IDE2XHJcblxyXG5mdW5jdGlvbiBzZXRWZXJ0ZXggKHZlcnRpY2VzLCBpbmRleCwgeCwgeSkge1xyXG4gIGxldCBpID0gaW5kZXggKiBQT0lOVFNfUEVSX1ZFUlRFWFxyXG5cclxuICB2ZXJ0aWNlc1tpXSAgID0geFxyXG4gIHZlcnRpY2VzW2krMV0gPSB5XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldENvbG9yIChjb2xvcnMsIGluZGV4LCBjb2xvcikge1xyXG4gIGxldCBpID0gaW5kZXggKiBDT0xPUl9DSEFOTkVMX0NPVU5UXHJcblxyXG4gIGNvbG9ycy5zZXQoY29sb3IsIGkpXHJcbn1cclxuXHJcbi8vY29sb3JzIHBhc3NlZCBpbiBhcyA0IGxlbmd0aCBhcnJheXMgW3IsIGcsIGIsIGFdXHJcbi8vKGksIGkgKyBzbGljZUNvdW50ICsgMSwgaSArIDEpLCAoaSArIHNsaWNlQ291bnQgKyAxLCBpICsgc2xpY2VDb3VudCArIDIsIGkgKyAxKVxyXG5mdW5jdGlvbiBjcmVhdGVXYXRlciAodywgaCwgeCwgeSwgc2xpY2VDb3VudCwgdG9wQ29sb3IsIGJvdHRvbUNvbG9yKSB7XHJcbiAgbGV0IHZlcnRleENvdW50ICA9IDIgKyAoc2xpY2VDb3VudCAqIDIpXHJcbiAgbGV0IHZlcnRpY2VzICAgICA9IG5ldyBGbG9hdDMyQXJyYXkodmVydGV4Q291bnQgKiBQT0lOVFNfUEVSX1ZFUlRFWClcclxuICBsZXQgdmVydGV4Q29sb3JzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIENPTE9SX0NIQU5ORUxfQ09VTlQpXHJcbiAgbGV0IGluZGljZXMgICAgICA9IG5ldyBVaW50MTZBcnJheShJTkRJQ0VTX1BFUl9RVUFEICogc2xpY2VDb3VudClcclxuICBsZXQgdW5pdFdpZHRoICAgID0gdyAvIHNsaWNlQ291bnRcclxuICBsZXQgaSAgICAgICAgICAgID0gLTFcclxuICBsZXQgaiAgICAgICAgICAgID0gLTFcclxuXHJcbiAgd2hpbGUgKCArK2kgPD0gc2xpY2VDb3VudCApIHtcclxuICAgIHNldFZlcnRleCh2ZXJ0aWNlcywgaSwgKHggKyB1bml0V2lkdGggKiBpKSwgeSlcclxuICAgIHNldENvbG9yKHZlcnRleENvbG9ycywgaSwgdG9wQ29sb3IpXHJcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGkgKyBzbGljZUNvdW50ICsgMSwgKHggKyB1bml0V2lkdGggKiBpKSwgeSArIGgpXHJcbiAgICBzZXRDb2xvcih2ZXJ0ZXhDb2xvcnMsIGkgKyBzbGljZUNvdW50ICsgMSwgYm90dG9tQ29sb3IpXHJcbiAgfVxyXG5cclxuICB3aGlsZSAoICsrIGogPCBzbGljZUNvdW50ICkge1xyXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQURdICAgPSBqXHJcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCsxXSA9IGogKyBzbGljZUNvdW50ICsgMVxyXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMl0gPSBqICsgMVxyXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrM10gPSBqICsgc2xpY2VDb3VudCArIDFcclxuICAgIGluZGljZXNbaipJTkRJQ0VTX1BFUl9RVUFEKzRdID0gaiArIHNsaWNlQ291bnQgKyAyXHJcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCs1XSA9IGogKyAxXHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IFBvbHlnb24odmVydGljZXMsIGluZGljZXMsIHZlcnRleENvbG9ycylcclxufVxyXG5cclxud2luZG93LmNyZWF0ZVdhdGVyID0gY3JlYXRlV2F0ZXJcclxuXHJcbmxldCB3YXRlclZlcnRzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgMCwgICAgODAwLFxyXG4gIDE5MjAsIDgwMCxcclxuICAwLCAgICAxMDgwLFxyXG4gIDE5MjAsIDEwODAgXHJcbl0pXHJcbmxldCB3YXRlckluZGljZXMgPSBuZXcgVWludDE2QXJyYXkoW1xyXG4gIDAsIDIsIDEsXHJcbiAgMiwgMywgMSBcclxuXSlcclxubGV0IHdhdGVyQ29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgMCwgMCwgMC41LCAuNixcclxuICAwLCAwLCAwLjUsIC42LFxyXG4gIDAsIDAsIDEsICAgMSxcclxuICAwLCAwLCAxLCAgIDFcclxuXSlcclxuXHJcbi8vbGV0IHdhdGVyID0gbmV3IFBvbHlnb24od2F0ZXJWZXJ0cywgd2F0ZXJJbmRpY2VzLCB3YXRlckNvbG9ycylcclxubGV0IHdhdGVyID0gY3JlYXRlV2F0ZXIoMTkyMCwgMjgwLCAwLCA4MDAsIDEwMCwgWzAsMCwuNSwgLjZdLCBbMCwwLDEsMV0pXHJcblxyXG5mb3IgKHZhciBpID0gMDsgaSA8IDEwMDsgKytpKSB7XHJcbiAgd2F0ZXIudmVydGljZXNbaSoyICsgMV0gKz0gKE1hdGguc2luKGkpICogMTApXHJcbn1cclxuXHJcbndpbmRvdy53YXRlciA9IHdhdGVyXHJcblxyXG5SZW5kZXJpbmdTeXN0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzY2VuZSwgZW50aXRpZXMpIHtcclxuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcclxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXHJcbiAgbGV0IGkgICA9IC0xXHJcbiAgbGV0IGVudFxyXG4gIGxldCBmcmFtZVxyXG5cclxuICByZW5kZXJlci5mbHVzaCgpXHJcblxyXG4gIC8vVE9ETzogRm9yIHRlc3Rpbmcgb2YgcG9seWdvbiByZW5kZXJpbmdcclxuICByZW5kZXJlci5hZGRQb2x5Z29uKHdhdGVyLnZlcnRpY2VzLCB3YXRlci5pbmRpY2VzLCB3YXRlci52ZXJ0ZXhDb2xvcnMpXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIGVudCA9IGVudGl0aWVzW2ldXHJcblxyXG4gICAgaWYgKGVudC5hbmltYXRlZCkge1xyXG4gICAgICBmcmFtZSA9IGVudC5hbmltYXRlZC5jdXJyZW50QW5pbWF0aW9uLmZyYW1lc1tlbnQuYW5pbWF0ZWQuY3VycmVudEFuaW1hdGlvbkluZGV4XVxyXG4gICAgICByZW5kZXJlci5hZGRTcHJpdGUoXHJcbiAgICAgICAgZW50LnJlbmRlcmFibGUuaW1hZ2UsIC8vaW1hZ2VcclxuICAgICAgICBlbnQucGh5c2ljcy53aWR0aCxcclxuICAgICAgICBlbnQucGh5c2ljcy5oZWlnaHQsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueCxcclxuICAgICAgICBlbnQucGh5c2ljcy55LFxyXG4gICAgICAgIGZyYW1lLmFhYmIudyAvIGVudC5yZW5kZXJhYmxlLmltYWdlLndpZHRoLFxyXG4gICAgICAgIGZyYW1lLmFhYmIuaCAvIGVudC5yZW5kZXJhYmxlLmltYWdlLmhlaWdodCxcclxuICAgICAgICBmcmFtZS5hYWJiLnggLyBlbnQucmVuZGVyYWJsZS5pbWFnZS53aWR0aCxcclxuICAgICAgICBmcmFtZS5hYWJiLnkgLyBlbnQucmVuZGVyYWJsZS5pbWFnZS5oZWlnaHRcclxuICAgICAgKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxyXG4gICAgICAgIGVudC5yZW5kZXJhYmxlLmltYWdlLCAvL2ltYWdlXHJcbiAgICAgICAgZW50LnBoeXNpY3Mud2lkdGgsXHJcbiAgICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxyXG4gICAgICAgIGVudC5waHlzaWNzLngsXHJcbiAgICAgICAgZW50LnBoeXNpY3MueSxcclxuICAgICAgICAxLCAgLy90ZXh0dXJlIHdpZHRoXHJcbiAgICAgICAgMSwgIC8vdGV4dHVyZSBoZWlnaHRcclxuICAgICAgICAwLCAgLy90ZXh0dXJlIHhcclxuICAgICAgICAwICAgLy90ZXh0dXJlIHlcclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFNjZW5lXHJcblxyXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xyXG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IEVycm9yKFwiU2NlbmUgY29uc3RydWN0b3IgcmVxdWlyZXMgYSBuYW1lXCIpXHJcblxyXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcclxuICB0aGlzLnN5c3RlbXMgPSBzeXN0ZW1zXHJcbiAgdGhpcy5nYW1lICAgID0gbnVsbFxyXG59XHJcblxyXG5TY2VuZS5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBjYihudWxsLCBudWxsKSAgXHJcbn1cclxuXHJcblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZFQpIHtcclxuICBsZXQgc3RvcmUgPSB0aGlzLmdhbWUuZW50aXR5U3RvcmVcclxuICBsZXQgbGVuICAgPSB0aGlzLnN5c3RlbXMubGVuZ3RoXHJcbiAgbGV0IGkgICAgID0gLTFcclxuICBsZXQgc3lzdGVtXHJcblxyXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcclxuICAgIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXSBcclxuICAgIHN5c3RlbS5ydW4odGhpcywgc3RvcmUucXVlcnkoc3lzdGVtLmNvbXBvbmVudE5hbWVzKSlcclxuICB9XHJcbn1cclxuIiwibGV0IHtmaW5kV2hlcmV9ID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lTWFuYWdlclxyXG5cclxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcclxuICBpZiAoc2NlbmVzLmxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgb25lIG9yIG1vcmUgc2NlbmVzXCIpXHJcblxyXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxyXG4gIGxldCBzY2VuZXMgICAgICAgICAgID0gc2NlbmVzXHJcblxyXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcclxuICB0aGlzLmFjdGl2ZVNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXhdXHJcblxyXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xyXG4gICAgbGV0IHNjZW5lID0gZmluZFdoZXJlKFwibmFtZVwiLCBzY2VuZU5hbWUsIHNjZW5lcylcclxuXHJcbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxyXG5cclxuICAgIGFjdGl2ZVNjZW5lSW5kZXggPSBzY2VuZXMuaW5kZXhPZihzY2VuZSlcclxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxyXG4gIH1cclxuXHJcbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgbGV0IHNjZW5lID0gc2NlbmVzW2FjdGl2ZVNjZW5lSW5kZXggKyAxXVxyXG5cclxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxyXG5cclxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZXNbKythY3RpdmVTY2VuZUluZGV4XVxyXG4gIH1cclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbVxyXG5cclxuZnVuY3Rpb24gU3lzdGVtIChjb21wb25lbnROYW1lcz1bXSkge1xyXG4gIHRoaXMuY29tcG9uZW50TmFtZXMgPSBjb21wb25lbnROYW1lc1xyXG59XHJcblxyXG4vL3NjZW5lLmdhbWUuY2xvY2tcclxuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XHJcbiAgLy9kb2VzIHNvbWV0aGluZyB3LyB0aGUgbGlzdCBvZiBlbnRpdGllcyBwYXNzZWQgdG8gaXRcclxufVxyXG4iLCJsZXQge1BhZGRsZSwgQmxvY2ssIEZpZ2h0ZXJ9ID0gcmVxdWlyZShcIi4vYXNzZW1ibGFnZXNcIilcclxubGV0IFBhZGRsZU1vdmVyU3lzdGVtICAgICAgID0gcmVxdWlyZShcIi4vUGFkZGxlTW92ZXJTeXN0ZW1cIilcclxubGV0IFJlbmRlcmluZ1N5c3RlbSAgICAgICAgID0gcmVxdWlyZShcIi4vUmVuZGVyaW5nU3lzdGVtXCIpXHJcbmxldCBLZXlmcmFtZUFuaW1hdGlvblN5c3RlbSA9IHJlcXVpcmUoXCIuL0tleWZyYW1lQW5pbWF0aW9uU3lzdGVtXCIpXHJcbmxldCBTY2VuZSAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1NjZW5lXCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTY2VuZVxyXG5cclxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcclxuICBsZXQgc3lzdGVtcyA9IFtcclxuICAgIG5ldyBQYWRkbGVNb3ZlclN5c3RlbSwgXHJcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXHJcbiAgICBuZXcgUmVuZGVyaW5nU3lzdGVtXHJcbiAgXVxyXG5cclxuICBTY2VuZS5jYWxsKHRoaXMsIFwidGVzdFwiLCBzeXN0ZW1zKVxyXG59XHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY2VuZS5wcm90b3R5cGUpXHJcblxyXG5UZXN0U2NlbmUucHJvdG90eXBlLnNldHVwID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgbGV0IHtjYWNoZSwgbG9hZGVyLCBlbnRpdHlTdG9yZSwgYXVkaW9TeXN0ZW19ID0gdGhpcy5nYW1lIFxyXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcclxuICBsZXQgYXNzZXRzID0ge1xyXG4gICAgLy9zb3VuZHM6IHsgYmdNdXNpYzogXCIvcHVibGljL3NvdW5kcy9iZ20xLm1wM1wiIH0sXHJcbiAgICB0ZXh0dXJlczogeyBcclxuICAgICAgcGFkZGxlOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9wYWRkbGUucG5nXCIsXHJcbiAgICAgIGJsb2NrczogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvYmxvY2tzLnBuZ1wiLFxyXG4gICAgICBmaWdodGVyOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3B1bmNoLnBuZ1wiXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsb2FkZXIubG9hZEFzc2V0cyhhc3NldHMsIGZ1bmN0aW9uIChlcnIsIGxvYWRlZEFzc2V0cykge1xyXG4gICAgbGV0IHt0ZXh0dXJlcywgc291bmRzfSA9IGxvYWRlZEFzc2V0cyBcclxuXHJcbiAgICBjYWNoZS5zb3VuZHMgICA9IHNvdW5kc1xyXG4gICAgY2FjaGUudGV4dHVyZXMgPSB0ZXh0dXJlc1xyXG4gICAgZW50aXR5U3RvcmUuYWRkRW50aXR5KG5ldyBQYWRkbGUodGV4dHVyZXMucGFkZGxlLCAxMTIsIDI1LCA0MDAsIDQwMCkpXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEJsb2NrKHRleHR1cmVzLmJsb2NrcywgNDQsIDIyLCA4MDAsIDgwMCkpXHJcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IEZpZ2h0ZXIodGV4dHVyZXMuZmlnaHRlciwgNzYsIDU5LCA1MDAsIDUwMCkpXHJcbiAgICAvL2JnLnZvbHVtZSA9IDBcclxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcclxuICAgIGNiKG51bGwpXHJcbiAgfSlcclxufVxyXG4iLCJsZXQge1JlbmRlcmFibGUsIFBoeXNpY3MsIFBsYXllckNvbnRyb2xsZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxyXG5sZXQge0FuaW1hdGVkfSA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudHNcIilcclxubGV0IEFuaW1hdGlvbiA9IHJlcXVpcmUoXCIuL0FuaW1hdGlvblwiKVxyXG5sZXQgRW50aXR5ICAgID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgID0gUGFkZGxlXHJcbm1vZHVsZS5leHBvcnRzLkJsb2NrICAgPSBCbG9ja1xyXG5tb2R1bGUuZXhwb3J0cy5GaWdodGVyID0gRmlnaHRlclxyXG5cclxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxyXG59XHJcblxyXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcclxuICBFbnRpdHkuY2FsbCh0aGlzKVxyXG4gIFJlbmRlcmFibGUodGhpcywgaW1hZ2UsIHcsIGgpXHJcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxyXG4gIEFuaW1hdGVkKHRoaXMsIFwiaWRsZVwiLCB7XHJcbiAgICBpZGxlOiBBbmltYXRpb24uY3JlYXRlTGluZWFyKDQ0LCAyMiwgMCwgMCwgMywgdHJ1ZSwgMTAwMClcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBGaWdodGVyIChpbWFnZSwgdywgaCwgeCwgeSkge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMpXHJcbiAgUmVuZGVyYWJsZSh0aGlzLCBpbWFnZSwgdywgaClcclxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXHJcbiAgQW5pbWF0ZWQodGhpcywgXCJmaXJlYmFsbFwiLCB7XHJcbiAgICBmaXJlYmFsbDogQW5pbWF0aW9uLmNyZWF0ZUxpbmVhcigxNzQsIDEzNCwgMCwgMCwgMjUsIHRydWUpXHJcbiAgfSlcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5SZW5kZXJhYmxlICAgICAgID0gUmVuZGVyYWJsZVxyXG5tb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgICAgICAgID0gUGh5c2ljc1xyXG5tb2R1bGUuZXhwb3J0cy5QbGF5ZXJDb250cm9sbGVkID0gUGxheWVyQ29udHJvbGxlZFxyXG5tb2R1bGUuZXhwb3J0cy5BbmltYXRlZCAgICAgICAgID0gQW5pbWF0ZWRcclxuXHJcbmZ1bmN0aW9uIFJlbmRlcmFibGUgKGUsIGltYWdlLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgZS5yZW5kZXJhYmxlID0ge1xyXG4gICAgaW1hZ2UsXHJcbiAgICB3aWR0aCxcclxuICAgIGhlaWdodCxcclxuICAgIHJvdGF0aW9uOiAwLFxyXG4gICAgY2VudGVyOiB7XHJcbiAgICAgIHg6IHdpZHRoIC8gMixcclxuICAgICAgeTogaGVpZ2h0IC8gMiBcclxuICAgIH0sXHJcbiAgICBzY2FsZToge1xyXG4gICAgICB4OiAxLFxyXG4gICAgICB5OiAxIFxyXG4gICAgfVxyXG4gIH0gXHJcbiAgcmV0dXJuIGVcclxufVxyXG5cclxuZnVuY3Rpb24gUGh5c2ljcyAoZSwgd2lkdGgsIGhlaWdodCwgeCwgeSkge1xyXG4gIGUucGh5c2ljcyA9IHtcclxuICAgIHdpZHRoLCBcclxuICAgIGhlaWdodCwgXHJcbiAgICB4LCBcclxuICAgIHksIFxyXG4gICAgZHg6ICAwLCBcclxuICAgIGR5OiAgMCwgXHJcbiAgICBkZHg6IDAsIFxyXG4gICAgZGR5OiAwXHJcbiAgfVxyXG4gIHJldHVybiBlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBsYXllckNvbnRyb2xsZWQgKGUpIHtcclxuICBlLnBsYXllckNvbnRyb2xsZWQgPSB0cnVlXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkIChlLCBkZWZhdWx0QW5pbWF0aW9uTmFtZSwgYW5pbUhhc2gpIHtcclxuICBlLmFuaW1hdGVkID0ge1xyXG4gICAgYW5pbWF0aW9uczogICAgICAgICAgICBhbmltSGFzaCxcclxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lOiAgZGVmYXVsdEFuaW1hdGlvbk5hbWUsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uSW5kZXg6IDAsXHJcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1IYXNoW2RlZmF1bHRBbmltYXRpb25OYW1lXSxcclxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbUhhc2hbZGVmYXVsdEFuaW1hdGlvbk5hbWVdLmZyYW1lc1swXS5kdXJhdGlvblxyXG4gIH0gXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXHJcbm1vZHVsZS5leHBvcnRzLmhhc0tleXMgICA9IGhhc0tleXNcclxuXHJcbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxyXG5mdW5jdGlvbiBmaW5kV2hlcmUgKGtleSwgcHJvcGVydHksIGFycmF5T2ZPYmplY3RzKSB7XHJcbiAgbGV0IGxlbiAgID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoXHJcbiAgbGV0IGkgICAgID0gLTFcclxuICBsZXQgZm91bmQgPSBudWxsXHJcblxyXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xyXG4gICAgaWYgKGFycmF5T2ZPYmplY3RzW2ldW2tleV0gPT09IHByb3BlcnR5KSB7XHJcbiAgICAgIGZvdW5kID0gYXJyYXlPZk9iamVjdHNbaV1cclxuICAgICAgYnJlYWtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZvdW5kXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xyXG4gIGxldCBpID0gLTFcclxuICBcclxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXHJcbiAgcmV0dXJuIHRydWVcclxufVxyXG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcclxuZnVuY3Rpb24gdXBkYXRlQnVmZmVyIChnbCwgYnVmZmVyLCBsb2MsIGNodW5rU2l6ZSwgZGF0YSkge1xyXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXHJcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcclxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpXHJcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy51cGRhdGVCdWZmZXIgPSB1cGRhdGVCdWZmZXJcclxuIiwibW9kdWxlLmV4cG9ydHMuc3ByaXRlVmVydGV4U2hhZGVyID0gXCIgXFxcclxuICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7IFxcXHJcbiAgXFxcclxuICBhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOyBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdGV4Q29vcmQ7IFxcXHJcbiAgXFxcclxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXHJcbiAgXFxcclxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcclxuICBcXFxyXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxyXG4gICAgcmV0dXJuIHBvc2l0aW9uICogMi4wIC0gMS4wOyBcXFxyXG4gIH0gXFxcclxuICBcXFxyXG4gIHZvaWQgbWFpbigpIHsgXFxcclxuICAgIG1hdDIgY2xpcFNwYWNlICAgICA9IG1hdDIoMS4wLCAwLjAsIDAuMCwgLTEuMCk7IFxcXHJcbiAgICB2ZWMyIGZyb21Xb3JsZFNpemUgPSBhX3Bvc2l0aW9uIC8gdV93b3JsZFNpemU7IFxcXHJcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxyXG4gICAgXFxcclxuICAgIHZfdGV4Q29vcmQgID0gYV90ZXhDb29yZDsgXFxcclxuICAgIGdsX1Bvc2l0aW9uID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5zcHJpdGVGcmFnbWVudFNoYWRlciA9IFwiXFxcclxuICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7IFxcXHJcbiAgXFxcclxuICB1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOyBcXFxyXG4gIFxcXHJcbiAgdmFyeWluZyB2ZWMyIHZfdGV4Q29vcmQ7IFxcXHJcbiAgXFxcclxuICB2b2lkIG1haW4oKSB7IFxcXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodV9pbWFnZSwgdl90ZXhDb29yZCk7IFxcXHJcbiAgfVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cy5wb2x5Z29uVmVydGV4U2hhZGVyID0gXCJcXFxyXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdmVydGV4OyBcXFxyXG4gIGF0dHJpYnV0ZSB2ZWM0IGFfdmVydGV4Q29sb3I7IFxcXHJcbiAgdW5pZm9ybSB2ZWMyIHVfd29ybGRTaXplOyBcXFxyXG4gIHZhcnlpbmcgdmVjNCB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxyXG4gICAgcmV0dXJuIHBvc2l0aW9uICogMi4wIC0gMS4wOyBcXFxyXG4gIH0gXFxcclxuICB2b2lkIG1haW4gKCkgeyBcXFxyXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcclxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IGFfdmVydGV4IC8gdV93b3JsZFNpemU7IFxcXHJcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxyXG4gICAgXFxcclxuICAgIHZfdmVydGV4Q29sb3IgPSBhX3ZlcnRleENvbG9yOyBcXFxyXG4gICAgZ2xfUG9zaXRpb24gICA9IHZlYzQocG9zaXRpb24sIDAsIDEpOyBcXFxyXG4gIH1cIlxyXG5cclxubW9kdWxlLmV4cG9ydHMucG9seWdvbkZyYWdtZW50U2hhZGVyID0gXCJcXFxyXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcclxuICBcXFxyXG4gIHZhcnlpbmcgdmVjNCB2X3ZlcnRleENvbG9yOyBcXFxyXG4gIFxcXHJcbiAgdm9pZCBtYWluKCkgeyBcXFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdl92ZXJ0ZXhDb2xvcjsgXFxcclxuICB9XCJcclxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXHJcbmZ1bmN0aW9uIFNoYWRlciAoZ2wsIHR5cGUsIHNyYykge1xyXG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXHJcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxyXG4gIFxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcclxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcclxuXHJcbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxyXG5cclxuICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIk5vdCB2YWxpZCBzaGFkZXI6IFxcblwiICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKVxyXG4gIHJldHVybiAgICAgICAgc2hhZGVyXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XHJcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKHZzLCBmcylcclxuXHJcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxyXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcylcclxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxyXG4gIHJldHVybiBwcm9ncmFtXHJcbn1cclxuXHJcbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcclxuZnVuY3Rpb24gVGV4dHVyZSAoZ2wpIHtcclxuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuXHJcbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMClcclxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxyXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICByZXR1cm4gdGV4dHVyZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXHJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXHJcbm1vZHVsZS5leHBvcnRzLlRleHR1cmUgPSBUZXh0dXJlXHJcbiIsImxldCBMb2FkZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcclxubGV0IEdMUmVuZGVyZXIgICAgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcclxubGV0IEVudGl0eVN0b3JlICAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVN0b3JlLVNpbXBsZVwiKVxyXG5sZXQgQ2xvY2sgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcclxubGV0IENhY2hlICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXHJcbmxldCBTY2VuZU1hbmFnZXIgICAgPSByZXF1aXJlKFwiLi9TY2VuZU1hbmFnZXJcIilcclxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxyXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxyXG5sZXQgSW5wdXRNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vSW5wdXRNYW5hZ2VyXCIpXHJcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcclxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXHJcbmxldCBjYW52YXMgICAgICAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXHJcblxyXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxyXG5jb25zdCBNQVhfQ09VTlQgICAgICAgPSAxMDAwXHJcblxyXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcclxubGV0IGlucHV0TWFuYWdlciAgICA9IG5ldyBJbnB1dE1hbmFnZXIoa2V5Ym9hcmRNYW5hZ2VyKVxyXG5sZXQgZW50aXR5U3RvcmUgICAgID0gbmV3IEVudGl0eVN0b3JlXHJcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXHJcbmxldCBjYWNoZSAgICAgICAgICAgPSBuZXcgQ2FjaGUoW1wic291bmRzXCIsIFwidGV4dHVyZXNcIl0pXHJcbmxldCBsb2FkZXIgICAgICAgICAgPSBuZXcgTG9hZGVyXHJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIDE5MjAsIDEwODApXHJcbmxldCBhdWRpb1N5c3RlbSAgICAgPSBuZXcgQXVkaW9TeXN0ZW0oW1wibWFpblwiLCBcImJnXCJdKVxyXG5sZXQgc2NlbmVNYW5hZ2VyICAgID0gbmV3IFNjZW5lTWFuYWdlcihbbmV3IFRlc3RTY2VuZV0pXHJcbmxldCBnYW1lICAgICAgICAgICAgPSBuZXcgR2FtZShjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBlbnRpdHlTdG9yZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2VuZU1hbmFnZXIpXHJcblxyXG5mdW5jdGlvbiBtYWtlVXBkYXRlIChnYW1lKSB7XHJcbiAgbGV0IHN0b3JlICAgICAgICAgID0gZ2FtZS5lbnRpdHlTdG9yZVxyXG4gIGxldCBjbG9jayAgICAgICAgICA9IGdhbWUuY2xvY2tcclxuICBsZXQgaW5wdXRNYW5hZ2VyICAgPSBnYW1lLmlucHV0TWFuYWdlclxyXG4gIGxldCBjb21wb25lbnROYW1lcyA9IFtcInJlbmRlcmFibGVcIiwgXCJwaHlzaWNzXCJdXHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xyXG4gICAgY2xvY2sudGljaygpXHJcbiAgICBpbnB1dE1hbmFnZXIua2V5Ym9hcmRNYW5hZ2VyLnRpY2soY2xvY2suZFQpXHJcbiAgICBnYW1lLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZS51cGRhdGUoY2xvY2suZFQpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2FtZSkge1xyXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcclxuICAgIGdhbWUucmVuZGVyZXIucmVuZGVyKClcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSAgXHJcbiAgfVxyXG59XHJcblxyXG53aW5kb3cuZ2FtZSA9IGdhbWVcclxuXHJcbmZ1bmN0aW9uIHNldHVwRG9jdW1lbnQgKGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdykge1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxyXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxyXG4gIH0pXHJcbn1cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcclxuICBzZXR1cERvY3VtZW50KGNhbnZhcywgZG9jdW1lbnQsIHdpbmRvdylcclxuICBnYW1lLnN0YXJ0KClcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXHJcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZShnYW1lKSwgVVBEQVRFX0lOVEVSVkFMKVxyXG59KVxyXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxyXG5tb2R1bGUuZXhwb3J0cy5jaGVja1ZhbHVlVHlwZSA9IGNoZWNrVmFsdWVUeXBlXHJcbm1vZHVsZS5leHBvcnRzLnNldEJveCAgICAgICAgID0gc2V0Qm94XHJcblxyXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gICAgID0gMlxyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgICAgID0gNlxyXG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcclxuXHJcbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcclxuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpXHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgdywgaCwgeCwgeSkge1xyXG4gIGxldCBpICA9IEJPWF9MRU5HVEggKiBpbmRleFxyXG4gIGxldCB4MSA9IHhcclxuICBsZXQgeTEgPSB5IFxyXG4gIGxldCB4MiA9IHggKyB3XHJcbiAgbGV0IHkyID0geSArIGhcclxuXHJcbiAgYm94QXJyYXlbaV0gICAgPSB4MVxyXG4gIGJveEFycmF5W2krMV0gID0geTFcclxuICBib3hBcnJheVtpKzJdICA9IHgxXHJcbiAgYm94QXJyYXlbaSszXSAgPSB5MlxyXG4gIGJveEFycmF5W2krNF0gID0geDJcclxuICBib3hBcnJheVtpKzVdICA9IHkxXHJcblxyXG4gIGJveEFycmF5W2krNl0gID0geDFcclxuICBib3hBcnJheVtpKzddICA9IHkyXHJcbiAgYm94QXJyYXlbaSs4XSAgPSB4MlxyXG4gIGJveEFycmF5W2krOV0gID0geTJcclxuICBib3hBcnJheVtpKzEwXSA9IHgyXHJcbiAgYm94QXJyYXlbaSsxMV0gPSB5MVxyXG59XHJcbiJdfQ==
