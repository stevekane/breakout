(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = adjoint

/**
 * Calculates the adjugate of a mat3
 *
 * @alias mat3.adjoint
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function adjoint(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]

  out[0] = (a11 * a22 - a12 * a21)
  out[1] = (a02 * a21 - a01 * a22)
  out[2] = (a01 * a12 - a02 * a11)
  out[3] = (a12 * a20 - a10 * a22)
  out[4] = (a00 * a22 - a02 * a20)
  out[5] = (a02 * a10 - a00 * a12)
  out[6] = (a10 * a21 - a11 * a20)
  out[7] = (a01 * a20 - a00 * a21)
  out[8] = (a00 * a11 - a01 * a10)

  return out
}

},{}],2:[function(require,module,exports){
module.exports = clone

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @alias mat3.clone
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
function clone(a) {
  var out = new Float32Array(9)
  out[0] = a[0]
  out[1] = a[1]
  out[2] = a[2]
  out[3] = a[3]
  out[4] = a[4]
  out[5] = a[5]
  out[6] = a[6]
  out[7] = a[7]
  out[8] = a[8]
  return out
}

},{}],3:[function(require,module,exports){
module.exports = copy

/**
 * Copy the values from one mat3 to another
 *
 * @alias mat3.copy
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function copy(out, a) {
  out[0] = a[0]
  out[1] = a[1]
  out[2] = a[2]
  out[3] = a[3]
  out[4] = a[4]
  out[5] = a[5]
  out[6] = a[6]
  out[7] = a[7]
  out[8] = a[8]
  return out
}

},{}],4:[function(require,module,exports){
module.exports = create

/**
 * Creates a new identity mat3
 *
 * @alias mat3.create
 * @returns {mat3} a new 3x3 matrix
 */
function create() {
  var out = new Float32Array(9)
  out[0] = 1
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 1
  out[5] = 0
  out[6] = 0
  out[7] = 0
  out[8] = 1
  return out
}

},{}],5:[function(require,module,exports){
module.exports = determinant

/**
 * Calculates the determinant of a mat3
 *
 * @alias mat3.determinant
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]

  return a00 * (a22 * a11 - a12 * a21)
       + a01 * (a12 * a20 - a22 * a10)
       + a02 * (a21 * a10 - a11 * a20)
}

},{}],6:[function(require,module,exports){
module.exports = frob

/**
 * Returns Frobenius norm of a mat3
 *
 * @alias mat3.frob
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(
      a[0]*a[0]
    + a[1]*a[1]
    + a[2]*a[2]
    + a[3]*a[3]
    + a[4]*a[4]
    + a[5]*a[5]
    + a[6]*a[6]
    + a[7]*a[7]
    + a[8]*a[8]
  )
}

},{}],7:[function(require,module,exports){
module.exports = fromMat2d

/**
 * Copies the values from a mat2d into a mat3
 *
 * @alias mat3.fromMat2d
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
function fromMat2d(out, a) {
  out[0] = a[0]
  out[1] = a[1]
  out[2] = 0

  out[3] = a[2]
  out[4] = a[3]
  out[5] = 0

  out[6] = a[4]
  out[7] = a[5]
  out[8] = 1

  return out
}

},{}],8:[function(require,module,exports){
module.exports = fromMat4

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @alias mat3.fromMat4
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
function fromMat4(out, a) {
  out[0] = a[0]
  out[1] = a[1]
  out[2] = a[2]
  out[3] = a[4]
  out[4] = a[5]
  out[5] = a[6]
  out[6] = a[8]
  out[7] = a[9]
  out[8] = a[10]
  return out
}

},{}],9:[function(require,module,exports){
module.exports = fromQuat

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @alias mat3.fromQuat
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
function fromQuat(out, q) {
  var x = q[0]
  var y = q[1]
  var z = q[2]
  var w = q[3]

  var x2 = x + x
  var y2 = y + y
  var z2 = z + z

  var xx = x * x2
  var yx = y * x2
  var yy = y * y2
  var zx = z * x2
  var zy = z * y2
  var zz = z * z2
  var wx = w * x2
  var wy = w * y2
  var wz = w * z2

  out[0] = 1 - yy - zz
  out[3] = yx - wz
  out[6] = zx + wy

  out[1] = yx + wz
  out[4] = 1 - xx - zz
  out[7] = zy - wx

  out[2] = zx - wy
  out[5] = zy + wx
  out[8] = 1 - xx - yy

  return out
}

},{}],10:[function(require,module,exports){
module.exports = identity

/**
 * Set a mat3 to the identity matrix
 *
 * @alias mat3.identity
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
function identity(out) {
  out[0] = 1
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 1
  out[5] = 0
  out[6] = 0
  out[7] = 0
  out[8] = 1
  return out
}

},{}],11:[function(require,module,exports){
module.exports = {
  adjoint: require('./adjoint')
  , clone: require('./clone')
  , copy: require('./copy')
  , create: require('./create')
  , determinant: require('./determinant')
  , frob: require('./frob')
  , fromMat2: require('./from-mat2')
  , fromMat4: require('./from-mat4')
  , fromQuat: require('./from-quat')
  , identity: require('./identity')
  , invert: require('./invert')
  , multiply: require('./multiply')
  , normalFromMat4: require('./normal-from-mat4')
  , rotate: require('./rotate')
  , scale: require('./scale')
  , str: require('./str')
  , translate: require('./translate')
  , transpose: require('./transpose')
}

},{"./adjoint":1,"./clone":2,"./copy":3,"./create":4,"./determinant":5,"./frob":6,"./from-mat2":7,"./from-mat4":8,"./from-quat":9,"./identity":10,"./invert":12,"./multiply":13,"./normal-from-mat4":14,"./rotate":15,"./scale":16,"./str":17,"./translate":18,"./transpose":19}],12:[function(require,module,exports){
module.exports = invert

/**
 * Inverts a mat3
 *
 * @alias mat3.invert
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function invert(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]

  var b01 = a22 * a11 - a12 * a21
  var b11 = -a22 * a10 + a12 * a20
  var b21 = a21 * a10 - a11 * a20

  // Calculate the determinant
  var det = a00 * b01 + a01 * b11 + a02 * b21

  if (!det) return null
  det = 1.0 / det

  out[0] = b01 * det
  out[1] = (-a22 * a01 + a02 * a21) * det
  out[2] = (a12 * a01 - a02 * a11) * det
  out[3] = b11 * det
  out[4] = (a22 * a00 - a02 * a20) * det
  out[5] = (-a12 * a00 + a02 * a10) * det
  out[6] = b21 * det
  out[7] = (-a21 * a00 + a01 * a20) * det
  out[8] = (a11 * a00 - a01 * a10) * det

  return out
}

},{}],13:[function(require,module,exports){
module.exports = multiply

/**
 * Multiplies two mat3's
 *
 * @alias mat3.multiply
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
function multiply(out, a, b) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]

  var b00 = b[0], b01 = b[1], b02 = b[2]
  var b10 = b[3], b11 = b[4], b12 = b[5]
  var b20 = b[6], b21 = b[7], b22 = b[8]

  out[0] = b00 * a00 + b01 * a10 + b02 * a20
  out[1] = b00 * a01 + b01 * a11 + b02 * a21
  out[2] = b00 * a02 + b01 * a12 + b02 * a22

  out[3] = b10 * a00 + b11 * a10 + b12 * a20
  out[4] = b10 * a01 + b11 * a11 + b12 * a21
  out[5] = b10 * a02 + b11 * a12 + b12 * a22

  out[6] = b20 * a00 + b21 * a10 + b22 * a20
  out[7] = b20 * a01 + b21 * a11 + b22 * a21
  out[8] = b20 * a02 + b21 * a12 + b22 * a22

  return out
}

},{}],14:[function(require,module,exports){
module.exports = normalFromMat4

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @alias mat3.normalFromMat4
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
function normalFromMat4(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  var b00 = a00 * a11 - a01 * a10
  var b01 = a00 * a12 - a02 * a10
  var b02 = a00 * a13 - a03 * a10
  var b03 = a01 * a12 - a02 * a11
  var b04 = a01 * a13 - a03 * a11
  var b05 = a02 * a13 - a03 * a12
  var b06 = a20 * a31 - a21 * a30
  var b07 = a20 * a32 - a22 * a30
  var b08 = a20 * a33 - a23 * a30
  var b09 = a21 * a32 - a22 * a31
  var b10 = a21 * a33 - a23 * a31
  var b11 = a22 * a33 - a23 * a32

  // Calculate the determinant
  var det = b00 * b11
          - b01 * b10
          + b02 * b09
          + b03 * b08
          - b04 * b07
          + b05 * b06

  if (!det) return null
  det = 1.0 / det

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det

  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det

  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det

  return out
}

},{}],15:[function(require,module,exports){
module.exports = rotate

/**
 * Rotates a mat3 by the given angle
 *
 * @alias mat3.rotate
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function rotate(out, a, rad) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]

  var s = Math.sin(rad)
  var c = Math.cos(rad)

  out[0] = c * a00 + s * a10
  out[1] = c * a01 + s * a11
  out[2] = c * a02 + s * a12

  out[3] = c * a10 - s * a00
  out[4] = c * a11 - s * a01
  out[5] = c * a12 - s * a02

  out[6] = a20
  out[7] = a21
  out[8] = a22

  return out
}

},{}],16:[function(require,module,exports){
module.exports = scale

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @alias mat3.scale
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
function scale(out, a, v) {
  var x = v[0]
  var y = v[1]

  out[0] = x * a[0]
  out[1] = x * a[1]
  out[2] = x * a[2]

  out[3] = y * a[3]
  out[4] = y * a[4]
  out[5] = y * a[5]

  out[6] = a[6]
  out[7] = a[7]
  out[8] = a[8]

  return out
}

},{}],17:[function(require,module,exports){
module.exports = str

/**
 * Returns a string representation of a mat3
 *
 * @alias mat3.str
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
                   a[3] + ', ' + a[4] + ', ' + a[5] + ', ' +
                   a[6] + ', ' + a[7] + ', ' + a[8] + ')'
}

},{}],18:[function(require,module,exports){
module.exports = translate

/**
 * Translate a mat3 by the given vector
 *
 * @alias mat3.translate
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
function translate(out, a, v) {
  var a00 = a[0], a01 = a[1], a02 = a[2]
  var a10 = a[3], a11 = a[4], a12 = a[5]
  var a20 = a[6], a21 = a[7], a22 = a[8]
  var x = v[0], y = v[1]

  out[0] = a00
  out[1] = a01
  out[2] = a02

  out[3] = a10
  out[4] = a11
  out[5] = a12

  out[6] = x * a00 + y * a10 + a20
  out[7] = x * a01 + y * a11 + a21
  out[8] = x * a02 + y * a12 + a22

  return out
}

},{}],19:[function(require,module,exports){
module.exports = transpose

/**
 * Transpose the values of a mat3
 *
 * @alias mat3.transpose
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1], a02 = a[2], a12 = a[5]
    out[1] = a[3]
    out[2] = a[6]
    out[3] = a01
    out[5] = a[7]
    out[6] = a02
    out[7] = a12
  } else {
    out[0] = a[0]
    out[1] = a[3]
    out[2] = a[6]
    out[3] = a[1]
    out[4] = a[4]
    out[5] = a[7]
    out[6] = a[2]
    out[7] = a[5]
    out[8] = a[8]
  }

  return out
}

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"./AABB":20}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
"use strict";

module.exports = function Cache(keyNames) {
  if (!keyNames) throw new Error("Must provide some keyNames");
  for (var i = 0; i < keyNames.length; ++i) this[keyNames[i]] = {};
};

},{}],24:[function(require,module,exports){
"use strict";

var _ref = require("gl-mat3");

var transpose = _ref.transpose;
var translate = _ref.translate;
var create = _ref.create;


module.exports = Camera;

function Camera(w, h, x, y) {
  var mat = create();

  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  this.rotation = 0;
  this.scale = 1;

  //TODO: Start with only translation!
  Object.defineProperty(this, "matrix", {
    get: function () {
      mat[6] = -this.x;
      mat[7] = -this.y;
      return mat;
    }
  });
}

},{"gl-mat3":11}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
"use strict";

//this does literally nothing.  it's a shell that holds components
module.exports = function Entity() {};

},{}],27:[function(require,module,exports){
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

},{"./functions":45}],28:[function(require,module,exports){
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

  //world size uniforms
  var worldSizeSpriteLocation = gl.getUniformLocation(spriteProgram, "u_worldSize");
  var worldSizePolygonLocation = gl.getUniformLocation(polygonProgram, "u_worldSize");

  //camera uniforms
  var cameraTransformSpriteLocation = gl.getUniformLocation(spriteProgram, "u_cameraTransform");
  //let cameraTransformPolygonLocation = gl.getUniformLocation(polygonProgram, "w_cameraTransform")


  var imageToTextureMap = new Map();
  var textureToBatchMap = new Map();
  var polygonBatch = new PolygonBatch(MAX_VERTEX_COUNT);

  gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(1, 1, 1, 1);
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

  this.render = function (cameraTransform) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Spritesheet batch rendering
    gl.useProgram(spriteProgram);
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeSpriteLocation, 1920, 1080);
    gl.uniformMatrix3fv(cameraTransformSpriteLocation, false, cameraTransform);
    textureToBatchMap.forEach(drawBatch);
  };
}

},{"./gl-buffer":46,"./gl-shaders":47,"./gl-types":48,"./utils":50}],29:[function(require,module,exports){
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

},{"./AudioSystem":22,"./Cache":23,"./Clock":25,"./EntityStore-Simple":27,"./GLRenderer":28,"./InputManager":30,"./Loader":33,"./SceneManager":38,"./utils":50}],30:[function(require,module,exports){
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

},{"./KeyboardManager":31,"./utils":50}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{"./System":40}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{"./System":40}],35:[function(require,module,exports){
"use strict";

module.exports = Polygon;

function Polygon(vertices, indices, vertexColors) {
  this.vertices = vertices;
  this.indices = indices;
  this.vertexColors = vertexColors;
}

},{}],36:[function(require,module,exports){
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

},{"./System":40}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
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

},{"./functions":45}],39:[function(require,module,exports){
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

},{"./System":40}],40:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

//scene.game.clock
System.prototype.run = function (scene, entities) {};

},{}],41:[function(require,module,exports){
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
    //entityStore.addEntity(new Fighter(textures.fighter, 76, 59, 500, 500))
    entityStore.addEntity(new Water(1920, 280, 0, 800, 100));
    //bg.volume = 0
    //bg.loop(cache.sounds.bgMusic)
    cb(null);
  });
};

},{"./KeyframeAnimationSystem":32,"./PaddleMoverSystem":34,"./PolygonRenderingSystem":36,"./Scene":37,"./SpriteRenderingSystem":39,"./assemblages":43}],42:[function(require,module,exports){
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

},{"./Polygon":35}],43:[function(require,module,exports){
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

},{"./Animation":21,"./Entity":26,"./WaterPolygon":42,"./components":44}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],47:[function(require,module,exports){
"use strict";

module.exports.spriteVertexShader = "   precision highp float;     attribute vec2 a_position;   attribute vec2 a_texCoord;     uniform vec2 u_worldSize;   uniform mat3 u_cameraTransform;     varying vec2 v_texCoord;     vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }     void main() {     vec2 screenPos     = (u_cameraTransform * vec3(a_position, 1)).xy;     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = screenPos / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_texCoord  = a_texCoord;     gl_Position = vec4(position, 0, 1);   }";

module.exports.spriteFragmentShader = "  precision highp float;     uniform sampler2D u_image;     varying vec2 v_texCoord;     void main() {     gl_FragColor = texture2D(u_image, v_texCoord);   }";

module.exports.polygonVertexShader = "  attribute vec2 a_vertex;   attribute vec4 a_vertexColor;   uniform vec2 u_worldSize;   varying vec4 v_vertexColor;   vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }   void main () {     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = a_vertex / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_vertexColor = a_vertexColor;     gl_Position   = vec4(position, 0, 1);   }";

module.exports.polygonFragmentShader = "  precision highp float;     varying vec4 v_vertexColor;     void main() {     gl_FragColor = v_vertexColor;   }";

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
"use strict";

var Camera = require("./Camera");
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

var c = new Camera(1920, 1080, 0, 0);

c.x = 60;
c.y = 100;

window.c = c;
console.log(c.matrix);

function makeAnimate(game) {
  return function animate() {
    game.renderer.render(c.matrix);
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

},{"./AudioSystem":22,"./Cache":23,"./Camera":24,"./Clock":25,"./EntityStore-Simple":27,"./GLRenderer":28,"./Game":29,"./InputManager":30,"./KeyboardManager":31,"./Loader":33,"./SceneManager":38,"./TestScene":41}],50:[function(require,module,exports){
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

},{}]},{},[49])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9hZGpvaW50LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvY2xvbmUuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9jb3B5LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZGV0ZXJtaW5hbnQuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9mcm9iLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1tYXQyLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1tYXQ0LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1xdWF0LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvaWRlbnRpdHkuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL2ludmVydC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL211bHRpcGx5LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvbm9ybWFsLWZyb20tbWF0NC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL3JvdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL3NjYWxlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvc3RyLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvdHJhbnNsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvdHJhbnNwb3NlLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQUFCQi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0FuaW1hdGlvbi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQ2FjaGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYW1lcmEuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DbG9jay5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvSW5wdXRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvS2V5Ym9hcmRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9Mb2FkZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9QYWRkbGVNb3ZlclN5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1BvbHlnb24uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TY2VuZU1hbmFnZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TcHJpdGVSZW5kZXJpbmdTeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9UZXN0U2NlbmUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9XYXRlclBvbHlnb24uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1zaGFkZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvZ2wtdHlwZXMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9sZC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0FBQTs7QUFFekIsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUMzQixpQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUMzRSxpQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUMzRSxpQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUMzRSxpQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUMzRSxpQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtLQUM1RTs7QUFFRCxlQUFXLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTs7QUFFckUsZUFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJ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QUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBO0FBQ25CLFVBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUksRUFBRSxDQUFBOztBQUVuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGFkam9pbnRcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDNcbiAqXG4gKiBAYWxpYXMgbWF0My5hZGpvaW50XG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIGFkam9pbnQob3V0LCBhKSB7XG4gIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdXG4gIHZhciBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdXG4gIHZhciBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdXG5cbiAgb3V0WzBdID0gKGExMSAqIGEyMiAtIGExMiAqIGEyMSlcbiAgb3V0WzFdID0gKGEwMiAqIGEyMSAtIGEwMSAqIGEyMilcbiAgb3V0WzJdID0gKGEwMSAqIGExMiAtIGEwMiAqIGExMSlcbiAgb3V0WzNdID0gKGExMiAqIGEyMCAtIGExMCAqIGEyMilcbiAgb3V0WzRdID0gKGEwMCAqIGEyMiAtIGEwMiAqIGEyMClcbiAgb3V0WzVdID0gKGEwMiAqIGExMCAtIGEwMCAqIGExMilcbiAgb3V0WzZdID0gKGExMCAqIGEyMSAtIGExMSAqIGEyMClcbiAgb3V0WzddID0gKGEwMSAqIGEyMCAtIGEwMCAqIGEyMSlcbiAgb3V0WzhdID0gKGEwMCAqIGExMSAtIGEwMSAqIGExMClcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsb25lXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQzIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQGFsaWFzIG1hdDMuY2xvbmVcbiAqIEBwYXJhbSB7bWF0M30gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbmZ1bmN0aW9uIGNsb25lKGEpIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoOSlcbiAgb3V0WzBdID0gYVswXVxuICBvdXRbMV0gPSBhWzFdXG4gIG91dFsyXSA9IGFbMl1cbiAgb3V0WzNdID0gYVszXVxuICBvdXRbNF0gPSBhWzRdXG4gIG91dFs1XSA9IGFbNV1cbiAgb3V0WzZdID0gYVs2XVxuICBvdXRbN10gPSBhWzddXG4gIG91dFs4XSA9IGFbOF1cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjb3B5XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDMgdG8gYW5vdGhlclxuICpcbiAqIEBhbGlhcyBtYXQzLmNvcHlcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xuZnVuY3Rpb24gY29weShvdXQsIGEpIHtcbiAgb3V0WzBdID0gYVswXVxuICBvdXRbMV0gPSBhWzFdXG4gIG91dFsyXSA9IGFbMl1cbiAgb3V0WzNdID0gYVszXVxuICBvdXRbNF0gPSBhWzRdXG4gIG91dFs1XSA9IGFbNV1cbiAgb3V0WzZdID0gYVs2XVxuICBvdXRbN10gPSBhWzddXG4gIG91dFs4XSA9IGFbOF1cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDNcbiAqXG4gKiBAYWxpYXMgbWF0My5jcmVhdGVcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoOSlcbiAgb3V0WzBdID0gMVxuICBvdXRbMV0gPSAwXG4gIG91dFsyXSA9IDBcbiAgb3V0WzNdID0gMFxuICBvdXRbNF0gPSAxXG4gIG91dFs1XSA9IDBcbiAgb3V0WzZdID0gMFxuICBvdXRbN10gPSAwXG4gIG91dFs4XSA9IDFcbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBkZXRlcm1pbmFudFxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0M1xuICpcbiAqIEBhbGlhcyBtYXQzLmRldGVybWluYW50XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xuZnVuY3Rpb24gZGV0ZXJtaW5hbnQoYSkge1xuICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXVxuICB2YXIgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XVxuICB2YXIgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XVxuXG4gIHJldHVybiBhMDAgKiAoYTIyICogYTExIC0gYTEyICogYTIxKVxuICAgICAgICsgYTAxICogKGExMiAqIGEyMCAtIGEyMiAqIGExMClcbiAgICAgICArIGEwMiAqIChhMjEgKiBhMTAgLSBhMTEgKiBhMjApXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZyb2JcblxuLyoqXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0M1xuICpcbiAqIEBhbGlhcyBtYXQzLmZyb2JcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIGNhbGN1bGF0ZSBGcm9iZW5pdXMgbm9ybSBvZlxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cbiAqL1xuZnVuY3Rpb24gZnJvYihhKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoXG4gICAgICBhWzBdKmFbMF1cbiAgICArIGFbMV0qYVsxXVxuICAgICsgYVsyXSphWzJdXG4gICAgKyBhWzNdKmFbM11cbiAgICArIGFbNF0qYVs0XVxuICAgICsgYVs1XSphWzVdXG4gICAgKyBhWzZdKmFbNl1cbiAgICArIGFbN10qYVs3XVxuICAgICsgYVs4XSphWzhdXG4gIClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnJvbU1hdDJkXG5cbi8qKlxuICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSBhIG1hdDJkIGludG8gYSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMuZnJvbU1hdDJkXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNvcHlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbmZ1bmN0aW9uIGZyb21NYXQyZChvdXQsIGEpIHtcbiAgb3V0WzBdID0gYVswXVxuICBvdXRbMV0gPSBhWzFdXG4gIG91dFsyXSA9IDBcblxuICBvdXRbM10gPSBhWzJdXG4gIG91dFs0XSA9IGFbM11cbiAgb3V0WzVdID0gMFxuXG4gIG91dFs2XSA9IGFbNF1cbiAgb3V0WzddID0gYVs1XVxuICBvdXRbOF0gPSAxXG5cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmcm9tTWF0NFxuXG4vKipcbiAqIENvcGllcyB0aGUgdXBwZXItbGVmdCAzeDMgdmFsdWVzIGludG8gdGhlIGdpdmVuIG1hdDMuXG4gKlxuICogQGFsaWFzIG1hdDMuZnJvbU1hdDRcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgM3gzIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhICAgdGhlIHNvdXJjZSA0eDQgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIGZyb21NYXQ0KG91dCwgYSkge1xuICBvdXRbMF0gPSBhWzBdXG4gIG91dFsxXSA9IGFbMV1cbiAgb3V0WzJdID0gYVsyXVxuICBvdXRbM10gPSBhWzRdXG4gIG91dFs0XSA9IGFbNV1cbiAgb3V0WzVdID0gYVs2XVxuICBvdXRbNl0gPSBhWzhdXG4gIG91dFs3XSA9IGFbOV1cbiAgb3V0WzhdID0gYVsxMF1cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmcm9tUXVhdFxuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gcXVhdGVybmlvblxuKlxuKiBAYWxpYXMgbWF0My5mcm9tUXVhdFxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7cXVhdH0gcSBRdWF0ZXJuaW9uIHRvIGNyZWF0ZSBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xuZnVuY3Rpb24gZnJvbVF1YXQob3V0LCBxKSB7XG4gIHZhciB4ID0gcVswXVxuICB2YXIgeSA9IHFbMV1cbiAgdmFyIHogPSBxWzJdXG4gIHZhciB3ID0gcVszXVxuXG4gIHZhciB4MiA9IHggKyB4XG4gIHZhciB5MiA9IHkgKyB5XG4gIHZhciB6MiA9IHogKyB6XG5cbiAgdmFyIHh4ID0geCAqIHgyXG4gIHZhciB5eCA9IHkgKiB4MlxuICB2YXIgeXkgPSB5ICogeTJcbiAgdmFyIHp4ID0geiAqIHgyXG4gIHZhciB6eSA9IHogKiB5MlxuICB2YXIgenogPSB6ICogejJcbiAgdmFyIHd4ID0gdyAqIHgyXG4gIHZhciB3eSA9IHcgKiB5MlxuICB2YXIgd3ogPSB3ICogejJcblxuICBvdXRbMF0gPSAxIC0geXkgLSB6elxuICBvdXRbM10gPSB5eCAtIHd6XG4gIG91dFs2XSA9IHp4ICsgd3lcblxuICBvdXRbMV0gPSB5eCArIHd6XG4gIG91dFs0XSA9IDEgLSB4eCAtIHp6XG4gIG91dFs3XSA9IHp5IC0gd3hcblxuICBvdXRbMl0gPSB6eCAtIHd5XG4gIG91dFs1XSA9IHp5ICsgd3hcbiAgb3V0WzhdID0gMSAtIHh4IC0geXlcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5XG5cbi8qKlxuICogU2V0IGEgbWF0MyB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQGFsaWFzIG1hdDMuaWRlbnRpdHlcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIGlkZW50aXR5KG91dCkge1xuICBvdXRbMF0gPSAxXG4gIG91dFsxXSA9IDBcbiAgb3V0WzJdID0gMFxuICBvdXRbM10gPSAwXG4gIG91dFs0XSA9IDFcbiAgb3V0WzVdID0gMFxuICBvdXRbNl0gPSAwXG4gIG91dFs3XSA9IDBcbiAgb3V0WzhdID0gMVxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRqb2ludDogcmVxdWlyZSgnLi9hZGpvaW50JylcbiAgLCBjbG9uZTogcmVxdWlyZSgnLi9jbG9uZScpXG4gICwgY29weTogcmVxdWlyZSgnLi9jb3B5JylcbiAgLCBjcmVhdGU6IHJlcXVpcmUoJy4vY3JlYXRlJylcbiAgLCBkZXRlcm1pbmFudDogcmVxdWlyZSgnLi9kZXRlcm1pbmFudCcpXG4gICwgZnJvYjogcmVxdWlyZSgnLi9mcm9iJylcbiAgLCBmcm9tTWF0MjogcmVxdWlyZSgnLi9mcm9tLW1hdDInKVxuICAsIGZyb21NYXQ0OiByZXF1aXJlKCcuL2Zyb20tbWF0NCcpXG4gICwgZnJvbVF1YXQ6IHJlcXVpcmUoJy4vZnJvbS1xdWF0JylcbiAgLCBpZGVudGl0eTogcmVxdWlyZSgnLi9pZGVudGl0eScpXG4gICwgaW52ZXJ0OiByZXF1aXJlKCcuL2ludmVydCcpXG4gICwgbXVsdGlwbHk6IHJlcXVpcmUoJy4vbXVsdGlwbHknKVxuICAsIG5vcm1hbEZyb21NYXQ0OiByZXF1aXJlKCcuL25vcm1hbC1mcm9tLW1hdDQnKVxuICAsIHJvdGF0ZTogcmVxdWlyZSgnLi9yb3RhdGUnKVxuICAsIHNjYWxlOiByZXF1aXJlKCcuL3NjYWxlJylcbiAgLCBzdHI6IHJlcXVpcmUoJy4vc3RyJylcbiAgLCB0cmFuc2xhdGU6IHJlcXVpcmUoJy4vdHJhbnNsYXRlJylcbiAgLCB0cmFuc3Bvc2U6IHJlcXVpcmUoJy4vdHJhbnNwb3NlJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaW52ZXJ0XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDNcbiAqXG4gKiBAYWxpYXMgbWF0My5pbnZlcnRcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xuZnVuY3Rpb24gaW52ZXJ0KG91dCwgYSkge1xuICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXVxuICB2YXIgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XVxuICB2YXIgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XVxuXG4gIHZhciBiMDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjFcbiAgdmFyIGIxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjBcbiAgdmFyIGIyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMFxuXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgdmFyIGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMVxuXG4gIGlmICghZGV0KSByZXR1cm4gbnVsbFxuICBkZXQgPSAxLjAgLyBkZXRcblxuICBvdXRbMF0gPSBiMDEgKiBkZXRcbiAgb3V0WzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0XG4gIG91dFsyXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0XG4gIG91dFszXSA9IGIxMSAqIGRldFxuICBvdXRbNF0gPSAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldFxuICBvdXRbNV0gPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXRcbiAgb3V0WzZdID0gYjIxICogZGV0XG4gIG91dFs3XSA9ICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldFxuICBvdXRbOF0gPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldFxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbXVsdGlwbHlcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQzJ3NcbiAqXG4gKiBAYWxpYXMgbWF0My5tdWx0aXBseVxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiBtdWx0aXBseShvdXQsIGEsIGIpIHtcbiAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl1cbiAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV1cbiAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF1cblxuICB2YXIgYjAwID0gYlswXSwgYjAxID0gYlsxXSwgYjAyID0gYlsyXVxuICB2YXIgYjEwID0gYlszXSwgYjExID0gYls0XSwgYjEyID0gYls1XVxuICB2YXIgYjIwID0gYls2XSwgYjIxID0gYls3XSwgYjIyID0gYls4XVxuXG4gIG91dFswXSA9IGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMFxuICBvdXRbMV0gPSBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjFcbiAgb3V0WzJdID0gYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyXG5cbiAgb3V0WzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwXG4gIG91dFs0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMVxuICBvdXRbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjJcblxuICBvdXRbNl0gPSBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjBcbiAgb3V0WzddID0gYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxXG4gIG91dFs4XSA9IGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMlxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm9ybWFsRnJvbU1hdDRcblxuLyoqXG4qIENhbGN1bGF0ZXMgYSAzeDMgbm9ybWFsIG1hdHJpeCAodHJhbnNwb3NlIGludmVyc2UpIGZyb20gdGhlIDR4NCBtYXRyaXhcbipcbiogQGFsaWFzIG1hdDMubm9ybWFsRnJvbU1hdDRcbiogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuKiBAcGFyYW0ge21hdDR9IGEgTWF0NCB0byBkZXJpdmUgdGhlIG5vcm1hbCBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xuZnVuY3Rpb24gbm9ybWFsRnJvbU1hdDQob3V0LCBhKSB7XG4gIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdXG4gIHZhciBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddXG4gIHZhciBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV1cbiAgdmFyIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdXG5cbiAgdmFyIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMFxuICB2YXIgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwXG4gIHZhciBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTBcbiAgdmFyIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMVxuICB2YXIgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExXG4gIHZhciBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTJcbiAgdmFyIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMFxuICB2YXIgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwXG4gIHZhciBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzBcbiAgdmFyIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMVxuICB2YXIgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxXG4gIHZhciBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzJcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gIHZhciBkZXQgPSBiMDAgKiBiMTFcbiAgICAgICAgICAtIGIwMSAqIGIxMFxuICAgICAgICAgICsgYjAyICogYjA5XG4gICAgICAgICAgKyBiMDMgKiBiMDhcbiAgICAgICAgICAtIGIwNCAqIGIwN1xuICAgICAgICAgICsgYjA1ICogYjA2XG5cbiAgaWYgKCFkZXQpIHJldHVybiBudWxsXG4gIGRldCA9IDEuMCAvIGRldFxuXG4gIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0XG4gIG91dFsxXSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0XG4gIG91dFsyXSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0XG5cbiAgb3V0WzNdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXRcbiAgb3V0WzRdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXRcbiAgb3V0WzVdID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXRcblxuICBvdXRbNl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldFxuICBvdXRbN10gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldFxuICBvdXRbOF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldFxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcm90YXRlXG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDMgYnkgdGhlIGdpdmVuIGFuZ2xlXG4gKlxuICogQGFsaWFzIG1hdDMucm90YXRlXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiByb3RhdGUob3V0LCBhLCByYWQpIHtcbiAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl1cbiAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV1cbiAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF1cblxuICB2YXIgcyA9IE1hdGguc2luKHJhZClcbiAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpXG5cbiAgb3V0WzBdID0gYyAqIGEwMCArIHMgKiBhMTBcbiAgb3V0WzFdID0gYyAqIGEwMSArIHMgKiBhMTFcbiAgb3V0WzJdID0gYyAqIGEwMiArIHMgKiBhMTJcblxuICBvdXRbM10gPSBjICogYTEwIC0gcyAqIGEwMFxuICBvdXRbNF0gPSBjICogYTExIC0gcyAqIGEwMVxuICBvdXRbNV0gPSBjICogYTEyIC0gcyAqIGEwMlxuXG4gIG91dFs2XSA9IGEyMFxuICBvdXRbN10gPSBhMjFcbiAgb3V0WzhdID0gYTIyXG5cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBzY2FsZVxuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0MyBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBhbGlhcyBtYXQzLnNjYWxlXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICoqL1xuZnVuY3Rpb24gc2NhbGUob3V0LCBhLCB2KSB7XG4gIHZhciB4ID0gdlswXVxuICB2YXIgeSA9IHZbMV1cblxuICBvdXRbMF0gPSB4ICogYVswXVxuICBvdXRbMV0gPSB4ICogYVsxXVxuICBvdXRbMl0gPSB4ICogYVsyXVxuXG4gIG91dFszXSA9IHkgKiBhWzNdXG4gIG91dFs0XSA9IHkgKiBhWzRdXG4gIG91dFs1XSA9IHkgKiBhWzVdXG5cbiAgb3V0WzZdID0gYVs2XVxuICBvdXRbN10gPSBhWzddXG4gIG91dFs4XSA9IGFbOF1cblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0clxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMuc3RyXG4gKiBAcGFyYW0ge21hdDN9IG1hdCBtYXRyaXggdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICovXG5mdW5jdGlvbiBzdHIoYSkge1xuICByZXR1cm4gJ21hdDMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArXG4gICAgICAgICAgICAgICAgICAgYVszXSArICcsICcgKyBhWzRdICsgJywgJyArIGFbNV0gKyAnLCAnICtcbiAgICAgICAgICAgICAgICAgICBhWzZdICsgJywgJyArIGFbN10gKyAnLCAnICsgYVs4XSArICcpJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB0cmFuc2xhdGVcblxuLyoqXG4gKiBUcmFuc2xhdGUgYSBtYXQzIGJ5IHRoZSBnaXZlbiB2ZWN0b3JcbiAqXG4gKiBAYWxpYXMgbWF0My50cmFuc2xhdGVcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIHRyYW5zbGF0ZShvdXQsIGEsIHYpIHtcbiAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl1cbiAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV1cbiAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF1cbiAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXVxuXG4gIG91dFswXSA9IGEwMFxuICBvdXRbMV0gPSBhMDFcbiAgb3V0WzJdID0gYTAyXG5cbiAgb3V0WzNdID0gYTEwXG4gIG91dFs0XSA9IGExMVxuICBvdXRbNV0gPSBhMTJcblxuICBvdXRbNl0gPSB4ICogYTAwICsgeSAqIGExMCArIGEyMFxuICBvdXRbN10gPSB4ICogYTAxICsgeSAqIGExMSArIGEyMVxuICBvdXRbOF0gPSB4ICogYTAyICsgeSAqIGExMiArIGEyMlxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gdHJhbnNwb3NlXG5cbi8qKlxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMudHJhbnNwb3NlXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIHRyYW5zcG9zZShvdXQsIGEpIHtcbiAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICBpZiAob3V0ID09PSBhKSB7XG4gICAgdmFyIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGExMiA9IGFbNV1cbiAgICBvdXRbMV0gPSBhWzNdXG4gICAgb3V0WzJdID0gYVs2XVxuICAgIG91dFszXSA9IGEwMVxuICAgIG91dFs1XSA9IGFbN11cbiAgICBvdXRbNl0gPSBhMDJcbiAgICBvdXRbN10gPSBhMTJcbiAgfSBlbHNlIHtcbiAgICBvdXRbMF0gPSBhWzBdXG4gICAgb3V0WzFdID0gYVszXVxuICAgIG91dFsyXSA9IGFbNl1cbiAgICBvdXRbM10gPSBhWzFdXG4gICAgb3V0WzRdID0gYVs0XVxuICAgIG91dFs1XSA9IGFbN11cbiAgICBvdXRbNl0gPSBhWzJdXG4gICAgb3V0WzddID0gYVs1XVxuICAgIG91dFs4XSA9IGFbOF1cbiAgfVxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQUFCQiAodywgaCwgeCwgeSkge1xuICB0aGlzLnggPSB4XG4gIHRoaXMueSA9IHlcbiAgdGhpcy53ID0gd1xuICB0aGlzLmggPSBoXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidWx4XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB4IH0gXG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseVwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geSB9IFxuICB9KVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJscnhcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHggKyB3IH1cbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ5XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB5ICsgaCB9XG4gIH0pXG59XG4iLCJsZXQgQUFCQiA9IHJlcXVpcmUoXCIuL0FBQkJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb25cblxuZnVuY3Rpb24gRnJhbWUgKGFhYmIsIGR1cmF0aW9uKSB7XG4gIHRoaXMuYWFiYiAgICAgPSBhYWJiXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxufVxuXG4vL3JhdGUgaXMgaW4gbXMuICBUaGlzIGlzIHRoZSB0aW1lIHBlciBmcmFtZSAoNDIgfiAyNGZwcylcbmZ1bmN0aW9uIEFuaW1hdGlvbiAoZnJhbWVzLCBkb2VzTG9vcCwgcmF0ZT00Mikge1xuICB0aGlzLmxvb3AgICA9IGRvZXNMb29wXG4gIHRoaXMucmF0ZSAgID0gcmF0ZVxuICB0aGlzLmZyYW1lcyA9IGZyYW1lc1xufVxuXG5BbmltYXRpb24uY3JlYXRlTGluZWFyID0gZnVuY3Rpb24gKHcsIGgsIHgsIHksIGNvdW50LCBkb2VzTG9vcCwgcmF0ZT00Mikge1xuICBsZXQgZnJhbWVzID0gW11cbiAgbGV0IGkgICAgICA9IC0xXG4gIGxldCBlYWNoWFxuICBsZXQgYWFiYlxuXG4gIHdoaWxlICgrK2kgPCBjb3VudCkge1xuICAgIGVhY2hYID0geCArIGkgKiB3XG4gICAgYWFiYiAgPSBuZXcgQUFCQih3LCBoLCBlYWNoWCwgeSlcbiAgICBmcmFtZXMucHVzaChuZXcgRnJhbWUoYWFiYiwgcmF0ZSkpXG4gIH1cblxuICByZXR1cm4gbmV3IEFuaW1hdGlvbihmcmFtZXMsIGRvZXNMb29wLCByYXRlKVxufVxuXG5BbmltYXRpb24uY3JlYXRlU2luZ2xlID0gZnVuY3Rpb24gKHcsIGgsIHgsIHksIHJhdGU9NDMpIHtcbiAgbGV0IGFhYmIgICA9IG5ldyBBQUJCKHcsIGgsIHgsIHkpXG4gIGxldCBmcmFtZXMgPSBbbmV3IEZyYW1lKGFhYmIsIHJhdGUpXVxuXG4gIHJldHVybiBuZXcgQW5pbWF0aW9uKGZyYW1lcywgdHJ1ZSwgcmF0ZSlcbn1cbiIsImZ1bmN0aW9uIENoYW5uZWwgKGNvbnRleHQsIG5hbWUpIHtcbiAgbGV0IGNoYW5uZWwgPSBjb250ZXh0LmNyZWF0ZUdhaW4oKVxuICBcbiAgbGV0IGNvbm5lY3RQYW5uZXIgPSBmdW5jdGlvbiAoc3JjLCBwYW5uZXIsIGNoYW4pIHtcbiAgICBzcmMuY29ubmVjdChwYW5uZXIpXG4gICAgcGFubmVyLmNvbm5lY3QoY2hhbikgXG4gIH1cblxuICBsZXQgYmFzZVBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucz17fSkge1xuICAgIGxldCBzaG91bGRMb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGJ1ZmZlciwgcGFubmVyKSB7XG4gICAgICBsZXQgc3JjID0gY2hhbm5lbC5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpIFxuXG4gICAgICBpZiAocGFubmVyKSBjb25uZWN0UGFubmVyKHNyYywgcGFubmVyLCBjaGFubmVsKVxuICAgICAgZWxzZSAgICAgICAgc3JjLmNvbm5lY3QoY2hhbm5lbClcblxuICAgICAgc3JjLmxvb3AgICA9IHNob3VsZExvb3BcbiAgICAgIHNyYy5idWZmZXIgPSBidWZmZXJcbiAgICAgIHNyYy5zdGFydCgwKVxuICAgICAgcmV0dXJuIHNyY1xuICAgIH0gXG4gIH1cblxuICBjaGFubmVsLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ2b2x1bWVcIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0KCkgeyByZXR1cm4gY2hhbm5lbC5nYWluLnZhbHVlIH0sXG4gICAgc2V0KHZhbHVlKSB7IGNoYW5uZWwuZ2Fpbi52YWx1ZSA9IHZhbHVlIH1cbiAgfSlcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnYWluXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwgfVxuICB9KVxuXG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5sb29wID0gYmFzZVBsYXkoe2xvb3A6IHRydWV9KVxuICB0aGlzLnBsYXkgPSBiYXNlUGxheSgpXG59XG5cbmZ1bmN0aW9uIEF1ZGlvU3lzdGVtIChjaGFubmVsTmFtZXMpIHtcbiAgbGV0IGNvbnRleHQgID0gbmV3IEF1ZGlvQ29udGV4dFxuICBsZXQgY2hhbm5lbHMgPSB7fVxuICBsZXQgaSAgICAgICAgPSAtMVxuXG4gIHdoaWxlIChjaGFubmVsTmFtZXNbKytpXSkge1xuICAgIGNoYW5uZWxzW2NoYW5uZWxOYW1lc1tpXV0gPSBuZXcgQ2hhbm5lbChjb250ZXh0LCBjaGFubmVsTmFtZXNbaV0pXG4gIH1cbiAgdGhpcy5jb250ZXh0ICA9IGNvbnRleHQgXG4gIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVsc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvU3lzdGVtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENhY2hlIChrZXlOYW1lcykge1xuICBpZiAoIWtleU5hbWVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgc29tZSBrZXlOYW1lc1wiKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgKytpKSB0aGlzW2tleU5hbWVzW2ldXSA9IHt9XG59XG4iLCJsZXQge3RyYW5zcG9zZSwgdHJhbnNsYXRlLCBjcmVhdGV9ID0gcmVxdWlyZShcImdsLW1hdDNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmFcblxuZnVuY3Rpb24gQ2FtZXJhICh3LCBoLCB4LCB5KSB7XG4gIGxldCBtYXQgPSBjcmVhdGUoKVxuXG4gIHRoaXMueCA9IHhcbiAgdGhpcy55ID0geVxuICB0aGlzLncgPSB3XG4gIHRoaXMuaCA9IGhcblxuICB0aGlzLnJvdGF0aW9uID0gMFxuICB0aGlzLnNjYWxlICAgID0gMVxuXG4gIC8vVE9ETzogU3RhcnQgd2l0aCBvbmx5IHRyYW5zbGF0aW9uIVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtYXRyaXhcIiwge1xuICAgIGdldCgpIHtcbiAgICAgIG1hdFs2XSA9IC10aGlzLnhcbiAgICAgIG1hdFs3XSA9IC10aGlzLnlcbiAgICAgIHJldHVybiBtYXRcbiAgICB9XG4gIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXG5cbmZ1bmN0aW9uIENsb2NrICh0aW1lRm49RGF0ZS5ub3cpIHtcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcbiAgdGhpcy5kVCA9IDBcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxuICAgIHRoaXMubmV3VGltZSA9IHRpbWVGbigpICBcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbiAgfVxufVxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXG5cbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xuICB0aGlzLmVudGl0aWVzICA9IFtdXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXG4gIHJldHVybiBpZFxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcbiAgbGV0IGkgPSAtMVxuICBsZXQgZW50aXR5XG5cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxuXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxuICB9XG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxufVxuIiwibGV0IHtzcHJpdGVWZXJ0ZXhTaGFkZXIsIHNwcml0ZUZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcbmxldCB7cG9seWdvblZlcnRleFNoYWRlciwgcG9seWdvbkZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcbmxldCB7c2V0Qm94fSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5sZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gICAgID0gMlxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcbmNvbnN0IFBPSU5UU19QRVJfQk9YICAgICAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcbmNvbnN0IE1BWF9WRVJURVhfQ09VTlQgICAgPSAxMDAwMDAwXG5cbmZ1bmN0aW9uIEJveEFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIENlbnRlckFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIEJPWF9MRU5HVEgpXG59XG5cbmZ1bmN0aW9uIFNjYWxlQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47ICsraSkgYXJbaV0gPSAxXG4gIHJldHVybiBhclxufVxuXG5mdW5jdGlvbiBSb3RhdGlvbkFycmF5IChjb3VudCkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIFBPSU5UU19QRVJfQk9YKVxufVxuXG4vL3RleHR1cmUgY29vcmRzIGFyZSBpbml0aWFsaXplZCB0byAwIC0+IDEgdGV4dHVyZSBjb29yZCBzcGFjZVxuZnVuY3Rpb24gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkgKGNvdW50KSB7XG4gIGxldCBhciA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKSAgXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyLmxlbmd0aDsgaSA8IGxlbjsgaSArPSBCT1hfTEVOR1RIKSB7XG4gICAgc2V0Qm94KGFyLCBpLCAxLCAxLCAwLCAwKVxuICB9IFxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gSW5kZXhBcnJheSAoc2l6ZSkge1xuICByZXR1cm4gbmV3IFVpbnQxNkFycmF5KHNpemUpXG59XG5cbmZ1bmN0aW9uIFZlcnRleEFycmF5IChzaXplKSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiBQT0lOVF9ESU1FTlNJT04pXG59XG5cbi8vNCBmb3IgciwgZywgYiwgYVxuZnVuY3Rpb24gVmVydGV4Q29sb3JBcnJheSAoc2l6ZSkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShzaXplICogNClcbn1cblxuZnVuY3Rpb24gU3ByaXRlQmF0Y2ggKHNpemUpIHtcbiAgdGhpcy5jb3VudCAgICAgID0gMFxuICB0aGlzLmJveGVzICAgICAgPSBCb3hBcnJheShzaXplKVxuICB0aGlzLmNlbnRlcnMgICAgPSBDZW50ZXJBcnJheShzaXplKVxuICB0aGlzLnNjYWxlcyAgICAgPSBTY2FsZUFycmF5KHNpemUpXG4gIHRoaXMucm90YXRpb25zICA9IFJvdGF0aW9uQXJyYXkoc2l6ZSlcbiAgdGhpcy50ZXhDb29yZHMgID0gVGV4dHVyZUNvb3JkaW5hdGVzQXJyYXkoc2l6ZSlcbn1cblxuZnVuY3Rpb24gUG9seWdvbkJhdGNoIChzaXplKSB7XG4gIHRoaXMuaW5kZXggICAgICAgID0gMFxuICB0aGlzLmluZGljZXMgICAgICA9IEluZGV4QXJyYXkoc2l6ZSlcbiAgdGhpcy52ZXJ0aWNlcyAgICAgPSBWZXJ0ZXhBcnJheShzaXplKVxuICB0aGlzLnZlcnRleENvbG9ycyA9IFZlcnRleENvbG9yQXJyYXkoc2l6ZSlcbn1cblxuZnVuY3Rpb24gR0xSZW5kZXJlciAoY2FudmFzLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIGxldCBtYXhTcHJpdGVDb3VudCA9IDEwMFxuICBsZXQgdmlldyAgICAgICAgICAgPSBjYW52YXNcbiAgbGV0IGdsICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKSAgICAgIFxuICBsZXQgc3ZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHNwcml0ZVZlcnRleFNoYWRlcilcbiAgbGV0IHNmcyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIHNwcml0ZUZyYWdtZW50U2hhZGVyKVxuICBsZXQgcHZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHBvbHlnb25WZXJ0ZXhTaGFkZXIpXG4gIGxldCBwZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBwb2x5Z29uRnJhZ21lbnRTaGFkZXIpXG4gIGxldCBzcHJpdGVQcm9ncmFtICA9IFByb2dyYW0oZ2wsIHN2cywgc2ZzKVxuICBsZXQgcG9seWdvblByb2dyYW0gPSBQcm9ncmFtKGdsLCBwdnMsIHBmcylcblxuICAvL1Nwcml0ZSBzaGFkZXIgYnVmZmVyc1xuICBsZXQgYm94QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgY2VudGVyQnVmZmVyICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgc2NhbGVCdWZmZXIgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgcm90YXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgdGV4Q29vcmRCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuXG4gIC8vcG9seWdvbiBzaGFkZXIgYnVmZmVyc1xuICBsZXQgdmVydGV4QnVmZmVyICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgdmVydGV4Q29sb3JCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICBsZXQgaW5kZXhCdWZmZXIgICAgICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuXG4gIC8vR1BVIGJ1ZmZlciBsb2NhdGlvbnNcbiAgbGV0IGJveExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfcG9zaXRpb25cIilcbiAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcImFfdGV4Q29vcmRcIilcbiAgLy9sZXQgY2VudGVyTG9jYXRpb24gICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jZW50ZXJcIilcbiAgLy9sZXQgc2NhbGVMb2NhdGlvbiAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9zY2FsZVwiKVxuICAvL2xldCByb3RMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3JvdGF0aW9uXCIpXG5cbiAgbGV0IHZlcnRleExvY2F0aW9uICAgICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJhX3ZlcnRleFwiKVxuICBsZXQgdmVydGV4Q29sb3JMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcImFfdmVydGV4Q29sb3JcIilcblxuICAvL3dvcmxkIHNpemUgdW5pZm9ybXNcbiAgbGV0IHdvcmxkU2l6ZVNwcml0ZUxvY2F0aW9uICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG4gIGxldCB3b3JsZFNpemVQb2x5Z29uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwidV93b3JsZFNpemVcIilcblxuICAvL2NhbWVyYSB1bmlmb3Jtc1xuICBsZXQgY2FtZXJhVHJhbnNmb3JtU3ByaXRlTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJ1X2NhbWVyYVRyYW5zZm9ybVwiKVxuICAvL2xldCBjYW1lcmFUcmFuc2Zvcm1Qb2x5Z29uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwid19jYW1lcmFUcmFuc2Zvcm1cIilcblxuXG4gIGxldCBpbWFnZVRvVGV4dHVyZU1hcCA9IG5ldyBNYXAoKVxuICBsZXQgdGV4dHVyZVRvQmF0Y2hNYXAgPSBuZXcgTWFwKClcbiAgbGV0IHBvbHlnb25CYXRjaCAgICAgID0gbmV3IFBvbHlnb25CYXRjaChNQVhfVkVSVEVYX0NPVU5UKVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuZW5hYmxlKGdsLkNVTExfRkFDRSlcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAxLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcbiAgICB3aWR0aDogIHdpZHRoIHx8IDE5MjAsIFxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcbiAgfVxuXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xuICAgIHRleHR1cmVUb0JhdGNoTWFwLnNldCh0ZXh0dXJlLCBuZXcgU3ByaXRlQmF0Y2gobWF4U3ByaXRlQ291bnQpKVxuICAgIHJldHVybiB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodGV4dHVyZSlcbiAgfVxuXG4gIHRoaXMuYWRkVGV4dHVyZSA9IChpbWFnZSkgPT4ge1xuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcblxuICAgIGltYWdlVG9UZXh0dXJlTWFwLnNldChpbWFnZSwgdGV4dHVyZSlcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpXG4gICAgcmV0dXJuIHRleHR1cmVcbiAgfVxuXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XG5cbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxuICB9XG5cbiAgdGhpcy5hZGRTcHJpdGUgPSAoaW1hZ2UsIHcsIGgsIHgsIHksIHRleHcsIHRleGgsIHRleHgsIHRleHkpID0+IHtcbiAgICBsZXQgdHggICAgPSBpbWFnZVRvVGV4dHVyZU1hcC5nZXQoaW1hZ2UpIHx8IHRoaXMuYWRkVGV4dHVyZShpbWFnZSlcbiAgICBsZXQgYmF0Y2ggPSB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodHgpIHx8IHRoaXMuYWRkQmF0Y2godHgpXG5cbiAgICBzZXRCb3goYmF0Y2guYm94ZXMsIGJhdGNoLmNvdW50LCB3LCBoLCB4LCB5KVxuICAgIHNldEJveChiYXRjaC50ZXhDb29yZHMsIGJhdGNoLmNvdW50LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KVxuICAgIGJhdGNoLmNvdW50KytcbiAgfVxuXG4gIHRoaXMuYWRkUG9seWdvbiA9ICh2ZXJ0aWNlcywgaW5kaWNlcywgdmVydGV4Q29sb3JzKSA9PiB7XG4gICAgbGV0IHZlcnRleENvdW50ID0gaW5kaWNlcy5sZW5ndGhcblxuICAgIHBvbHlnb25CYXRjaC52ZXJ0aWNlcy5zZXQodmVydGljZXMsIHBvbHlnb25CYXRjaC5pbmRleClcbiAgICBwb2x5Z29uQmF0Y2guaW5kaWNlcy5zZXQoaW5kaWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxuICAgIHBvbHlnb25CYXRjaC52ZXJ0ZXhDb2xvcnMuc2V0KHZlcnRleENvbG9ycywgcG9seWdvbkJhdGNoLmluZGV4KVxuICAgIHBvbHlnb25CYXRjaC5pbmRleCArPSB2ZXJ0ZXhDb3VudFxuICB9XG5cbiAgbGV0IHJlc2V0UG9seWdvbnMgPSAoYmF0Y2gpID0+IGJhdGNoLmluZGV4ID0gMFxuXG4gIGxldCBkcmF3UG9seWdvbnMgPSAoYmF0Y2gpID0+IHtcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIFxuICAgICAgdmVydGV4QnVmZmVyLCBcbiAgICAgIHZlcnRleExvY2F0aW9uLCBcbiAgICAgIFBPSU5UX0RJTUVOU0lPTiwgXG4gICAgICBiYXRjaC52ZXJ0aWNlcylcbiAgICB1cGRhdGVCdWZmZXIoXG4gICAgICBnbCwgXG4gICAgICB2ZXJ0ZXhDb2xvckJ1ZmZlciwgXG4gICAgICB2ZXJ0ZXhDb2xvckxvY2F0aW9uLCBcbiAgICAgIENPTE9SX0NIQU5ORUxfQ09VTlQsIFxuICAgICAgYmF0Y2gudmVydGV4Q29sb3JzKVxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGV4QnVmZmVyKVxuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGJhdGNoLmluZGljZXMsIGdsLkRZTkFNSUNfRFJBVylcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBiYXRjaC5pbmRleCwgZ2wuVU5TSUdORURfU0hPUlQsIDApXG4gIH1cblxuICBsZXQgcmVzZXRCYXRjaCA9IChiYXRjaCkgPT4gYmF0Y2guY291bnQgPSAwXG5cbiAgbGV0IGRyYXdCYXRjaCA9IChiYXRjaCwgdGV4dHVyZSkgPT4ge1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBib3hCdWZmZXIsIGJveExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJhdGNoLmJveGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgcm90YXRpb25CdWZmZXIsIHJvdExvY2F0aW9uLCAxLCByb3RhdGlvbnMpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC50ZXhDb29yZHMpXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGJhdGNoLmNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG4gIH1cblxuICB0aGlzLmZsdXNoU3ByaXRlcyA9ICgpID0+IHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2gocmVzZXRCYXRjaClcblxuICB0aGlzLmZsdXNoUG9seWdvbnMgPSAoKSA9PiByZXNldFBvbHlnb25zKHBvbHlnb25CYXRjaClcblxuICB0aGlzLnJlbmRlciA9IChjYW1lcmFUcmFuc2Zvcm0pID0+IHtcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxuXG4gICAgLy9TcHJpdGVzaGVldCBiYXRjaCByZW5kZXJpbmdcbiAgICBnbC51c2VQcm9ncmFtKHNwcml0ZVByb2dyYW0pXG4gICAgLy9UT0RPOiBoYXJkY29kZWQgZm9yIHRoZSBtb21lbnQgZm9yIHRlc3RpbmdcbiAgICBnbC51bmlmb3JtMmYod29ybGRTaXplU3ByaXRlTG9jYXRpb24sIDE5MjAsIDEwODApXG4gICAgZ2wudW5pZm9ybU1hdHJpeDNmdihjYW1lcmFUcmFuc2Zvcm1TcHJpdGVMb2NhdGlvbiwgZmFsc2UsIGNhbWVyYVRyYW5zZm9ybSlcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKGRyYXdCYXRjaClcblxuICAgIC8vcG9sZ29uIHJlbmRlcmluZ1xuICAgIC8vZ2wudXNlUHJvZ3JhbShwb2x5Z29uUHJvZ3JhbSlcbiAgICAvLy8vVE9ETzogaGFyZGNvZGVkIGZvciB0aGUgbW9tZW50IGZvciB0ZXN0aW5nXG4gICAgLy9nbC51bmlmb3JtMmYod29ybGRTaXplUG9seWdvbkxvY2F0aW9uLCAxOTIwLCAxMDgwKVxuICAgIC8vZHJhd1BvbHlnb25zKHBvbHlnb25CYXRjaClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZVxuXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxuZnVuY3Rpb24gR2FtZSAoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcblxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcbiAgfVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxuXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXG59XG5cbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dE1hbmFnZXJcblxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChrZXlib2FyZE1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXG5cbmNvbnN0IEtFWV9DT1VOVCA9IDI1NlxuXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XG4gIGxldCBpc0Rvd25zICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIGxldCBkb3duRHVyYXRpb25zID0gbmV3IFVpbnQzMkFycmF5KEtFWV9DT1VOVClcbiAgXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3REb3duc1trZXlDb2RlXSA9ICFpc0Rvd25zW2tleUNvZGVdXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSBmYWxzZVxuICB9XG5cbiAgbGV0IGhhbmRsZUJsdXIgPSAoKSA9PiB7XG4gICAgbGV0IGkgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xuICAgICAgaXNEb3duc1tpXSAgID0gMFxuICAgICAganVzdERvd25zW2ldID0gMFxuICAgICAganVzdFVwc1tpXSAgID0gMFxuICAgIH1cbiAgfVxuXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xuICB0aGlzLmp1c3REb3ducyAgICAgPSBqdXN0RG93bnNcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xuXG4gIHRoaXMudGljayA9IChkVCkgPT4ge1xuICAgIGxldCBpID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcbiAgICAgIGlmIChpc0Rvd25zW2ldKSBkb3duRHVyYXRpb25zW2ldICs9IGRUXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXG59XG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cblxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJzcHJpdGVcIl0pXG59XG5cbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcbiAgbGV0IGkgICA9IC0xXG4gIGxldCBlbnRcbiAgbGV0IHRpbWVMZWZ0XG4gIGxldCBjdXJyZW50SW5kZXhcbiAgbGV0IGN1cnJlbnRBbmltXG4gIGxldCBjdXJyZW50RnJhbWVcbiAgbGV0IG5leHRGcmFtZVxuICBsZXQgb3ZlcnNob290XG4gIGxldCBzaG91bGRBZHZhbmNlXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcbiAgICBjdXJyZW50SW5kZXggID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXhcbiAgICBjdXJyZW50QW5pbSAgID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uXG4gICAgY3VycmVudEZyYW1lICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXhdXG4gICAgbmV4dEZyYW1lICAgICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXggKyAxXSB8fCBjdXJyZW50QW5pbS5mcmFtZXNbMF1cbiAgICB0aW1lTGVmdCAgICAgID0gZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZVxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXG4gICAgICBcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xuICAgICAgZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXggPSBjdXJyZW50QW5pbS5mcmFtZXMuaW5kZXhPZihuZXh0RnJhbWUpXG4gICAgICBlbnQuc3ByaXRlLnRpbWVUaWxsTmV4dEZyYW1lICAgICA9IG5leHRGcmFtZS5kdXJhdGlvbiArIG92ZXJzaG9vdCBcbiAgICB9IGVsc2Uge1xuICAgICAgZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcbiAgICB9XG4gIH1cbn1cbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcblxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcblxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcblxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gICAgICB4aHIuc2VuZChudWxsKVxuICAgIH0gXG4gIH1cblxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcblxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXG5cbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICBcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXG4gICAgaS5zcmMgICAgID0gcGF0aFxuICB9XG5cbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXG5cbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXG4gICAgfSkgXG4gIH1cblxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXG4gICAgfVxuXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzb3VuZENvdW50LS1cbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgdGV4dHVyZUNvdW50LS1cbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNoYWRlckNvdW50LS1cbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cblxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXG5cbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cblxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXG5cbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXG59XG5cblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7Y2xvY2ssIGlucHV0TWFuYWdlcn0gPSBzY2VuZS5nYW1lXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxuICBsZXQgbW92ZVNwZWVkID0gMVxuICBsZXQgcGFkZGxlICAgID0gZW50aXRpZXNbMF1cblxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcbiAgaWYgKCFwYWRkbGUpIHJldHVyblxuXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQb2x5Z29uXG5cbmZ1bmN0aW9uIFBvbHlnb24gKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpIHtcbiAgdGhpcy52ZXJ0aWNlcyAgICAgPSB2ZXJ0aWNlc1xuICB0aGlzLmluZGljZXMgICAgICA9IGluZGljZXNcbiAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSB2ZXJ0ZXhDb2xvcnNcbn1cblxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlnb25SZW5kZXJpbmdTeXN0ZW1cblxuZnVuY3Rpb24gUG9seWdvblJlbmRlcmluZ1N5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJwb2x5Z29uXCJdKVxufVxuXG5Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuICBsZXQgZW50XG5cbiAgcmVuZGVyZXIuZmx1c2hQb2x5Z29ucygpXG4gIFxuICB3aGlsZSAoKysgaSA8IGxlbikge1xuICAgIGVudCA9IGVudGl0aWVzW2ldIFxuICAgIC8vVE9ETzogdmVydGljZXMgc2hvdWxkIGJlIGluIGxvY2FsIGNvb3Jkcy4gIE5lZWQgdG8gdHJhbnNsYXRlIHRvIGdsb2JhbFxuICAgIHJlbmRlcmVyLmFkZFBvbHlnb24oZW50LnBvbHlnb24udmVydGljZXMsIGVudC5wb2x5Z29uLmluZGljZXMsIGVudC5wb2x5Z29uLnZlcnRleENvbG9ycylcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxuXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxuXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xuICB0aGlzLmdhbWUgICAgPSBudWxsXG59XG5cblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBjYihudWxsLCBudWxsKSAgXG59XG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZFQpIHtcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IHN5c3RlbVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXG4gICAgc3lzdGVtLnJ1bih0aGlzLCBzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxuICB9XG59XG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcblxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxuXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xuXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxuXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxuXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxuICB9XG5cbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxuXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXG4gIH1cbn1cbiIsImxldCBTeXN0ZW0gID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU3ByaXRlUmVuZGVyaW5nU3lzdGVtXG5cbmZ1bmN0aW9uIFNwcml0ZVJlbmRlcmluZ1N5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJzcHJpdGVcIl0pXG59XG5cblNwcml0ZVJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxuICBsZXQgaSAgID0gLTFcbiAgbGV0IGVudFxuICBsZXQgZnJhbWVcblxuICByZW5kZXJlci5mbHVzaFNwcml0ZXMoKVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBlbnQgICA9IGVudGl0aWVzW2ldXG4gICAgZnJhbWUgPSBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb24uZnJhbWVzW2VudC5zcHJpdGUuY3VycmVudEFuaW1hdGlvbkluZGV4XVxuXG4gICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxuICAgICAgZW50LnNwcml0ZS5pbWFnZSxcbiAgICAgIGVudC5waHlzaWNzLndpZHRoLFxuICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxuICAgICAgZW50LnBoeXNpY3MueCxcbiAgICAgIGVudC5waHlzaWNzLnksXG4gICAgICBmcmFtZS5hYWJiLncgLyBlbnQuc3ByaXRlLmltYWdlLndpZHRoLFxuICAgICAgZnJhbWUuYWFiYi5oIC8gZW50LnNwcml0ZS5pbWFnZS5oZWlnaHQsXG4gICAgICBmcmFtZS5hYWJiLnggLyBlbnQuc3ByaXRlLmltYWdlLndpZHRoLFxuICAgICAgZnJhbWUuYWFiYi55IC8gZW50LnNwcml0ZS5pbWFnZS5oZWlnaHRcbiAgICApXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXG5cbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXG59XG5cbi8vc2NlbmUuZ2FtZS5jbG9ja1xuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XG59XG4iLCJsZXQge1BhZGRsZSwgQmxvY2ssIEZpZ2h0ZXIsIFdhdGVyfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXG5sZXQgUGFkZGxlTW92ZXJTeXN0ZW0gICAgICAgPSByZXF1aXJlKFwiLi9QYWRkbGVNb3ZlclN5c3RlbVwiKVxubGV0IFNwcml0ZVJlbmRlcmluZ1N5c3RlbSAgID0gcmVxdWlyZShcIi4vU3ByaXRlUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgUG9seWdvblJlbmRlcmluZ1N5c3RlbSAgPSByZXF1aXJlKFwiLi9Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gPSByZXF1aXJlKFwiLi9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbVwiKVxubGV0IFNjZW5lICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcblxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcbiAgbGV0IHN5c3RlbXMgPSBbXG4gICAgbmV3IFBhZGRsZU1vdmVyU3lzdGVtLCBcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXG4gICAgbmV3IFBvbHlnb25SZW5kZXJpbmdTeXN0ZW0sXG4gICAgbmV3IFNwcml0ZVJlbmRlcmluZ1N5c3RlbSxcbiAgXVxuXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXG59XG5cblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcblxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlLCBhdWRpb1N5c3RlbX0gPSB0aGlzLmdhbWUgXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcbiAgbGV0IGFzc2V0cyA9IHtcbiAgICAvL3NvdW5kczogeyBiZ011c2ljOiBcIi9wdWJsaWMvc291bmRzL2JnbTEubXAzXCIgfSxcbiAgICB0ZXh0dXJlczogeyBcbiAgICAgIHBhZGRsZTogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcGFkZGxlLnBuZ1wiLFxuICAgICAgYmxvY2tzOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCIsXG4gICAgICBmaWdodGVyOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3B1bmNoLnBuZ1wiXG4gICAgfVxuICB9XG5cbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxuXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyArK2kpIHtcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxMDApKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxNDUpKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxOTApKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAyMzUpKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAyODApKSBcbiAgICB9XG5cbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDYwMCwgNjAwKSlcbiAgICAvL2VudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgRmlnaHRlcih0ZXh0dXJlcy5maWdodGVyLCA3NiwgNTksIDUwMCwgNTAwKSlcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFdhdGVyKDE5MjAsIDI4MCwgMCwgODAwLCAxMDApKVxuICAgIC8vYmcudm9sdW1lID0gMFxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcbiAgICBjYihudWxsKVxuICB9KVxufVxuIiwibGV0IFBvbHlnb24gPSByZXF1aXJlKFwiLi9Qb2x5Z29uXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gV2F0ZXJQb2x5Z29uXG5cbmNvbnN0IFBPSU5UU19QRVJfVkVSVEVYICAgPSAyXG5jb25zdCBDT0xPUl9DSEFOTkVMX0NPVU5UID0gNFxuY29uc3QgSU5ESUNFU19QRVJfUVVBRCAgICA9IDZcbmNvbnN0IFFVQURfVkVSVEVYX1NJWkUgICAgPSA4XG5cbmZ1bmN0aW9uIHNldFZlcnRleCAodmVydGljZXMsIGluZGV4LCB4LCB5KSB7XG4gIGxldCBpID0gaW5kZXggKiBQT0lOVFNfUEVSX1ZFUlRFWFxuXG4gIHZlcnRpY2VzW2ldICAgPSB4XG4gIHZlcnRpY2VzW2krMV0gPSB5XG59XG5cbmZ1bmN0aW9uIHNldENvbG9yIChjb2xvcnMsIGluZGV4LCBjb2xvcikge1xuICBsZXQgaSA9IGluZGV4ICogQ09MT1JfQ0hBTk5FTF9DT1VOVFxuXG4gIGNvbG9ycy5zZXQoY29sb3IsIGkpXG59XG5cbmZ1bmN0aW9uIFdhdGVyUG9seWdvbiAodywgaCwgeCwgeSwgc2xpY2VDb3VudCwgdG9wQ29sb3IsIGJvdHRvbUNvbG9yKSB7XG4gIGxldCB2ZXJ0ZXhDb3VudCAgPSAyICsgKHNsaWNlQ291bnQgKiAyKVxuICBsZXQgdmVydGljZXMgICAgID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIFBPSU5UU19QRVJfVkVSVEVYKVxuICBsZXQgdmVydGV4Q29sb3JzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIENPTE9SX0NIQU5ORUxfQ09VTlQpXG4gIGxldCBpbmRpY2VzICAgICAgPSBuZXcgVWludDE2QXJyYXkoSU5ESUNFU19QRVJfUVVBRCAqIHNsaWNlQ291bnQpXG4gIGxldCB1bml0V2lkdGggICAgPSB3IC8gc2xpY2VDb3VudFxuICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgbGV0IGogICAgICAgICAgICA9IC0xXG5cbiAgd2hpbGUgKCArK2kgPD0gc2xpY2VDb3VudCApIHtcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGksICh4ICsgdW5pdFdpZHRoICogaSksIHkpXG4gICAgc2V0Q29sb3IodmVydGV4Q29sb3JzLCBpLCB0b3BDb2xvcilcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGkgKyBzbGljZUNvdW50ICsgMSwgKHggKyB1bml0V2lkdGggKiBpKSwgeSArIGgpXG4gICAgc2V0Q29sb3IodmVydGV4Q29sb3JzLCBpICsgc2xpY2VDb3VudCArIDEsIGJvdHRvbUNvbG9yKVxuICB9XG5cbiAgd2hpbGUgKCArKyBqIDwgc2xpY2VDb3VudCApIHtcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRF0gICA9IGogKyAxXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMV0gPSBqXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMl0gPSBqICsgMSArIHNsaWNlQ291bnRcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCszXSA9IGogKyAxXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrNF0gPSBqICsgMSArIHNsaWNlQ291bnRcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCs1XSA9IGogKyAyICsgc2xpY2VDb3VudFxuICB9XG5cbiAgcmV0dXJuIG5ldyBQb2x5Z29uKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpXG59XG4iLCJsZXQge1BoeXNpY3MsIFBsYXllckNvbnRyb2xsZWR9ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IHtTcHJpdGUsIFBvbHlnb259ID0gcmVxdWlyZShcIi4vY29tcG9uZW50c1wiKVxubGV0IEFuaW1hdGlvbiAgICA9IHJlcXVpcmUoXCIuL0FuaW1hdGlvblwiKVxubGV0IEVudGl0eSAgICAgICA9IHJlcXVpcmUoXCIuL0VudGl0eVwiKVxubGV0IFdhdGVyUG9seWdvbiA9IHJlcXVpcmUoXCIuL1dhdGVyUG9seWdvblwiKVxuXG5tb2R1bGUuZXhwb3J0cy5QYWRkbGUgID0gUGFkZGxlXG5tb2R1bGUuZXhwb3J0cy5CbG9jayAgID0gQmxvY2tcbm1vZHVsZS5leHBvcnRzLkZpZ2h0ZXIgPSBGaWdodGVyXG5tb2R1bGUuZXhwb3J0cy5XYXRlciAgID0gV2F0ZXJcblxuZnVuY3Rpb24gUGFkZGxlIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFBsYXllckNvbnRyb2xsZWQodGhpcylcbiAgU3ByaXRlKHRoaXMsIHcsIGgsIGltYWdlLCBcImlkbGVcIiwge1xuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVTaW5nbGUoMTEyLCAyNSwgMCwgMClcbiAgfSlcbn1cblxuZnVuY3Rpb24gQmxvY2sgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbiAgU3ByaXRlKHRoaXMsIHcsIGgsIGltYWdlLCBcImlkbGVcIiwge1xuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoNDQsIDIyLCAwLCAwLCAzLCB0cnVlLCAxMDAwKVxuICB9KVxufVxuXG5mdW5jdGlvbiBGaWdodGVyIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFNwcml0ZSh0aGlzLCB3LCBoLCBpbWFnZSwgXCJmaXJlYmFsbFwiLCB7XG4gICAgZmlyZWJhbGw6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoMTc0LCAxMzQsIDAsIDAsIDI1LCB0cnVlKVxuICB9KVxufVxuXG5mdW5jdGlvbiBXYXRlciAodywgaCwgeCwgeSwgc2xpY2VDb3VudCwgdG9wQ29sb3IsIGJvdHRvbUNvbG9yKSB7XG4gIGxldCB0b3BDb2xvciAgICA9IHRvcENvbG9yIHx8IFswLCAwLCAuNSwgLjVdXG4gIGxldCBib3R0b21Db2xvciA9IGJvdHRvbUNvbG9yIHx8IFsuNywgLjcsIC44LCAuOV1cblxuICBFbnRpdHkuY2FsbCh0aGlzKVxuICAvL1RPRE86IFBvbHlnb25zIHNob3VsZCBzdG9yZSBsb2NhbCBjb29yZGluYXRlc1xuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFBvbHlnb24odGhpcywgV2F0ZXJQb2x5Z29uKHcsIGgsIHgsIHksIHNsaWNlQ291bnQsIHRvcENvbG9yLCBib3R0b21Db2xvcikpXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgICAgICAgID0gUGh5c2ljc1xubW9kdWxlLmV4cG9ydHMuUGxheWVyQ29udHJvbGxlZCA9IFBsYXllckNvbnRyb2xsZWRcbm1vZHVsZS5leHBvcnRzLlNwcml0ZSAgICAgICAgICAgPSBTcHJpdGVcbm1vZHVsZS5leHBvcnRzLlBvbHlnb24gICAgICAgICAgPSBQb2x5Z29uXG5cbmZ1bmN0aW9uIFNwcml0ZSAoZSwgd2lkdGgsIGhlaWdodCwgaW1hZ2UsIGN1cnJlbnRBbmltYXRpb25OYW1lLCBhbmltYXRpb25zKSB7XG4gIGUuc3ByaXRlID0ge1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBpbWFnZSxcbiAgICBhbmltYXRpb25zLFxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lLFxuICAgIGN1cnJlbnRBbmltYXRpb25JbmRleDogMCxcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1hdGlvbnNbY3VycmVudEFuaW1hdGlvbk5hbWVdLFxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbWF0aW9uc1tjdXJyZW50QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXG4gIH1cbn1cblxuZnVuY3Rpb24gUG9seWdvbiAoZSwgcG9seWdvbikge1xuICBlLnBvbHlnb24gPSBwb2x5Z29uXG59XG5cbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgZS5waHlzaWNzID0ge1xuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHgsIFxuICAgIHksIFxuICAgIGR4OiAgMCwgXG4gICAgZHk6ICAwLCBcbiAgICBkZHg6IDAsIFxuICAgIGRkeTogMFxuICB9XG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBsYXllckNvbnRyb2xsZWQgKGUpIHtcbiAgZS5wbGF5ZXJDb250cm9sbGVkID0gdHJ1ZVxufVxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXG5cbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IGZvdW5kID0gbnVsbFxuXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kXG59XG5cbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xuICBsZXQgaSA9IC0xXG4gIFxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXG59XG5cbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxuIiwibW9kdWxlLmV4cG9ydHMuc3ByaXRlVmVydGV4U2hhZGVyID0gXCIgXFxcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxuICBcXFxuICBhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOyBcXFxuICBhdHRyaWJ1dGUgdmVjMiBhX3RleENvb3JkOyBcXFxuICBcXFxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXG4gIHVuaWZvcm0gbWF0MyB1X2NhbWVyYVRyYW5zZm9ybTsgXFxcbiAgXFxcbiAgdmFyeWluZyB2ZWMyIHZfdGV4Q29vcmQ7IFxcXG4gIFxcXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxuICAgIHJldHVybiBwb3NpdGlvbiAqIDIuMCAtIDEuMDsgXFxcbiAgfSBcXFxuICBcXFxuICB2b2lkIG1haW4oKSB7IFxcXG4gICAgdmVjMiBzY3JlZW5Qb3MgICAgID0gKHVfY2FtZXJhVHJhbnNmb3JtICogdmVjMyhhX3Bvc2l0aW9uLCAxKSkueHk7IFxcXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcbiAgICB2ZWMyIGZyb21Xb3JsZFNpemUgPSBzY3JlZW5Qb3MgLyB1X3dvcmxkU2l6ZTsgXFxcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxuICAgIFxcXG4gICAgdl90ZXhDb29yZCAgPSBhX3RleENvb3JkOyBcXFxuICAgIGdsX1Bvc2l0aW9uID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXG4gIH1cIlxuXG5tb2R1bGUuZXhwb3J0cy5zcHJpdGVGcmFnbWVudFNoYWRlciA9IFwiXFxcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxuICBcXFxuICB1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOyBcXFxuICBcXFxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcbiAgXFxcbiAgdm9pZCBtYWluKCkgeyBcXFxuICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X2ltYWdlLCB2X3RleENvb3JkKTsgXFxcbiAgfVwiXG5cbm1vZHVsZS5leHBvcnRzLnBvbHlnb25WZXJ0ZXhTaGFkZXIgPSBcIlxcXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdmVydGV4OyBcXFxuICBhdHRyaWJ1dGUgdmVjNCBhX3ZlcnRleENvbG9yOyBcXFxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXG4gIHZhcnlpbmcgdmVjNCB2X3ZlcnRleENvbG9yOyBcXFxuICB2ZWMyIG5vcm0gKHZlYzIgcG9zaXRpb24pIHsgXFxcbiAgICByZXR1cm4gcG9zaXRpb24gKiAyLjAgLSAxLjA7IFxcXG4gIH0gXFxcbiAgdm9pZCBtYWluICgpIHsgXFxcbiAgICBtYXQyIGNsaXBTcGFjZSAgICAgPSBtYXQyKDEuMCwgMC4wLCAwLjAsIC0xLjApOyBcXFxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IGFfdmVydGV4IC8gdV93b3JsZFNpemU7IFxcXG4gICAgdmVjMiBwb3NpdGlvbiAgICAgID0gY2xpcFNwYWNlICogbm9ybShmcm9tV29ybGRTaXplKTsgXFxcbiAgICBcXFxuICAgIHZfdmVydGV4Q29sb3IgPSBhX3ZlcnRleENvbG9yOyBcXFxuICAgIGdsX1Bvc2l0aW9uICAgPSB2ZWM0KHBvc2l0aW9uLCAwLCAxKTsgXFxcbiAgfVwiXG5cbm1vZHVsZS5leHBvcnRzLnBvbHlnb25GcmFnbWVudFNoYWRlciA9IFwiXFxcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxuICBcXFxuICB2YXJ5aW5nIHZlYzQgdl92ZXJ0ZXhDb2xvcjsgXFxcbiAgXFxcbiAgdm9pZCBtYWluKCkgeyBcXFxuICAgIGdsX0ZyYWdDb2xvciA9IHZfdmVydGV4Q29sb3I7IFxcXG4gIH1cIlxuIiwiLy86OiA9PiBHTENvbnRleHQgLT4gRU5VTSAoVkVSVEVYIHx8IEZSQUdNRU5UKSAtPiBTdHJpbmcgKENvZGUpXG5mdW5jdGlvbiBTaGFkZXIgKGdsLCB0eXBlLCBzcmMpIHtcbiAgbGV0IHNoYWRlciAgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSlcbiAgbGV0IGlzVmFsaWQgPSBmYWxzZVxuICBcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcblxuICBpc1ZhbGlkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpXG5cbiAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgdmFsaWQgc2hhZGVyOiBcXG5cIiArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSlcbiAgcmV0dXJuICAgICAgICBzaGFkZXJcbn1cblxuLy86OiA9PiBHTENvbnRleHQgLT4gVmVydGV4U2hhZGVyIC0+IEZyYWdtZW50U2hhZGVyXG5mdW5jdGlvbiBQcm9ncmFtIChnbCwgdnMsIGZzKSB7XG4gIGxldCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSh2cywgZnMpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKVxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFRleHR1cmVcbmZ1bmN0aW9uIFRleHR1cmUgKGdsKSB7XG4gIGxldCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApXG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gIHJldHVybiB0ZXh0dXJlXG59XG5cbm1vZHVsZS5leHBvcnRzLlNoYWRlciAgPSBTaGFkZXJcbm1vZHVsZS5leHBvcnRzLlByb2dyYW0gPSBQcm9ncmFtXG5tb2R1bGUuZXhwb3J0cy5UZXh0dXJlID0gVGV4dHVyZVxuIiwibGV0IENhbWVyYSAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NhbWVyYVwiKVxubGV0IExvYWRlciAgICAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICAgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBFbnRpdHlTdG9yZSAgICAgPSByZXF1aXJlKFwiLi9FbnRpdHlTdG9yZS1TaW1wbGVcIilcbmxldCBDbG9jayAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IENhY2hlICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyICAgID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5sZXQgVGVzdFNjZW5lICAgICAgID0gcmVxdWlyZShcIi4vVGVzdFNjZW5lXCIpXG5sZXQgR2FtZSAgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVwiKVxubGV0IElucHV0TWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcbmxldCBpbnB1dE1hbmFnZXIgICAgPSBuZXcgSW5wdXRNYW5hZ2VyKGtleWJvYXJkTWFuYWdlcilcbmxldCBlbnRpdHlTdG9yZSAgICAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXG5sZXQgY2FjaGUgICAgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxubGV0IGxvYWRlciAgICAgICAgICA9IG5ldyBMb2FkZXJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIDE5MjAsIDEwODApXG5sZXQgYXVkaW9TeXN0ZW0gICAgID0gbmV3IEF1ZGlvU3lzdGVtKFtcIm1haW5cIiwgXCJiZ1wiXSlcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcbmxldCBnYW1lICAgICAgICAgICAgPSBuZXcgR2FtZShjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgZW50aXR5U3RvcmUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ2FtZSkge1xuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXG4gIGxldCBjbG9jayAgICAgICAgICA9IGdhbWUuY2xvY2tcbiAgbGV0IGlucHV0TWFuYWdlciAgID0gZ2FtZS5pbnB1dE1hbmFnZXJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICBjbG9jay50aWNrKClcbiAgICBpbnB1dE1hbmFnZXIua2V5Ym9hcmRNYW5hZ2VyLnRpY2soY2xvY2suZFQpXG4gICAgZ2FtZS5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmUudXBkYXRlKGNsb2NrLmRUKVxuICB9XG59XG5cbmxldCBjID0gbmV3IENhbWVyYSgxOTIwLCAxMDgwLCAwLCAwKVxuXG5jLnggPSA2MFxuYy55ID0gMTAwXG5cbndpbmRvdy5jID0gY1xuY29uc29sZS5sb2coYy5tYXRyaXgpXG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICBnYW1lLnJlbmRlcmVyLnJlbmRlcihjLm1hdHJpeClcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgIFxuICB9XG59XG5cbndpbmRvdy5nYW1lID0gZ2FtZVxuXG5mdW5jdGlvbiBzZXR1cERvY3VtZW50IChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpIHtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIH0pXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgc2V0dXBEb2N1bWVudChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpXG4gIGdhbWUuc3RhcnQoKVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSksIFVQREFURV9JTlRFUlZBTClcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy5jaGVja1R5cGUgICAgICA9IGNoZWNrVHlwZVxubW9kdWxlLmV4cG9ydHMuY2hlY2tWYWx1ZVR5cGUgPSBjaGVja1ZhbHVlVHlwZVxubW9kdWxlLmV4cG9ydHMuc2V0Qm94ICAgICAgICAgPSBzZXRCb3hcblxuY29uc3QgUE9JTlRfRElNRU5TSU9OICAgICA9IDJcbmNvbnN0IFBPSU5UU19QRVJfQk9YICAgICAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcblxuZnVuY3Rpb24gY2hlY2tUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIGN0b3IpKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIG9mIHR5cGUgXCIgKyBjdG9yLm5hbWUpXG59XG5cbmZ1bmN0aW9uIGNoZWNrVmFsdWVUeXBlIChpbnN0YW5jZSwgY3Rvcikge1xuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKGluc3RhbmNlKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkgY2hlY2tUeXBlKGluc3RhbmNlW2tleXNbaV1dLCBjdG9yKVxufVxuXG5mdW5jdGlvbiBzZXRCb3ggKGJveEFycmF5LCBpbmRleCwgdywgaCwgeCwgeSkge1xuICBsZXQgaSAgPSBCT1hfTEVOR1RIICogaW5kZXhcbiAgbGV0IHgxID0geFxuICBsZXQgeTEgPSB5IFxuICBsZXQgeDIgPSB4ICsgd1xuICBsZXQgeTIgPSB5ICsgaFxuXG4gIGJveEFycmF5W2ldICAgID0geDFcbiAgYm94QXJyYXlbaSsxXSAgPSB5MVxuICBib3hBcnJheVtpKzJdICA9IHgxXG4gIGJveEFycmF5W2krM10gID0geTJcbiAgYm94QXJyYXlbaSs0XSAgPSB4MlxuICBib3hBcnJheVtpKzVdICA9IHkxXG5cbiAgYm94QXJyYXlbaSs2XSAgPSB4MVxuICBib3hBcnJheVtpKzddICA9IHkyXG4gIGJveEFycmF5W2krOF0gID0geDJcbiAgYm94QXJyYXlbaSs5XSAgPSB5MlxuICBib3hBcnJheVtpKzEwXSA9IHgyXG4gIGJveEFycmF5W2krMTFdID0geTFcbn1cbiJdfQ==
