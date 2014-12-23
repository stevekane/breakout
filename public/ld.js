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

},{"./functions":47}],28:[function(require,module,exports){
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
var MAX_VERTEX_COUNT = 10000;

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
  var cameraTransformPolygonLocation = gl.getUniformLocation(polygonProgram, "u_cameraTransform");


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

  this.render = function (worldWidth, worldHeight, cameraTransform) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Spritesheet batch rendering
    gl.useProgram(spriteProgram);
    gl.uniform2f(worldSizeSpriteLocation, worldWidth, worldHeight);
    gl.uniformMatrix3fv(cameraTransformSpriteLocation, false, cameraTransform);
    textureToBatchMap.forEach(drawBatch);

    //Polgon rendering
    gl.useProgram(polygonProgram);
    gl.uniform2f(worldSizePolygonLocation, worldWidth, worldHeight);
    gl.uniformMatrix3fv(cameraTransformPolygonLocation, false, cameraTransform);
    drawPolygons(polygonBatch);
  };
}

},{"./gl-buffer":48,"./gl-shaders":49,"./gl-types":50,"./utils":53}],29:[function(require,module,exports){
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

},{"./AudioSystem":22,"./Cache":23,"./Clock":25,"./EntityStore-Simple":27,"./GLRenderer":28,"./InputManager":30,"./Loader":33,"./SceneManager":39,"./utils":53}],30:[function(require,module,exports){
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

},{"./KeyboardManager":31,"./utils":53}],31:[function(require,module,exports){
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

},{"./System":41}],33:[function(require,module,exports){
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

},{"./System":41}],35:[function(require,module,exports){
"use strict";

var _ref = require("./physics/newtonion");

var updateVelocity = _ref.updateVelocity;
var updatePosition = _ref.updatePosition;
var System = require("./System");

module.exports = PhysicsSystem;

function PhysicsSystem() {
  System.call(this, ["physics"]);
}

PhysicsSystem.prototype.run = function (scene, entities) {
  var dT = scene.game.clock.dT;
  var len = entities.length;
  var i = -1;
  var ent;

  while (++i < len) {
    ent = entities[i];
    updateVelocity(dT, ent.physics);
    updatePosition(dT, ent.physics);
  }
};

},{"./System":41,"./physics/newtonion":52}],36:[function(require,module,exports){
"use strict";

module.exports = Polygon;

function Polygon(vertices, indices, vertexColors) {
  this.vertices = vertices;
  this.indices = indices;
  this.vertexColors = vertexColors;
}

},{}],37:[function(require,module,exports){
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

},{"./System":41}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./functions":47}],40:[function(require,module,exports){
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

},{"./System":41}],41:[function(require,module,exports){
"use strict";

module.exports = System;

function System(componentNames) {
  if (componentNames === undefined) componentNames = [];
  this.componentNames = componentNames;
}

//scene.game.clock
System.prototype.run = function (scene, entities) {};

},{}],42:[function(require,module,exports){
"use strict";

var _ref = require("./assemblages");

var Paddle = _ref.Paddle;
var Block = _ref.Block;
var Fighter = _ref.Fighter;
var Water = _ref.Water;
var PaddleMoverSystem = require("./PaddleMoverSystem");
var PhysicsSystem = require("./PhysicsSystem");
var SpriteRenderingSystem = require("./SpriteRenderingSystem");
var PolygonRenderingSystem = require("./PolygonRenderingSystem");
var KeyframeAnimationSystem = require("./KeyframeAnimationSystem");
var Scene = require("./Scene");

module.exports = TestScene;

function TestScene() {
  var systems = [new PaddleMoverSystem(), new KeyframeAnimationSystem(), new PhysicsSystem(), new PolygonRenderingSystem(), new SpriteRenderingSystem()];

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

},{"./KeyframeAnimationSystem":32,"./PaddleMoverSystem":34,"./PhysicsSystem":35,"./PolygonRenderingSystem":37,"./Scene":38,"./SpriteRenderingSystem":40,"./assemblages":45}],43:[function(require,module,exports){
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

},{"./Polygon":36}],44:[function(require,module,exports){
"use strict";

module.exports = World;

function World(width, height) {
  this.width = width;
  this.height = height;
}

},{}],45:[function(require,module,exports){
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
  this.physics.dy = Math.random() * -2;
  this.physics.ddy = 0.001;
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

},{"./Animation":21,"./Entity":26,"./WaterPolygon":43,"./components":46}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
"use strict";

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer(gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0);
}

module.exports.updateBuffer = updateBuffer;

},{}],49:[function(require,module,exports){
"use strict";

module.exports.spriteVertexShader = "   precision highp float;     attribute vec2 a_position;   attribute vec2 a_texCoord;   uniform vec2 u_worldSize;   uniform mat3 u_cameraTransform;   varying vec2 v_texCoord;     vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }     void main() {     vec2 screenPos     = (u_cameraTransform * vec3(a_position, 1)).xy;     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = screenPos / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_texCoord  = a_texCoord;     gl_Position = vec4(position, 0, 1);   }";

module.exports.spriteFragmentShader = "  precision highp float;     uniform sampler2D u_image;     varying vec2 v_texCoord;     void main() {     gl_FragColor = texture2D(u_image, v_texCoord);   }";

module.exports.polygonVertexShader = "  attribute vec2 a_vertex;   attribute vec4 a_vertexColor;   uniform vec2 u_worldSize;   uniform mat3 u_cameraTransform;   varying vec4 v_vertexColor;   vec2 norm (vec2 position) {     return position * 2.0 - 1.0;   }   void main () {     vec2 screenPos     = (u_cameraTransform * vec3(a_vertex, 1)).xy;     mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0);     vec2 fromWorldSize = screenPos / u_worldSize;     vec2 position      = clipSpace * norm(fromWorldSize);         v_vertexColor = a_vertexColor;     gl_Position   = vec4(position, 0, 1);   }";

module.exports.polygonFragmentShader = "  precision highp float;     varying vec4 v_vertexColor;     void main() {     gl_FragColor = v_vertexColor;   }";

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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
var World = require("./World");
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

var w = new World(1920, 1080);
var c = new Camera(1920, 1080, 0, 0);

function makeAnimate(game) {
  return function animate() {
    game.renderer.render(w.width, w.height, c.matrix);
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

},{"./AudioSystem":22,"./Cache":23,"./Camera":24,"./Clock":25,"./EntityStore-Simple":27,"./GLRenderer":28,"./Game":29,"./InputManager":30,"./KeyboardManager":31,"./Loader":33,"./SceneManager":39,"./TestScene":42,"./World":44}],52:[function(require,module,exports){
"use strict";

module.exports.updateVelocity = updateVelocity;
module.exports.updatePosition = updatePosition;

function updateVelocity(dT, physics) {
  physics.dx += (dT * physics.ddx);
  physics.dy += (dT * physics.ddy);
}

function updatePosition(dT, physics) {
  physics.x += (dT * physics.dx);
  physics.y += (dT * physics.dy);
}

},{}],53:[function(require,module,exports){
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

},{}]},{},[51])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9hZGpvaW50LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvY2xvbmUuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9jb3B5LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZGV0ZXJtaW5hbnQuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9mcm9iLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1tYXQyLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1tYXQ0LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvZnJvbS1xdWF0LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvaWRlbnRpdHkuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0My9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL2ludmVydC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL211bHRpcGx5LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvbm9ybWFsLWZyb20tbWF0NC5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL3JvdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXQzL3NjYWxlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvc3RyLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvdHJhbnNsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdDMvdHJhbnNwb3NlLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQUFCQi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0FuaW1hdGlvbi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0F1ZGlvU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvQ2FjaGUuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DYW1lcmEuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9DbG9jay5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0VudGl0eVN0b3JlLVNpbXBsZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL0dMUmVuZGVyZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9HYW1lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvSW5wdXRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvS2V5Ym9hcmRNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9Mb2FkZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9QYWRkbGVNb3ZlclN5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1BoeXNpY3NTeXN0ZW0uanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9Qb2x5Z29uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvUG9seWdvblJlbmRlcmluZ1N5c3RlbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL1NjZW5lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU2NlbmVNYW5hZ2VyLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU3ByaXRlUmVuZGVyaW5nU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvU3lzdGVtLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvVGVzdFNjZW5lLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvV2F0ZXJQb2x5Z29uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvV29ybGQuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9hc3NlbWJsYWdlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL2NvbXBvbmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1idWZmZXIuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9nbC1zaGFkZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvZ2wtdHlwZXMuanMiLCIvVXNlcnMvc3RldmVua2FuZS9zaW1wbGVwb25nL3NyYy9sZC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3NpbXBsZXBvbmcvc3JjL3BoeXNpY3MvbmV3dG9uaW9uLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvc2ltcGxlcG9uZy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsQ0EsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsTUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDVixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNWLE1BQUksQ0FBQyxD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QUFJLFFBQVEsR0FBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFBO0FBQ3JELFFBQUksU0FBUyxHQUFLLFFBQVEsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUE7O0FBRXJELFVBQU0sQ0FBQyxLQUFLLEdBQUksUUFBUSxDQUFBO0FBQ3hCLFVBQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFBO0FBQ3pCLE1BQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUE7R0FDdkMsQ0FBQTs7QUFFRCxNQUFJLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUs7QUFDOUQsUUFBSSxFQUFFLEdBQU0saUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQUssVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2xFLFFBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxNQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTs7QUFFMUQsVUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUM1QyxVQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQzVELFNBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtHQUNkLENBQUE7O0FBRUQsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFLO0FBQ3JELFFB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SSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNkLE1BQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWQsVUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFNLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTtBQUNuQixVQUFRLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFJLEVBQUUsQ0FBQTs7QUFFbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBSSxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBUSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDcEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBhZGpvaW50XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMuYWRqb2ludFxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiBhZGpvaW50KG91dCwgYSkge1xuICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXVxuICB2YXIgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XVxuICB2YXIgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XVxuXG4gIG91dFswXSA9IChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpXG4gIG91dFsxXSA9IChhMDIgKiBhMjEgLSBhMDEgKiBhMjIpXG4gIG91dFsyXSA9IChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpXG4gIG91dFszXSA9IChhMTIgKiBhMjAgLSBhMTAgKiBhMjIpXG4gIG91dFs0XSA9IChhMDAgKiBhMjIgLSBhMDIgKiBhMjApXG4gIG91dFs1XSA9IChhMDIgKiBhMTAgLSBhMDAgKiBhMTIpXG4gIG91dFs2XSA9IChhMTAgKiBhMjEgLSBhMTEgKiBhMjApXG4gIG91dFs3XSA9IChhMDEgKiBhMjAgLSBhMDAgKiBhMjEpXG4gIG91dFs4XSA9IChhMDAgKiBhMTEgLSBhMDEgKiBhMTApXG5cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbG9uZVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MyBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBhbGlhcyBtYXQzLmNsb25lXG4gKiBAcGFyYW0ge21hdDN9IGEgbWF0cml4IHRvIGNsb25lXG4gKiBAcmV0dXJucyB7bWF0M30gYSBuZXcgM3gzIG1hdHJpeFxuICovXG5mdW5jdGlvbiBjbG9uZShhKSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDkpXG4gIG91dFswXSA9IGFbMF1cbiAgb3V0WzFdID0gYVsxXVxuICBvdXRbMl0gPSBhWzJdXG4gIG91dFszXSA9IGFbM11cbiAgb3V0WzRdID0gYVs0XVxuICBvdXRbNV0gPSBhWzVdXG4gIG91dFs2XSA9IGFbNl1cbiAgb3V0WzddID0gYVs3XVxuICBvdXRbOF0gPSBhWzhdXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gY29weVxuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQzIHRvIGFub3RoZXJcbiAqXG4gKiBAYWxpYXMgbWF0My5jb3B5XG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIGNvcHkob3V0LCBhKSB7XG4gIG91dFswXSA9IGFbMF1cbiAgb3V0WzFdID0gYVsxXVxuICBvdXRbMl0gPSBhWzJdXG4gIG91dFszXSA9IGFbM11cbiAgb3V0WzRdID0gYVs0XVxuICBvdXRbNV0gPSBhWzVdXG4gIG91dFs2XSA9IGFbNl1cbiAgb3V0WzddID0gYVs3XVxuICBvdXRbOF0gPSBhWzhdXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gY3JlYXRlXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMuY3JlYXRlXG4gKiBAcmV0dXJucyB7bWF0M30gYSBuZXcgM3gzIG1hdHJpeFxuICovXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDkpXG4gIG91dFswXSA9IDFcbiAgb3V0WzFdID0gMFxuICBvdXRbMl0gPSAwXG4gIG91dFszXSA9IDBcbiAgb3V0WzRdID0gMVxuICBvdXRbNV0gPSAwXG4gIG91dFs2XSA9IDBcbiAgb3V0WzddID0gMFxuICBvdXRbOF0gPSAxXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZGV0ZXJtaW5hbnRcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIG1hdDNcbiAqXG4gKiBAYWxpYXMgbWF0My5kZXRlcm1pbmFudFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbmZ1bmN0aW9uIGRldGVybWluYW50KGEpIHtcbiAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl1cbiAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV1cbiAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF1cblxuICByZXR1cm4gYTAwICogKGEyMiAqIGExMSAtIGExMiAqIGEyMSlcbiAgICAgICArIGEwMSAqIChhMTIgKiBhMjAgLSBhMjIgKiBhMTApXG4gICAgICAgKyBhMDIgKiAoYTIxICogYTEwIC0gYTExICogYTIwKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmcm9iXG5cbi8qKlxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDNcbiAqXG4gKiBAYWxpYXMgbWF0My5mcm9iXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbmZ1bmN0aW9uIGZyb2IoYSkge1xuICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgYVswXSphWzBdXG4gICAgKyBhWzFdKmFbMV1cbiAgICArIGFbMl0qYVsyXVxuICAgICsgYVszXSphWzNdXG4gICAgKyBhWzRdKmFbNF1cbiAgICArIGFbNV0qYVs1XVxuICAgICsgYVs2XSphWzZdXG4gICAgKyBhWzddKmFbN11cbiAgICArIGFbOF0qYVs4XVxuICApXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZyb21NYXQyZFxuXG4vKipcbiAqIENvcGllcyB0aGUgdmFsdWVzIGZyb20gYSBtYXQyZCBpbnRvIGEgbWF0M1xuICpcbiAqIEBhbGlhcyBtYXQzLmZyb21NYXQyZFxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byBjb3B5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKiovXG5mdW5jdGlvbiBmcm9tTWF0MmQob3V0LCBhKSB7XG4gIG91dFswXSA9IGFbMF1cbiAgb3V0WzFdID0gYVsxXVxuICBvdXRbMl0gPSAwXG5cbiAgb3V0WzNdID0gYVsyXVxuICBvdXRbNF0gPSBhWzNdXG4gIG91dFs1XSA9IDBcblxuICBvdXRbNl0gPSBhWzRdXG4gIG91dFs3XSA9IGFbNV1cbiAgb3V0WzhdID0gMVxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnJvbU1hdDRcblxuLyoqXG4gKiBDb3BpZXMgdGhlIHVwcGVyLWxlZnQgM3gzIHZhbHVlcyBpbnRvIHRoZSBnaXZlbiBtYXQzLlxuICpcbiAqIEBhbGlhcyBtYXQzLmZyb21NYXQ0XG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIDN4MyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSAgIHRoZSBzb3VyY2UgNHg0IG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiBmcm9tTWF0NChvdXQsIGEpIHtcbiAgb3V0WzBdID0gYVswXVxuICBvdXRbMV0gPSBhWzFdXG4gIG91dFsyXSA9IGFbMl1cbiAgb3V0WzNdID0gYVs0XVxuICBvdXRbNF0gPSBhWzVdXG4gIG91dFs1XSA9IGFbNl1cbiAgb3V0WzZdID0gYVs4XVxuICBvdXRbN10gPSBhWzldXG4gIG91dFs4XSA9IGFbMTBdXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnJvbVF1YXRcblxuLyoqXG4qIENhbGN1bGF0ZXMgYSAzeDMgbWF0cml4IGZyb20gdGhlIGdpdmVuIHF1YXRlcm5pb25cbipcbiogQGFsaWFzIG1hdDMuZnJvbVF1YXRcbiogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuKiBAcGFyYW0ge3F1YXR9IHEgUXVhdGVybmlvbiB0byBjcmVhdGUgbWF0cml4IGZyb21cbipcbiogQHJldHVybnMge21hdDN9IG91dFxuKi9cbmZ1bmN0aW9uIGZyb21RdWF0KG91dCwgcSkge1xuICB2YXIgeCA9IHFbMF1cbiAgdmFyIHkgPSBxWzFdXG4gIHZhciB6ID0gcVsyXVxuICB2YXIgdyA9IHFbM11cblxuICB2YXIgeDIgPSB4ICsgeFxuICB2YXIgeTIgPSB5ICsgeVxuICB2YXIgejIgPSB6ICsgelxuXG4gIHZhciB4eCA9IHggKiB4MlxuICB2YXIgeXggPSB5ICogeDJcbiAgdmFyIHl5ID0geSAqIHkyXG4gIHZhciB6eCA9IHogKiB4MlxuICB2YXIgenkgPSB6ICogeTJcbiAgdmFyIHp6ID0geiAqIHoyXG4gIHZhciB3eCA9IHcgKiB4MlxuICB2YXIgd3kgPSB3ICogeTJcbiAgdmFyIHd6ID0gdyAqIHoyXG5cbiAgb3V0WzBdID0gMSAtIHl5IC0genpcbiAgb3V0WzNdID0geXggLSB3elxuICBvdXRbNl0gPSB6eCArIHd5XG5cbiAgb3V0WzFdID0geXggKyB3elxuICBvdXRbNF0gPSAxIC0geHggLSB6elxuICBvdXRbN10gPSB6eSAtIHd4XG5cbiAgb3V0WzJdID0genggLSB3eVxuICBvdXRbNV0gPSB6eSArIHd4XG4gIG91dFs4XSA9IDEgLSB4eCAtIHl5XG5cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpZGVudGl0eVxuXG4vKipcbiAqIFNldCBhIG1hdDMgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBhbGlhcyBtYXQzLmlkZW50aXR5XG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiBpZGVudGl0eShvdXQpIHtcbiAgb3V0WzBdID0gMVxuICBvdXRbMV0gPSAwXG4gIG91dFsyXSA9IDBcbiAgb3V0WzNdID0gMFxuICBvdXRbNF0gPSAxXG4gIG91dFs1XSA9IDBcbiAgb3V0WzZdID0gMFxuICBvdXRbN10gPSAwXG4gIG91dFs4XSA9IDFcbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkam9pbnQ6IHJlcXVpcmUoJy4vYWRqb2ludCcpXG4gICwgY2xvbmU6IHJlcXVpcmUoJy4vY2xvbmUnKVxuICAsIGNvcHk6IHJlcXVpcmUoJy4vY29weScpXG4gICwgY3JlYXRlOiByZXF1aXJlKCcuL2NyZWF0ZScpXG4gICwgZGV0ZXJtaW5hbnQ6IHJlcXVpcmUoJy4vZGV0ZXJtaW5hbnQnKVxuICAsIGZyb2I6IHJlcXVpcmUoJy4vZnJvYicpXG4gICwgZnJvbU1hdDI6IHJlcXVpcmUoJy4vZnJvbS1tYXQyJylcbiAgLCBmcm9tTWF0NDogcmVxdWlyZSgnLi9mcm9tLW1hdDQnKVxuICAsIGZyb21RdWF0OiByZXF1aXJlKCcuL2Zyb20tcXVhdCcpXG4gICwgaWRlbnRpdHk6IHJlcXVpcmUoJy4vaWRlbnRpdHknKVxuICAsIGludmVydDogcmVxdWlyZSgnLi9pbnZlcnQnKVxuICAsIG11bHRpcGx5OiByZXF1aXJlKCcuL211bHRpcGx5JylcbiAgLCBub3JtYWxGcm9tTWF0NDogcmVxdWlyZSgnLi9ub3JtYWwtZnJvbS1tYXQ0JylcbiAgLCByb3RhdGU6IHJlcXVpcmUoJy4vcm90YXRlJylcbiAgLCBzY2FsZTogcmVxdWlyZSgnLi9zY2FsZScpXG4gICwgc3RyOiByZXF1aXJlKCcuL3N0cicpXG4gICwgdHJhbnNsYXRlOiByZXF1aXJlKCcuL3RyYW5zbGF0ZScpXG4gICwgdHJhbnNwb3NlOiByZXF1aXJlKCcuL3RyYW5zcG9zZScpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGludmVydFxuXG4vKipcbiAqIEludmVydHMgYSBtYXQzXG4gKlxuICogQGFsaWFzIG1hdDMuaW52ZXJ0XG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbmZ1bmN0aW9uIGludmVydChvdXQsIGEpIHtcbiAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl1cbiAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV1cbiAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF1cblxuICB2YXIgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxXG4gIHZhciBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwXG4gIHZhciBiMjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjBcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gIHZhciBkZXQgPSBhMDAgKiBiMDEgKyBhMDEgKiBiMTEgKyBhMDIgKiBiMjFcblxuICBpZiAoIWRldCkgcmV0dXJuIG51bGxcbiAgZGV0ID0gMS4wIC8gZGV0XG5cbiAgb3V0WzBdID0gYjAxICogZGV0XG4gIG91dFsxXSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldFxuICBvdXRbMl0gPSAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldFxuICBvdXRbM10gPSBiMTEgKiBkZXRcbiAgb3V0WzRdID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXRcbiAgb3V0WzVdID0gKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0XG4gIG91dFs2XSA9IGIyMSAqIGRldFxuICBvdXRbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXRcbiAgb3V0WzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXRcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG11bHRpcGx5XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0MydzXG4gKlxuICogQGFsaWFzIG1hdDMubXVsdGlwbHlcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xuZnVuY3Rpb24gbXVsdGlwbHkob3V0LCBhLCBiKSB7XG4gIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdXG4gIHZhciBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdXG4gIHZhciBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdXG5cbiAgdmFyIGIwMCA9IGJbMF0sIGIwMSA9IGJbMV0sIGIwMiA9IGJbMl1cbiAgdmFyIGIxMCA9IGJbM10sIGIxMSA9IGJbNF0sIGIxMiA9IGJbNV1cbiAgdmFyIGIyMCA9IGJbNl0sIGIyMSA9IGJbN10sIGIyMiA9IGJbOF1cblxuICBvdXRbMF0gPSBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjBcbiAgb3V0WzFdID0gYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxXG4gIG91dFsyXSA9IGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMlxuXG4gIG91dFszXSA9IGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMFxuICBvdXRbNF0gPSBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjFcbiAgb3V0WzVdID0gYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyXG5cbiAgb3V0WzZdID0gYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwXG4gIG91dFs3XSA9IGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMVxuICBvdXRbOF0gPSBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjJcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vcm1hbEZyb21NYXQ0XG5cbi8qKlxuKiBDYWxjdWxhdGVzIGEgM3gzIG5vcm1hbCBtYXRyaXggKHRyYW5zcG9zZSBpbnZlcnNlKSBmcm9tIHRoZSA0eDQgbWF0cml4XG4qXG4qIEBhbGlhcyBtYXQzLm5vcm1hbEZyb21NYXQ0XG4qIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiogQHBhcmFtIHttYXQ0fSBhIE1hdDQgdG8gZGVyaXZlIHRoZSBub3JtYWwgbWF0cml4IGZyb21cbipcbiogQHJldHVybnMge21hdDN9IG91dFxuKi9cbmZ1bmN0aW9uIG5vcm1hbEZyb21NYXQ0KG91dCwgYSkge1xuICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXVxuICB2YXIgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XVxuICB2YXIgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdXG4gIHZhciBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XVxuXG4gIHZhciBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTBcbiAgdmFyIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMFxuICB2YXIgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwXG4gIHZhciBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTFcbiAgdmFyIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMVxuICB2YXIgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyXG4gIHZhciBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzBcbiAgdmFyIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMFxuICB2YXIgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwXG4gIHZhciBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzFcbiAgdmFyIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMVxuICB2YXIgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyXG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICB2YXIgZGV0ID0gYjAwICogYjExXG4gICAgICAgICAgLSBiMDEgKiBiMTBcbiAgICAgICAgICArIGIwMiAqIGIwOVxuICAgICAgICAgICsgYjAzICogYjA4XG4gICAgICAgICAgLSBiMDQgKiBiMDdcbiAgICAgICAgICArIGIwNSAqIGIwNlxuXG4gIGlmICghZGV0KSByZXR1cm4gbnVsbFxuICBkZXQgPSAxLjAgLyBkZXRcblxuICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldFxuICBvdXRbMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldFxuICBvdXRbMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldFxuXG4gIG91dFszXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0XG4gIG91dFs0XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0XG4gIG91dFs1XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0XG5cbiAgb3V0WzZdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXRcbiAgb3V0WzddID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXRcbiAgb3V0WzhdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXRcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJvdGF0ZVxuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQzIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBhbGlhcyBtYXQzLnJvdGF0ZVxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xuZnVuY3Rpb24gcm90YXRlKG91dCwgYSwgcmFkKSB7XG4gIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdXG4gIHZhciBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdXG4gIHZhciBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdXG5cbiAgdmFyIHMgPSBNYXRoLnNpbihyYWQpXG4gIHZhciBjID0gTWF0aC5jb3MocmFkKVxuXG4gIG91dFswXSA9IGMgKiBhMDAgKyBzICogYTEwXG4gIG91dFsxXSA9IGMgKiBhMDEgKyBzICogYTExXG4gIG91dFsyXSA9IGMgKiBhMDIgKyBzICogYTEyXG5cbiAgb3V0WzNdID0gYyAqIGExMCAtIHMgKiBhMDBcbiAgb3V0WzRdID0gYyAqIGExMSAtIHMgKiBhMDFcbiAgb3V0WzVdID0gYyAqIGExMiAtIHMgKiBhMDJcblxuICBvdXRbNl0gPSBhMjBcbiAgb3V0WzddID0gYTIxXG4gIG91dFs4XSA9IGEyMlxuXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gc2NhbGVcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDMgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAYWxpYXMgbWF0My5zY2FsZVxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbmZ1bmN0aW9uIHNjYWxlKG91dCwgYSwgdikge1xuICB2YXIgeCA9IHZbMF1cbiAgdmFyIHkgPSB2WzFdXG5cbiAgb3V0WzBdID0geCAqIGFbMF1cbiAgb3V0WzFdID0geCAqIGFbMV1cbiAgb3V0WzJdID0geCAqIGFbMl1cblxuICBvdXRbM10gPSB5ICogYVszXVxuICBvdXRbNF0gPSB5ICogYVs0XVxuICBvdXRbNV0gPSB5ICogYVs1XVxuXG4gIG91dFs2XSA9IGFbNl1cbiAgb3V0WzddID0gYVs3XVxuICBvdXRbOF0gPSBhWzhdXG5cbiAgcmV0dXJuIG91dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0M1xuICpcbiAqIEBhbGlhcyBtYXQzLnN0clxuICogQHBhcmFtIHttYXQzfSBtYXQgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xuZnVuY3Rpb24gc3RyKGEpIHtcbiAgcmV0dXJuICdtYXQzKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgK1xuICAgICAgICAgICAgICAgICAgIGFbM10gKyAnLCAnICsgYVs0XSArICcsICcgKyBhWzVdICsgJywgJyArXG4gICAgICAgICAgICAgICAgICAgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArIGFbOF0gKyAnKSdcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gdHJhbnNsYXRlXG5cbi8qKlxuICogVHJhbnNsYXRlIGEgbWF0MyBieSB0aGUgZ2l2ZW4gdmVjdG9yXG4gKlxuICogQGFsaWFzIG1hdDMudHJhbnNsYXRlXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdmVjdG9yIHRvIHRyYW5zbGF0ZSBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiB0cmFuc2xhdGUob3V0LCBhLCB2KSB7XG4gIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdXG4gIHZhciBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdXG4gIHZhciBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdXG4gIHZhciB4ID0gdlswXSwgeSA9IHZbMV1cblxuICBvdXRbMF0gPSBhMDBcbiAgb3V0WzFdID0gYTAxXG4gIG91dFsyXSA9IGEwMlxuXG4gIG91dFszXSA9IGExMFxuICBvdXRbNF0gPSBhMTFcbiAgb3V0WzVdID0gYTEyXG5cbiAgb3V0WzZdID0geCAqIGEwMCArIHkgKiBhMTAgKyBhMjBcbiAgb3V0WzddID0geCAqIGEwMSArIHkgKiBhMTEgKyBhMjFcbiAgb3V0WzhdID0geCAqIGEwMiArIHkgKiBhMTIgKyBhMjJcblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRyYW5zcG9zZVxuXG4vKipcbiAqIFRyYW5zcG9zZSB0aGUgdmFsdWVzIG9mIGEgbWF0M1xuICpcbiAqIEBhbGlhcyBtYXQzLnRyYW5zcG9zZVxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5mdW5jdGlvbiB0cmFuc3Bvc2Uob3V0LCBhKSB7XG4gIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcbiAgaWYgKG91dCA9PT0gYSkge1xuICAgIHZhciBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMTIgPSBhWzVdXG4gICAgb3V0WzFdID0gYVszXVxuICAgIG91dFsyXSA9IGFbNl1cbiAgICBvdXRbM10gPSBhMDFcbiAgICBvdXRbNV0gPSBhWzddXG4gICAgb3V0WzZdID0gYTAyXG4gICAgb3V0WzddID0gYTEyXG4gIH0gZWxzZSB7XG4gICAgb3V0WzBdID0gYVswXVxuICAgIG91dFsxXSA9IGFbM11cbiAgICBvdXRbMl0gPSBhWzZdXG4gICAgb3V0WzNdID0gYVsxXVxuICAgIG91dFs0XSA9IGFbNF1cbiAgICBvdXRbNV0gPSBhWzddXG4gICAgb3V0WzZdID0gYVsyXVxuICAgIG91dFs3XSA9IGFbNV1cbiAgICBvdXRbOF0gPSBhWzhdXG4gIH1cblxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEFBQkIgKHcsIGgsIHgsIHkpIHtcbiAgdGhpcy54ID0geFxuICB0aGlzLnkgPSB5XG4gIHRoaXMudyA9IHdcbiAgdGhpcy5oID0gaFxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVseFwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geCB9IFxuICB9KVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1bHlcIiwge1xuICAgIGdldCgpIHsgcmV0dXJuIHkgfSBcbiAgfSlcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibHJ4XCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB4ICsgdyB9XG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxyeVwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4geSArIGggfVxuICB9KVxufVxuIiwibGV0IEFBQkIgPSByZXF1aXJlKFwiLi9BQUJCXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uXG5cbmZ1bmN0aW9uIEZyYW1lIChhYWJiLCBkdXJhdGlvbikge1xuICB0aGlzLmFhYmIgICAgID0gYWFiYlxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbn1cblxuLy9yYXRlIGlzIGluIG1zLiAgVGhpcyBpcyB0aGUgdGltZSBwZXIgZnJhbWUgKDQyIH4gMjRmcHMpXG5mdW5jdGlvbiBBbmltYXRpb24gKGZyYW1lcywgZG9lc0xvb3AsIHJhdGU9NDIpIHtcbiAgdGhpcy5sb29wICAgPSBkb2VzTG9vcFxuICB0aGlzLnJhdGUgICA9IHJhdGVcbiAgdGhpcy5mcmFtZXMgPSBmcmFtZXNcbn1cblxuQW5pbWF0aW9uLmNyZWF0ZUxpbmVhciA9IGZ1bmN0aW9uICh3LCBoLCB4LCB5LCBjb3VudCwgZG9lc0xvb3AsIHJhdGU9NDIpIHtcbiAgbGV0IGZyYW1lcyA9IFtdXG4gIGxldCBpICAgICAgPSAtMVxuICBsZXQgZWFjaFhcbiAgbGV0IGFhYmJcblxuICB3aGlsZSAoKytpIDwgY291bnQpIHtcbiAgICBlYWNoWCA9IHggKyBpICogd1xuICAgIGFhYmIgID0gbmV3IEFBQkIodywgaCwgZWFjaFgsIHkpXG4gICAgZnJhbWVzLnB1c2gobmV3IEZyYW1lKGFhYmIsIHJhdGUpKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBBbmltYXRpb24oZnJhbWVzLCBkb2VzTG9vcCwgcmF0ZSlcbn1cblxuQW5pbWF0aW9uLmNyZWF0ZVNpbmdsZSA9IGZ1bmN0aW9uICh3LCBoLCB4LCB5LCByYXRlPTQzKSB7XG4gIGxldCBhYWJiICAgPSBuZXcgQUFCQih3LCBoLCB4LCB5KVxuICBsZXQgZnJhbWVzID0gW25ldyBGcmFtZShhYWJiLCByYXRlKV1cblxuICByZXR1cm4gbmV3IEFuaW1hdGlvbihmcmFtZXMsIHRydWUsIHJhdGUpXG59XG4iLCJmdW5jdGlvbiBDaGFubmVsIChjb250ZXh0LCBuYW1lKSB7XG4gIGxldCBjaGFubmVsID0gY29udGV4dC5jcmVhdGVHYWluKClcbiAgXG4gIGxldCBjb25uZWN0UGFubmVyID0gZnVuY3Rpb24gKHNyYywgcGFubmVyLCBjaGFuKSB7XG4gICAgc3JjLmNvbm5lY3QocGFubmVyKVxuICAgIHBhbm5lci5jb25uZWN0KGNoYW4pIFxuICB9XG5cbiAgbGV0IGJhc2VQbGF5ID0gZnVuY3Rpb24gKG9wdGlvbnM9e30pIHtcbiAgICBsZXQgc2hvdWxkTG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChidWZmZXIsIHBhbm5lcikge1xuICAgICAgbGV0IHNyYyA9IGNoYW5uZWwuY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSBcblxuICAgICAgaWYgKHBhbm5lcikgY29ubmVjdFBhbm5lcihzcmMsIHBhbm5lciwgY2hhbm5lbClcbiAgICAgIGVsc2UgICAgICAgIHNyYy5jb25uZWN0KGNoYW5uZWwpXG5cbiAgICAgIHNyYy5sb29wICAgPSBzaG91bGRMb29wXG4gICAgICBzcmMuYnVmZmVyID0gYnVmZmVyXG4gICAgICBzcmMuc3RhcnQoMClcbiAgICAgIHJldHVybiBzcmNcbiAgICB9IFxuICB9XG5cbiAgY2hhbm5lbC5jb25uZWN0KGNvbnRleHQuZGVzdGluYXRpb24pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidm9sdW1lXCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHsgcmV0dXJuIGNoYW5uZWwuZ2Fpbi52YWx1ZSB9LFxuICAgIHNldCh2YWx1ZSkgeyBjaGFubmVsLmdhaW4udmFsdWUgPSB2YWx1ZSB9XG4gIH0pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2FpblwiLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7IHJldHVybiBjaGFubmVsIH1cbiAgfSlcblxuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMubG9vcCA9IGJhc2VQbGF5KHtsb29wOiB0cnVlfSlcbiAgdGhpcy5wbGF5ID0gYmFzZVBsYXkoKVxufVxuXG5mdW5jdGlvbiBBdWRpb1N5c3RlbSAoY2hhbm5lbE5hbWVzKSB7XG4gIGxldCBjb250ZXh0ICA9IG5ldyBBdWRpb0NvbnRleHRcbiAgbGV0IGNoYW5uZWxzID0ge31cbiAgbGV0IGkgICAgICAgID0gLTFcblxuICB3aGlsZSAoY2hhbm5lbE5hbWVzWysraV0pIHtcbiAgICBjaGFubmVsc1tjaGFubmVsTmFtZXNbaV1dID0gbmV3IENoYW5uZWwoY29udGV4dCwgY2hhbm5lbE5hbWVzW2ldKVxuICB9XG4gIHRoaXMuY29udGV4dCAgPSBjb250ZXh0IFxuICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb1N5c3RlbVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYWNoZSAoa2V5TmFtZXMpIHtcbiAgaWYgKCFrZXlOYW1lcykgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIHNvbWUga2V5TmFtZXNcIilcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlOYW1lcy5sZW5ndGg7ICsraSkgdGhpc1trZXlOYW1lc1tpXV0gPSB7fVxufVxuIiwibGV0IHt0cmFuc3Bvc2UsIHRyYW5zbGF0ZSwgY3JlYXRlfSA9IHJlcXVpcmUoXCJnbC1tYXQzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhXG5cbmZ1bmN0aW9uIENhbWVyYSAodywgaCwgeCwgeSkge1xuICBsZXQgbWF0ID0gY3JlYXRlKClcblxuICB0aGlzLnggICAgICAgID0geFxuICB0aGlzLnkgICAgICAgID0geVxuICB0aGlzLncgICAgICAgID0gd1xuICB0aGlzLmggICAgICAgID0gaFxuICB0aGlzLnJvdGF0aW9uID0gMFxuICB0aGlzLnNjYWxlICAgID0gMVxuXG4gIC8vVE9ETzogU3RhcnQgd2l0aCBvbmx5IHRyYW5zbGF0aW9uIVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtYXRyaXhcIiwge1xuICAgIGdldCgpIHtcbiAgICAgIG1hdFs2XSA9IC10aGlzLnhcbiAgICAgIG1hdFs3XSA9IC10aGlzLnlcbiAgICAgIHJldHVybiBtYXRcbiAgICB9XG4gIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENsb2NrXG5cbmZ1bmN0aW9uIENsb2NrICh0aW1lRm49RGF0ZS5ub3cpIHtcbiAgdGhpcy5vbGRUaW1lID0gdGltZUZuKClcbiAgdGhpcy5uZXdUaW1lID0gdGltZUZuKClcbiAgdGhpcy5kVCA9IDBcbiAgdGhpcy50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub2xkVGltZSA9IHRoaXMubmV3VGltZVxuICAgIHRoaXMubmV3VGltZSA9IHRpbWVGbigpICBcbiAgICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbiAgfVxufVxuIiwiLy90aGlzIGRvZXMgbGl0ZXJhbGx5IG5vdGhpbmcuICBpdCdzIGEgc2hlbGwgdGhhdCBob2xkcyBjb21wb25lbnRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVudGl0eSAoKSB7fVxuIiwibGV0IHtoYXNLZXlzfSA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eVN0b3JlXG5cbmZ1bmN0aW9uIEVudGl0eVN0b3JlIChtYXg9MTAwMCkge1xuICB0aGlzLmVudGl0aWVzICA9IFtdXG4gIHRoaXMubGFzdFF1ZXJ5ID0gW11cbn1cblxuRW50aXR5U3RvcmUucHJvdG90eXBlLmFkZEVudGl0eSA9IGZ1bmN0aW9uIChlKSB7XG4gIGxldCBpZCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgdGhpcy5lbnRpdGllcy5wdXNoKGUpXG4gIHJldHVybiBpZFxufVxuXG5FbnRpdHlTdG9yZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbiAoY29tcG9uZW50TmFtZXMpIHtcbiAgbGV0IGkgPSAtMVxuICBsZXQgZW50aXR5XG5cbiAgdGhpcy5sYXN0UXVlcnkgPSBbXVxuXG4gIHdoaWxlICh0aGlzLmVudGl0aWVzWysraV0pIHtcbiAgICBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgaWYgKGhhc0tleXMoY29tcG9uZW50TmFtZXMsIGVudGl0eSkpIHRoaXMubGFzdFF1ZXJ5LnB1c2goZW50aXR5KVxuICB9XG4gIHJldHVybiB0aGlzLmxhc3RRdWVyeVxufVxuIiwibGV0IHtzcHJpdGVWZXJ0ZXhTaGFkZXIsIHNwcml0ZUZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcbmxldCB7cG9seWdvblZlcnRleFNoYWRlciwgcG9seWdvbkZyYWdtZW50U2hhZGVyfSA9IHJlcXVpcmUoXCIuL2dsLXNoYWRlcnNcIilcbmxldCB7c2V0Qm94fSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5sZXQge1NoYWRlciwgUHJvZ3JhbSwgVGV4dHVyZX0gPSByZXF1aXJlKFwiLi9nbC10eXBlc1wiKVxubGV0IHt1cGRhdGVCdWZmZXJ9ID0gcmVxdWlyZShcIi4vZ2wtYnVmZmVyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR0xSZW5kZXJlclxuXG5jb25zdCBQT0lOVF9ESU1FTlNJT04gICAgID0gMlxuY29uc3QgQ09MT1JfQ0hBTk5FTF9DT1VOVCA9IDRcbmNvbnN0IFBPSU5UU19QRVJfQk9YICAgICAgPSA2XG5jb25zdCBCT1hfTEVOR1RIICAgICAgICAgID0gUE9JTlRfRElNRU5TSU9OICogUE9JTlRTX1BFUl9CT1hcbmNvbnN0IE1BWF9WRVJURVhfQ09VTlQgICAgPSAxMDAwMFxuXG5mdW5jdGlvbiBCb3hBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBDZW50ZXJBcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBCT1hfTEVOR1RIKVxufVxuXG5mdW5jdGlvbiBTY2FsZUFycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSClcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIGFyW2ldID0gMVxuICByZXR1cm4gYXJcbn1cblxuZnVuY3Rpb24gUm90YXRpb25BcnJheSAoY291bnQpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiBQT0lOVFNfUEVSX0JPWClcbn1cblxuLy90ZXh0dXJlIGNvb3JkcyBhcmUgaW5pdGlhbGl6ZWQgdG8gMCAtPiAxIHRleHR1cmUgY29vcmQgc3BhY2VcbmZ1bmN0aW9uIFRleHR1cmVDb29yZGluYXRlc0FycmF5IChjb3VudCkge1xuICBsZXQgYXIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogQk9YX0xFTkdUSCkgIFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhci5sZW5ndGg7IGkgPCBsZW47IGkgKz0gQk9YX0xFTkdUSCkge1xuICAgIHNldEJveChhciwgaSwgMSwgMSwgMCwgMClcbiAgfSBcbiAgcmV0dXJuIGFyXG59XG5cbmZ1bmN0aW9uIEluZGV4QXJyYXkgKHNpemUpIHtcbiAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShzaXplKVxufVxuXG5mdW5jdGlvbiBWZXJ0ZXhBcnJheSAoc2l6ZSkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShzaXplICogUE9JTlRfRElNRU5TSU9OKVxufVxuXG4vLzQgZm9yIHIsIGcsIGIsIGFcbmZ1bmN0aW9uIFZlcnRleENvbG9yQXJyYXkgKHNpemUpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSAqIDQpXG59XG5cbmZ1bmN0aW9uIFNwcml0ZUJhdGNoIChzaXplKSB7XG4gIHRoaXMuY291bnQgICAgICA9IDBcbiAgdGhpcy5ib3hlcyAgICAgID0gQm94QXJyYXkoc2l6ZSlcbiAgdGhpcy5jZW50ZXJzICAgID0gQ2VudGVyQXJyYXkoc2l6ZSlcbiAgdGhpcy5zY2FsZXMgICAgID0gU2NhbGVBcnJheShzaXplKVxuICB0aGlzLnJvdGF0aW9ucyAgPSBSb3RhdGlvbkFycmF5KHNpemUpXG4gIHRoaXMudGV4Q29vcmRzICA9IFRleHR1cmVDb29yZGluYXRlc0FycmF5KHNpemUpXG59XG5cbmZ1bmN0aW9uIFBvbHlnb25CYXRjaCAoc2l6ZSkge1xuICB0aGlzLmluZGV4ICAgICAgICA9IDBcbiAgdGhpcy5pbmRpY2VzICAgICAgPSBJbmRleEFycmF5KHNpemUpXG4gIHRoaXMudmVydGljZXMgICAgID0gVmVydGV4QXJyYXkoc2l6ZSlcbiAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSBWZXJ0ZXhDb2xvckFycmF5KHNpemUpXG59XG5cbmZ1bmN0aW9uIEdMUmVuZGVyZXIgKGNhbnZhcywgd2lkdGgsIGhlaWdodCkge1xuICBsZXQgbWF4U3ByaXRlQ291bnQgPSAxMDBcbiAgbGV0IHZpZXcgICAgICAgICAgID0gY2FudmFzXG4gIGxldCBnbCAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIikgICAgICBcbiAgbGV0IHN2cyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCBzcHJpdGVWZXJ0ZXhTaGFkZXIpXG4gIGxldCBzZnMgICAgICAgICAgICA9IFNoYWRlcihnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBzcHJpdGVGcmFnbWVudFNoYWRlcilcbiAgbGV0IHB2cyAgICAgICAgICAgID0gU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCBwb2x5Z29uVmVydGV4U2hhZGVyKVxuICBsZXQgcGZzICAgICAgICAgICAgPSBTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgcG9seWdvbkZyYWdtZW50U2hhZGVyKVxuICBsZXQgc3ByaXRlUHJvZ3JhbSAgPSBQcm9ncmFtKGdsLCBzdnMsIHNmcylcbiAgbGV0IHBvbHlnb25Qcm9ncmFtID0gUHJvZ3JhbShnbCwgcHZzLCBwZnMpXG5cbiAgLy9TcHJpdGUgc2hhZGVyIGJ1ZmZlcnNcbiAgbGV0IGJveEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IGNlbnRlckJ1ZmZlciAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHNjYWxlQnVmZmVyICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHJvdGF0aW9uQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcblxuICAvL3BvbHlnb24gc2hhZGVyIGJ1ZmZlcnNcbiAgbGV0IHZlcnRleEJ1ZmZlciAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IHZlcnRleENvbG9yQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgbGV0IGluZGV4QnVmZmVyICAgICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcblxuICAvL0dQVSBidWZmZXIgbG9jYXRpb25zXG4gIGxldCBib3hMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpXG4gIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJhX3RleENvb3JkXCIpXG4gIC8vbGV0IGNlbnRlckxvY2F0aW9uICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfY2VudGVyXCIpXG4gIC8vbGV0IHNjYWxlTG9jYXRpb24gICAgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfc2NhbGVcIilcbiAgLy9sZXQgcm90TG9jYXRpb24gICAgICA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9yb3RhdGlvblwiKVxuXG4gIGxldCB2ZXJ0ZXhMb2NhdGlvbiAgICAgID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwiYV92ZXJ0ZXhcIilcbiAgbGV0IHZlcnRleENvbG9yTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwb2x5Z29uUHJvZ3JhbSwgXCJhX3ZlcnRleENvbG9yXCIpXG5cbiAgLy93b3JsZCBzaXplIHVuaWZvcm1zXG4gIGxldCB3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiAgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc3ByaXRlUHJvZ3JhbSwgXCJ1X3dvcmxkU2l6ZVwiKVxuICBsZXQgd29ybGRTaXplUG9seWdvbkxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHBvbHlnb25Qcm9ncmFtLCBcInVfd29ybGRTaXplXCIpXG5cbiAgLy9jYW1lcmEgdW5pZm9ybXNcbiAgbGV0IGNhbWVyYVRyYW5zZm9ybVNwcml0ZUxvY2F0aW9uICA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzcHJpdGVQcm9ncmFtLCBcInVfY2FtZXJhVHJhbnNmb3JtXCIpXG4gIGxldCBjYW1lcmFUcmFuc2Zvcm1Qb2x5Z29uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocG9seWdvblByb2dyYW0sIFwidV9jYW1lcmFUcmFuc2Zvcm1cIilcblxuXG4gIGxldCBpbWFnZVRvVGV4dHVyZU1hcCA9IG5ldyBNYXAoKVxuICBsZXQgdGV4dHVyZVRvQmF0Y2hNYXAgPSBuZXcgTWFwKClcbiAgbGV0IHBvbHlnb25CYXRjaCAgICAgID0gbmV3IFBvbHlnb25CYXRjaChNQVhfVkVSVEVYX0NPVU5UKVxuXG4gIGdsLmVuYWJsZShnbC5CTEVORClcbiAgZ2wuZW5hYmxlKGdsLkNVTExfRkFDRSlcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSlcbiAgZ2wuY2xlYXJDb2xvcigxLjAsIDEuMCwgMS4wLCAwLjApXG4gIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKVxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuXG4gIHRoaXMuZGltZW5zaW9ucyA9IHtcbiAgICB3aWR0aDogIHdpZHRoIHx8IDE5MjAsIFxuICAgIGhlaWdodDogaGVpZ2h0IHx8IDEwODBcbiAgfVxuXG4gIHRoaXMuYWRkQmF0Y2ggPSAodGV4dHVyZSkgPT4ge1xuICAgIHRleHR1cmVUb0JhdGNoTWFwLnNldCh0ZXh0dXJlLCBuZXcgU3ByaXRlQmF0Y2gobWF4U3ByaXRlQ291bnQpKVxuICAgIHJldHVybiB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodGV4dHVyZSlcbiAgfVxuXG4gIHRoaXMuYWRkVGV4dHVyZSA9IChpbWFnZSkgPT4ge1xuICAgIGxldCB0ZXh0dXJlID0gVGV4dHVyZShnbClcblxuICAgIGltYWdlVG9UZXh0dXJlTWFwLnNldChpbWFnZSwgdGV4dHVyZSlcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpXG4gICAgcmV0dXJuIHRleHR1cmVcbiAgfVxuXG4gIHRoaXMucmVzaXplID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgICBsZXQgcmF0aW8gICAgICAgPSB0aGlzLmRpbWVuc2lvbnMud2lkdGggLyB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgbGV0IHRhcmdldFJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICBsZXQgdXNlV2lkdGggICAgPSByYXRpbyA+PSB0YXJnZXRSYXRpb1xuICAgIGxldCBuZXdXaWR0aCAgICA9IHVzZVdpZHRoID8gd2lkdGggOiAoaGVpZ2h0ICogcmF0aW8pIFxuICAgIGxldCBuZXdIZWlnaHQgICA9IHVzZVdpZHRoID8gKHdpZHRoIC8gcmF0aW8pIDogaGVpZ2h0XG5cbiAgICBjYW52YXMud2lkdGggID0gbmV3V2lkdGggXG4gICAgY2FudmFzLmhlaWdodCA9IG5ld0hlaWdodCBcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0KVxuICB9XG5cbiAgdGhpcy5hZGRTcHJpdGUgPSAoaW1hZ2UsIHcsIGgsIHgsIHksIHRleHcsIHRleGgsIHRleHgsIHRleHkpID0+IHtcbiAgICBsZXQgdHggICAgPSBpbWFnZVRvVGV4dHVyZU1hcC5nZXQoaW1hZ2UpIHx8IHRoaXMuYWRkVGV4dHVyZShpbWFnZSlcbiAgICBsZXQgYmF0Y2ggPSB0ZXh0dXJlVG9CYXRjaE1hcC5nZXQodHgpIHx8IHRoaXMuYWRkQmF0Y2godHgpXG5cbiAgICBzZXRCb3goYmF0Y2guYm94ZXMsIGJhdGNoLmNvdW50LCB3LCBoLCB4LCB5KVxuICAgIHNldEJveChiYXRjaC50ZXhDb29yZHMsIGJhdGNoLmNvdW50LCB0ZXh3LCB0ZXhoLCB0ZXh4LCB0ZXh5KVxuICAgIGJhdGNoLmNvdW50KytcbiAgfVxuXG4gIHRoaXMuYWRkUG9seWdvbiA9ICh2ZXJ0aWNlcywgaW5kaWNlcywgdmVydGV4Q29sb3JzKSA9PiB7XG4gICAgbGV0IHZlcnRleENvdW50ID0gaW5kaWNlcy5sZW5ndGhcblxuICAgIHBvbHlnb25CYXRjaC52ZXJ0aWNlcy5zZXQodmVydGljZXMsIHBvbHlnb25CYXRjaC5pbmRleClcbiAgICBwb2x5Z29uQmF0Y2guaW5kaWNlcy5zZXQoaW5kaWNlcywgcG9seWdvbkJhdGNoLmluZGV4KVxuICAgIHBvbHlnb25CYXRjaC52ZXJ0ZXhDb2xvcnMuc2V0KHZlcnRleENvbG9ycywgcG9seWdvbkJhdGNoLmluZGV4KVxuICAgIHBvbHlnb25CYXRjaC5pbmRleCArPSB2ZXJ0ZXhDb3VudFxuICB9XG5cbiAgbGV0IHJlc2V0UG9seWdvbnMgPSAoYmF0Y2gpID0+IGJhdGNoLmluZGV4ID0gMFxuXG4gIGxldCBkcmF3UG9seWdvbnMgPSAoYmF0Y2gpID0+IHtcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIFxuICAgICAgdmVydGV4QnVmZmVyLCBcbiAgICAgIHZlcnRleExvY2F0aW9uLCBcbiAgICAgIFBPSU5UX0RJTUVOU0lPTiwgXG4gICAgICBiYXRjaC52ZXJ0aWNlcylcbiAgICB1cGRhdGVCdWZmZXIoXG4gICAgICBnbCwgXG4gICAgICB2ZXJ0ZXhDb2xvckJ1ZmZlciwgXG4gICAgICB2ZXJ0ZXhDb2xvckxvY2F0aW9uLCBcbiAgICAgIENPTE9SX0NIQU5ORUxfQ09VTlQsIFxuICAgICAgYmF0Y2gudmVydGV4Q29sb3JzKVxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGV4QnVmZmVyKVxuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGJhdGNoLmluZGljZXMsIGdsLkRZTkFNSUNfRFJBVylcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBiYXRjaC5pbmRleCwgZ2wuVU5TSUdORURfU0hPUlQsIDApXG4gIH1cblxuICBsZXQgcmVzZXRCYXRjaCA9IChiYXRjaCkgPT4gYmF0Y2guY291bnQgPSAwXG5cbiAgbGV0IGRyYXdCYXRjaCA9IChiYXRjaCwgdGV4dHVyZSkgPT4ge1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCBib3hCdWZmZXIsIGJveExvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGJhdGNoLmJveGVzKVxuICAgIC8vdXBkYXRlQnVmZmVyKGdsLCBjZW50ZXJCdWZmZXIsIGNlbnRlckxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIGNlbnRlcnMpXG4gICAgLy91cGRhdGVCdWZmZXIoZ2wsIHNjYWxlQnVmZmVyLCBzY2FsZUxvY2F0aW9uLCBQT0lOVF9ESU1FTlNJT04sIHNjYWxlcylcbiAgICAvL3VwZGF0ZUJ1ZmZlcihnbCwgcm90YXRpb25CdWZmZXIsIHJvdExvY2F0aW9uLCAxLCByb3RhdGlvbnMpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCB0ZXhDb29yZEJ1ZmZlciwgdGV4Q29vcmRMb2NhdGlvbiwgUE9JTlRfRElNRU5TSU9OLCBiYXRjaC50ZXhDb29yZHMpXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIGJhdGNoLmNvdW50ICogUE9JTlRTX1BFUl9CT1gpXG4gIH1cblxuICB0aGlzLmZsdXNoU3ByaXRlcyA9ICgpID0+IHRleHR1cmVUb0JhdGNoTWFwLmZvckVhY2gocmVzZXRCYXRjaClcblxuICB0aGlzLmZsdXNoUG9seWdvbnMgPSAoKSA9PiByZXNldFBvbHlnb25zKHBvbHlnb25CYXRjaClcblxuICB0aGlzLnJlbmRlciA9ICh3b3JsZFdpZHRoLCB3b3JsZEhlaWdodCwgY2FtZXJhVHJhbnNmb3JtKSA9PiB7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcblxuICAgIC8vU3ByaXRlc2hlZXQgYmF0Y2ggcmVuZGVyaW5nXG4gICAgZ2wudXNlUHJvZ3JhbShzcHJpdGVQcm9ncmFtKVxuICAgIGdsLnVuaWZvcm0yZih3b3JsZFNpemVTcHJpdGVMb2NhdGlvbiwgd29ybGRXaWR0aCwgd29ybGRIZWlnaHQpXG4gICAgZ2wudW5pZm9ybU1hdHJpeDNmdihjYW1lcmFUcmFuc2Zvcm1TcHJpdGVMb2NhdGlvbiwgZmFsc2UsIGNhbWVyYVRyYW5zZm9ybSlcbiAgICB0ZXh0dXJlVG9CYXRjaE1hcC5mb3JFYWNoKGRyYXdCYXRjaClcblxuICAgIC8vUG9sZ29uIHJlbmRlcmluZ1xuICAgIGdsLnVzZVByb2dyYW0ocG9seWdvblByb2dyYW0pXG4gICAgZ2wudW5pZm9ybTJmKHdvcmxkU2l6ZVBvbHlnb25Mb2NhdGlvbiwgd29ybGRXaWR0aCwgd29ybGRIZWlnaHQpXG4gICAgZ2wudW5pZm9ybU1hdHJpeDNmdihjYW1lcmFUcmFuc2Zvcm1Qb2x5Z29uTG9jYXRpb24sIGZhbHNlLCBjYW1lcmFUcmFuc2Zvcm0pXG4gICAgZHJhd1BvbHlnb25zKHBvbHlnb25CYXRjaClcbiAgfVxufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBJbnB1dE1hbmFnZXIgPSByZXF1aXJlKFwiLi9JbnB1dE1hbmFnZXJcIilcbmxldCBDbG9jayAgICAgICAgPSByZXF1aXJlKFwiLi9DbG9ja1wiKVxubGV0IExvYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL0xvYWRlclwiKVxubGV0IEdMUmVuZGVyZXIgICA9IHJlcXVpcmUoXCIuL0dMUmVuZGVyZXJcIilcbmxldCBBdWRpb1N5c3RlbSAgPSByZXF1aXJlKFwiLi9BdWRpb1N5c3RlbVwiKVxubGV0IENhY2hlICAgICAgICA9IHJlcXVpcmUoXCIuL0NhY2hlXCIpXG5sZXQgRW50aXR5U3RvcmUgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgU2NlbmVNYW5hZ2VyID0gcmVxdWlyZShcIi4vU2NlbmVNYW5hZ2VyXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZVxuXG4vLzo6IENsb2NrIC0+IENhY2hlIC0+IExvYWRlciAtPiBHTFJlbmRlcmVyIC0+IEF1ZGlvU3lzdGVtIC0+IEVudGl0eVN0b3JlIC0+IFNjZW5lTWFuYWdlclxuZnVuY3Rpb24gR2FtZSAoY2xvY2ssIGNhY2hlLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgcmVuZGVyZXIsIGF1ZGlvU3lzdGVtLCBcbiAgICAgICAgICAgICAgIGVudGl0eVN0b3JlLCBzY2VuZU1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGNsb2NrLCBDbG9jaylcbiAgY2hlY2tUeXBlKGNhY2hlLCBDYWNoZSlcbiAgY2hlY2tUeXBlKGlucHV0TWFuYWdlciwgSW5wdXRNYW5hZ2VyKVxuICBjaGVja1R5cGUobG9hZGVyLCBMb2FkZXIpXG4gIGNoZWNrVHlwZShyZW5kZXJlciwgR0xSZW5kZXJlcilcbiAgY2hlY2tUeXBlKGF1ZGlvU3lzdGVtLCBBdWRpb1N5c3RlbSlcbiAgY2hlY2tUeXBlKGVudGl0eVN0b3JlLCBFbnRpdHlTdG9yZSlcbiAgY2hlY2tUeXBlKHNjZW5lTWFuYWdlciwgU2NlbmVNYW5hZ2VyKVxuXG4gIHRoaXMuY2xvY2sgICAgICAgID0gY2xvY2tcbiAgdGhpcy5jYWNoZSAgICAgICAgPSBjYWNoZSBcbiAgdGhpcy5sb2FkZXIgICAgICAgPSBsb2FkZXJcbiAgdGhpcy5pbnB1dE1hbmFnZXIgPSBpbnB1dE1hbmFnZXJcbiAgdGhpcy5yZW5kZXJlciAgICAgPSByZW5kZXJlclxuICB0aGlzLmF1ZGlvU3lzdGVtICA9IGF1ZGlvU3lzdGVtXG4gIHRoaXMuZW50aXR5U3RvcmUgID0gZW50aXR5U3RvcmVcbiAgdGhpcy5zY2VuZU1hbmFnZXIgPSBzY2VuZU1hbmFnZXJcblxuICAvL0ludHJvZHVjZSBiaS1kaXJlY3Rpb25hbCByZWZlcmVuY2UgdG8gZ2FtZSBvYmplY3Qgb250byBlYWNoIHNjZW5lXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzLnNjZW5lTWFuYWdlci5zY2VuZXNbaV0uZ2FtZSA9IHRoaXNcbiAgfVxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXJ0U2NlbmUgPSB0aGlzLnNjZW5lTWFuYWdlci5hY3RpdmVTY2VuZVxuXG4gIGNvbnNvbGUubG9nKFwiY2FsbGluZyBzZXR1cCBmb3IgXCIgKyBzdGFydFNjZW5lLm5hbWUpXG4gIHN0YXJ0U2NlbmUuc2V0dXAoKGVycikgPT4gY29uc29sZS5sb2coXCJzZXR1cCBjb21wbGV0ZWRcIikpXG59XG5cbkdhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIC8vd2hhdCBkb2VzIHRoaXMgZXZlbiBtZWFuP1xufVxuIiwibGV0IHtjaGVja1R5cGV9ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmxldCBLZXlib2FyZE1hbmFnZXIgPSByZXF1aXJlKFwiLi9LZXlib2FyZE1hbmFnZXJcIilcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dE1hbmFnZXJcblxuLy9UT0RPOiBjb3VsZCB0YWtlIG1vdXNlTWFuYWdlciBhbmQgZ2FtZXBhZCBtYW5hZ2VyP1xuZnVuY3Rpb24gSW5wdXRNYW5hZ2VyIChrZXlib2FyZE1hbmFnZXIpIHtcbiAgY2hlY2tUeXBlKGtleWJvYXJkTWFuYWdlciwgS2V5Ym9hcmRNYW5hZ2VyKVxuICB0aGlzLmtleWJvYXJkTWFuYWdlciA9IGtleWJvYXJkTWFuYWdlciBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRNYW5hZ2VyXG5cbmNvbnN0IEtFWV9DT1VOVCA9IDI1NlxuXG5mdW5jdGlvbiBLZXlib2FyZE1hbmFnZXIgKGRvY3VtZW50KSB7XG4gIGxldCBpc0Rvd25zICAgICAgID0gbmV3IFVpbnQ4QXJyYXkoS0VZX0NPVU5UKVxuICBsZXQganVzdERvd25zICAgICA9IG5ldyBVaW50OEFycmF5KEtFWV9DT1VOVClcbiAgbGV0IGp1c3RVcHMgICAgICAgPSBuZXcgVWludDhBcnJheShLRVlfQ09VTlQpXG4gIGxldCBkb3duRHVyYXRpb25zID0gbmV3IFVpbnQzMkFycmF5KEtFWV9DT1VOVClcbiAgXG4gIGxldCBoYW5kbGVLZXlEb3duID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3REb3duc1trZXlDb2RlXSA9ICFpc0Rvd25zW2tleUNvZGVdXG4gICAgaXNEb3duc1trZXlDb2RlXSAgID0gdHJ1ZVxuICB9XG5cbiAgbGV0IGhhbmRsZUtleVVwID0gKHtrZXlDb2RlfSkgPT4ge1xuICAgIGp1c3RVcHNba2V5Q29kZV0gICA9IHRydWVcbiAgICBpc0Rvd25zW2tleUNvZGVdICAgPSBmYWxzZVxuICB9XG5cbiAgbGV0IGhhbmRsZUJsdXIgPSAoKSA9PiB7XG4gICAgbGV0IGkgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IEtFWV9DT1VOVCkge1xuICAgICAgaXNEb3duc1tpXSAgID0gMFxuICAgICAganVzdERvd25zW2ldID0gMFxuICAgICAganVzdFVwc1tpXSAgID0gMFxuICAgIH1cbiAgfVxuXG4gIHRoaXMuaXNEb3ducyAgICAgICA9IGlzRG93bnNcbiAgdGhpcy5qdXN0VXBzICAgICAgID0ganVzdFVwc1xuICB0aGlzLmp1c3REb3ducyAgICAgPSBqdXN0RG93bnNcbiAgdGhpcy5kb3duRHVyYXRpb25zID0gZG93bkR1cmF0aW9uc1xuXG4gIHRoaXMudGljayA9IChkVCkgPT4ge1xuICAgIGxldCBpID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBLRVlfQ09VTlQpIHtcbiAgICAgIGp1c3REb3duc1tpXSA9IGZhbHNlIFxuICAgICAganVzdFVwc1tpXSAgID0gZmFsc2VcbiAgICAgIGlmIChpc0Rvd25zW2ldKSBkb3duRHVyYXRpb25zW2ldICs9IGRUXG4gICAgICBlbHNlICAgICAgICAgICAgZG93bkR1cmF0aW9uc1tpXSA9IDBcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBoYW5kbGVLZXlEb3duKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgaGFuZGxlS2V5VXApXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGhhbmRsZUJsdXIpXG59XG4iLCJsZXQgU3lzdGVtID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW1cblxuZnVuY3Rpb24gS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJzcHJpdGVcIl0pXG59XG5cbktleWZyYW1lQW5pbWF0aW9uU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcbiAgbGV0IGkgICA9IC0xXG4gIGxldCBlbnRcbiAgbGV0IHRpbWVMZWZ0XG4gIGxldCBjdXJyZW50SW5kZXhcbiAgbGV0IGN1cnJlbnRBbmltXG4gIGxldCBjdXJyZW50RnJhbWVcbiAgbGV0IG5leHRGcmFtZVxuICBsZXQgb3ZlcnNob290XG4gIGxldCBzaG91bGRBZHZhbmNlXG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIGVudCAgICAgICAgICAgPSBlbnRpdGllc1tpXSBcbiAgICBjdXJyZW50SW5kZXggID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXhcbiAgICBjdXJyZW50QW5pbSAgID0gZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uXG4gICAgY3VycmVudEZyYW1lICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXhdXG4gICAgbmV4dEZyYW1lICAgICA9IGN1cnJlbnRBbmltLmZyYW1lc1tjdXJyZW50SW5kZXggKyAxXSB8fCBjdXJyZW50QW5pbS5mcmFtZXNbMF1cbiAgICB0aW1lTGVmdCAgICAgID0gZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZVxuICAgIG92ZXJzaG9vdCAgICAgPSB0aW1lTGVmdCAtIGRUICAgXG4gICAgc2hvdWxkQWR2YW5jZSA9IG92ZXJzaG9vdCA8PSAwXG4gICAgICBcbiAgICBpZiAoc2hvdWxkQWR2YW5jZSkge1xuICAgICAgZW50LnNwcml0ZS5jdXJyZW50QW5pbWF0aW9uSW5kZXggPSBjdXJyZW50QW5pbS5mcmFtZXMuaW5kZXhPZihuZXh0RnJhbWUpXG4gICAgICBlbnQuc3ByaXRlLnRpbWVUaWxsTmV4dEZyYW1lICAgICA9IG5leHRGcmFtZS5kdXJhdGlvbiArIG92ZXJzaG9vdCBcbiAgICB9IGVsc2Uge1xuICAgICAgZW50LnNwcml0ZS50aW1lVGlsbE5leHRGcmFtZSA9IG92ZXJzaG9vdCBcbiAgICB9XG4gIH1cbn1cbiIsImZ1bmN0aW9uIExvYWRlciAoKSB7XG4gIGxldCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHRcblxuICBsZXQgbG9hZFhIUiA9ICh0eXBlKSA9PiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgaWYgKCFwYXRoKSByZXR1cm4gY2IobmV3IEVycm9yKFwiTm8gcGF0aCBwcm92aWRlZFwiKSlcblxuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCBcblxuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHR5cGVcbiAgICAgIHhoci5vbmxvYWQgICAgICAgPSAoKSA9PiBjYihudWxsLCB4aHIucmVzcG9uc2UpXG4gICAgICB4aHIub25lcnJvciAgICAgID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gICAgICB4aHIuc2VuZChudWxsKVxuICAgIH0gXG4gIH1cblxuICBsZXQgbG9hZEJ1ZmZlciA9IGxvYWRYSFIoXCJhcnJheWJ1ZmZlclwiKVxuICBsZXQgbG9hZFN0cmluZyA9IGxvYWRYSFIoXCJzdHJpbmdcIilcblxuICB0aGlzLmxvYWRTaGFkZXIgPSBsb2FkU3RyaW5nXG5cbiAgdGhpcy5sb2FkVGV4dHVyZSA9IChwYXRoLCBjYikgPT4ge1xuICAgIGxldCBpICAgICAgID0gbmV3IEltYWdlXG4gICAgbGV0IG9ubG9hZCAgPSAoKSA9PiBjYihudWxsLCBpKVxuICAgIGxldCBvbmVycm9yID0gKCkgPT4gY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSlcbiAgICBcbiAgICBpLm9ubG9hZCAgPSBvbmxvYWRcbiAgICBpLm9uZXJyb3IgPSBvbmVycm9yXG4gICAgaS5zcmMgICAgID0gcGF0aFxuICB9XG5cbiAgdGhpcy5sb2FkU291bmQgPSAocGF0aCwgY2IpID0+IHtcbiAgICBsb2FkQnVmZmVyKHBhdGgsIChlcnIsIGJpbmFyeSkgPT4ge1xuICAgICAgbGV0IGRlY29kZVN1Y2Nlc3MgPSAoYnVmZmVyKSA9PiBjYihudWxsLCBidWZmZXIpICAgXG4gICAgICBsZXQgZGVjb2RlRmFpbHVyZSA9IGNiXG5cbiAgICAgIGF1ZGlvQ3R4LmRlY29kZUF1ZGlvRGF0YShiaW5hcnksIGRlY29kZVN1Y2Nlc3MsIGRlY29kZUZhaWx1cmUpXG4gICAgfSkgXG4gIH1cblxuICB0aGlzLmxvYWRBc3NldHMgPSAoe3NvdW5kcywgdGV4dHVyZXMsIHNoYWRlcnN9LCBjYikgPT4ge1xuICAgIGxldCBzb3VuZEtleXMgICAgPSBPYmplY3Qua2V5cyhzb3VuZHMgfHwge30pXG4gICAgbGV0IHRleHR1cmVLZXlzICA9IE9iamVjdC5rZXlzKHRleHR1cmVzIHx8IHt9KVxuICAgIGxldCBzaGFkZXJLZXlzICAgPSBPYmplY3Qua2V5cyhzaGFkZXJzIHx8IHt9KVxuICAgIGxldCBzb3VuZENvdW50ICAgPSBzb3VuZEtleXMubGVuZ3RoXG4gICAgbGV0IHRleHR1cmVDb3VudCA9IHRleHR1cmVLZXlzLmxlbmd0aFxuICAgIGxldCBzaGFkZXJDb3VudCAgPSBzaGFkZXJLZXlzLmxlbmd0aFxuICAgIGxldCBpICAgICAgICAgICAgPSAtMVxuICAgIGxldCBqICAgICAgICAgICAgPSAtMVxuICAgIGxldCBrICAgICAgICAgICAgPSAtMVxuICAgIGxldCBvdXQgICAgICAgICAgPSB7XG4gICAgICBzb3VuZHM6e30sIHRleHR1cmVzOiB7fSwgc2hhZGVyczoge30gXG4gICAgfVxuXG4gICAgbGV0IGNoZWNrRG9uZSA9ICgpID0+IHtcbiAgICAgIGlmIChzb3VuZENvdW50IDw9IDAgJiYgdGV4dHVyZUNvdW50IDw9IDAgJiYgc2hhZGVyQ291bnQgPD0gMCkgY2IobnVsbCwgb3V0KSBcbiAgICB9XG5cbiAgICBsZXQgcmVnaXN0ZXJTb3VuZCA9IChuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBzb3VuZENvdW50LS1cbiAgICAgIG91dC5zb3VuZHNbbmFtZV0gPSBkYXRhXG4gICAgICBjaGVja0RvbmUoKVxuICAgIH1cblxuICAgIGxldCByZWdpc3RlclRleHR1cmUgPSAobmFtZSwgZGF0YSkgPT4ge1xuICAgICAgdGV4dHVyZUNvdW50LS1cbiAgICAgIG91dC50ZXh0dXJlc1tuYW1lXSA9IGRhdGFcbiAgICAgIGNoZWNrRG9uZSgpXG4gICAgfVxuXG4gICAgbGV0IHJlZ2lzdGVyU2hhZGVyID0gKG5hbWUsIGRhdGEpID0+IHtcbiAgICAgIHNoYWRlckNvdW50LS1cbiAgICAgIG91dC5zaGFkZXJzW25hbWVdID0gZGF0YVxuICAgICAgY2hlY2tEb25lKClcbiAgICB9XG5cbiAgICB3aGlsZSAoc291bmRLZXlzWysraV0pIHtcbiAgICAgIGxldCBrZXkgPSBzb3VuZEtleXNbaV1cblxuICAgICAgdGhpcy5sb2FkU291bmQoc291bmRzW2tleV0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgcmVnaXN0ZXJTb3VuZChrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgICB3aGlsZSAodGV4dHVyZUtleXNbKytqXSkge1xuICAgICAgbGV0IGtleSA9IHRleHR1cmVLZXlzW2pdXG5cbiAgICAgIHRoaXMubG9hZFRleHR1cmUodGV4dHVyZXNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclRleHR1cmUoa2V5LCBkYXRhKVxuICAgICAgfSlcbiAgICB9XG4gICAgd2hpbGUgKHNoYWRlcktleXNbKytrXSkge1xuICAgICAgbGV0IGtleSA9IHNoYWRlcktleXNba11cblxuICAgICAgdGhpcy5sb2FkU2hhZGVyKHNoYWRlcnNba2V5XSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICByZWdpc3RlclNoYWRlcihrZXksIGRhdGEpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRlclxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZGRsZU1vdmVyU3lzdGVtXG5cbmZ1bmN0aW9uIFBhZGRsZU1vdmVyU3lzdGVtICgpIHtcbiAgU3lzdGVtLmNhbGwodGhpcywgW1wicGh5c2ljc1wiLCBcInBsYXllckNvbnRyb2xsZWRcIl0pXG59XG5cblBhZGRsZU1vdmVyU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7Y2xvY2ssIGlucHV0TWFuYWdlcn0gPSBzY2VuZS5nYW1lXG4gIGxldCB7a2V5Ym9hcmRNYW5hZ2VyfSA9IGlucHV0TWFuYWdlclxuICBsZXQgbW92ZVNwZWVkID0gMVxuICBsZXQgcGFkZGxlICAgID0gZW50aXRpZXNbMF1cblxuICAvL2NhbiBoYXBwZW4gZHVyaW5nIGxvYWRpbmcgZm9yIGV4YW1wbGVcbiAgaWYgKCFwYWRkbGUpIHJldHVyblxuXG4gIGlmIChrZXlib2FyZE1hbmFnZXIuaXNEb3duc1szN10pIHBhZGRsZS5waHlzaWNzLnggLT0gY2xvY2suZFQgKiBtb3ZlU3BlZWRcbiAgaWYgKGtleWJvYXJkTWFuYWdlci5pc0Rvd25zWzM5XSkgcGFkZGxlLnBoeXNpY3MueCArPSBjbG9jay5kVCAqIG1vdmVTcGVlZFxufVxuIiwibGV0IHt1cGRhdGVWZWxvY2l0eSwgdXBkYXRlUG9zaXRpb259ID0gcmVxdWlyZShcIi4vcGh5c2ljcy9uZXd0b25pb25cIilcbmxldCBTeXN0ZW0gPSByZXF1aXJlKFwiLi9TeXN0ZW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBQaHlzaWNzU3lzdGVtXG5cbmZ1bmN0aW9uIFBoeXNpY3NTeXN0ZW0gKCkge1xuICBTeXN0ZW0uY2FsbCh0aGlzLCBbXCJwaHlzaWNzXCJdKVxufVxuXG5QaHlzaWNzU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCBkVCAgPSBzY2VuZS5nYW1lLmNsb2NrLmRUXG4gIGxldCBsZW4gPSBlbnRpdGllcy5sZW5ndGhcbiAgbGV0IGkgICA9IC0xIFxuICBsZXQgZW50XG5cbiAgd2hpbGUgKCArKyBpIDwgbGVuICkge1xuICAgIGVudCA9IGVudGl0aWVzW2ldXG4gICAgdXBkYXRlVmVsb2NpdHkoZFQsIGVudC5waHlzaWNzKVxuICAgIHVwZGF0ZVBvc2l0aW9uKGRULCBlbnQucGh5c2ljcylcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQb2x5Z29uXG5cbmZ1bmN0aW9uIFBvbHlnb24gKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpIHtcbiAgdGhpcy52ZXJ0aWNlcyAgICAgPSB2ZXJ0aWNlc1xuICB0aGlzLmluZGljZXMgICAgICA9IGluZGljZXNcbiAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSB2ZXJ0ZXhDb2xvcnNcbn1cblxuIiwibGV0IFN5c3RlbSA9IHJlcXVpcmUoXCIuL1N5c3RlbVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlnb25SZW5kZXJpbmdTeXN0ZW1cblxuZnVuY3Rpb24gUG9seWdvblJlbmRlcmluZ1N5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJwb2x5Z29uXCJdKVxufVxuXG5Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIGxldCB7cmVuZGVyZXJ9ID0gc2NlbmUuZ2FtZVxuICBsZXQgbGVuID0gZW50aXRpZXMubGVuZ3RoXG4gIGxldCBpICAgPSAtMVxuICBsZXQgZW50XG5cbiAgcmVuZGVyZXIuZmx1c2hQb2x5Z29ucygpXG4gIFxuICB3aGlsZSAoKysgaSA8IGxlbikge1xuICAgIGVudCA9IGVudGl0aWVzW2ldIFxuICAgIC8vVE9ETzogdmVydGljZXMgc2hvdWxkIGJlIGluIGxvY2FsIGNvb3Jkcy4gIE5lZWQgdG8gdHJhbnNsYXRlIHRvIGdsb2JhbFxuICAgIHJlbmRlcmVyLmFkZFBvbHlnb24oZW50LnBvbHlnb24udmVydGljZXMsIGVudC5wb2x5Z29uLmluZGljZXMsIGVudC5wb2x5Z29uLnZlcnRleENvbG9ycylcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTY2VuZVxuXG5mdW5jdGlvbiBTY2VuZSAobmFtZSwgc3lzdGVtcykge1xuICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihcIlNjZW5lIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgbmFtZVwiKVxuXG4gIHRoaXMubmFtZSAgICA9IG5hbWVcbiAgdGhpcy5zeXN0ZW1zID0gc3lzdGVtc1xuICB0aGlzLmdhbWUgICAgPSBudWxsXG59XG5cblNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBjYihudWxsLCBudWxsKSAgXG59XG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoZFQpIHtcbiAgbGV0IHN0b3JlID0gdGhpcy5nYW1lLmVudGl0eVN0b3JlXG4gIGxldCBsZW4gICA9IHRoaXMuc3lzdGVtcy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IHN5c3RlbVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV0gXG4gICAgc3lzdGVtLnJ1bih0aGlzLCBzdG9yZS5xdWVyeShzeXN0ZW0uY29tcG9uZW50TmFtZXMpKVxuICB9XG59XG4iLCJsZXQge2ZpbmRXaGVyZX0gPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU1hbmFnZXJcblxuZnVuY3Rpb24gU2NlbmVNYW5hZ2VyIChzY2VuZXM9W10pIHtcbiAgaWYgKHNjZW5lcy5sZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIG9uZSBvciBtb3JlIHNjZW5lc1wiKVxuXG4gIGxldCBhY3RpdmVTY2VuZUluZGV4ID0gMFxuICBsZXQgc2NlbmVzICAgICAgICAgICA9IHNjZW5lc1xuXG4gIHRoaXMuc2NlbmVzICAgICAgPSBzY2VuZXNcbiAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4XVxuXG4gIHRoaXMudHJhbnNpdGlvblRvID0gZnVuY3Rpb24gKHNjZW5lTmFtZSkge1xuICAgIGxldCBzY2VuZSA9IGZpbmRXaGVyZShcIm5hbWVcIiwgc2NlbmVOYW1lLCBzY2VuZXMpXG5cbiAgICBpZiAoIXNjZW5lKSB0aHJvdyBuZXcgRXJyb3Ioc2NlbmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc2NlbmUgbmFtZVwiKVxuXG4gICAgYWN0aXZlU2NlbmVJbmRleCA9IHNjZW5lcy5pbmRleE9mKHNjZW5lKVxuICAgIHRoaXMuYWN0aXZlU2NlbmUgPSBzY2VuZVxuICB9XG5cbiAgdGhpcy5hZHZhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzY2VuZSA9IHNjZW5lc1thY3RpdmVTY2VuZUluZGV4ICsgMV1cblxuICAgIGlmICghc2NlbmUpIHRocm93IG5ldyBFcnJvcihcIk5vIG1vcmUgc2NlbmVzIVwiKVxuXG4gICAgdGhpcy5hY3RpdmVTY2VuZSA9IHNjZW5lc1srK2FjdGl2ZVNjZW5lSW5kZXhdXG4gIH1cbn1cbiIsImxldCBTeXN0ZW0gID0gcmVxdWlyZShcIi4vU3lzdGVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU3ByaXRlUmVuZGVyaW5nU3lzdGVtXG5cbmZ1bmN0aW9uIFNwcml0ZVJlbmRlcmluZ1N5c3RlbSAoKSB7XG4gIFN5c3RlbS5jYWxsKHRoaXMsIFtcInBoeXNpY3NcIiwgXCJzcHJpdGVcIl0pXG59XG5cblNwcml0ZVJlbmRlcmluZ1N5c3RlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNjZW5lLCBlbnRpdGllcykge1xuICBsZXQge3JlbmRlcmVyfSA9IHNjZW5lLmdhbWVcbiAgbGV0IGxlbiA9IGVudGl0aWVzLmxlbmd0aFxuICBsZXQgaSAgID0gLTFcbiAgbGV0IGVudFxuICBsZXQgZnJhbWVcblxuICByZW5kZXJlci5mbHVzaFNwcml0ZXMoKVxuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBlbnQgICA9IGVudGl0aWVzW2ldXG4gICAgZnJhbWUgPSBlbnQuc3ByaXRlLmN1cnJlbnRBbmltYXRpb24uZnJhbWVzW2VudC5zcHJpdGUuY3VycmVudEFuaW1hdGlvbkluZGV4XVxuXG4gICAgcmVuZGVyZXIuYWRkU3ByaXRlKFxuICAgICAgZW50LnNwcml0ZS5pbWFnZSxcbiAgICAgIGVudC5waHlzaWNzLndpZHRoLFxuICAgICAgZW50LnBoeXNpY3MuaGVpZ2h0LFxuICAgICAgZW50LnBoeXNpY3MueCxcbiAgICAgIGVudC5waHlzaWNzLnksXG4gICAgICBmcmFtZS5hYWJiLncgLyBlbnQuc3ByaXRlLmltYWdlLndpZHRoLFxuICAgICAgZnJhbWUuYWFiYi5oIC8gZW50LnNwcml0ZS5pbWFnZS5oZWlnaHQsXG4gICAgICBmcmFtZS5hYWJiLnggLyBlbnQuc3ByaXRlLmltYWdlLndpZHRoLFxuICAgICAgZnJhbWUuYWFiYi55IC8gZW50LnNwcml0ZS5pbWFnZS5oZWlnaHRcbiAgICApXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU3lzdGVtXG5cbmZ1bmN0aW9uIFN5c3RlbSAoY29tcG9uZW50TmFtZXM9W10pIHtcbiAgdGhpcy5jb21wb25lbnROYW1lcyA9IGNvbXBvbmVudE5hbWVzXG59XG5cbi8vc2NlbmUuZ2FtZS5jbG9ja1xuU3lzdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2NlbmUsIGVudGl0aWVzKSB7XG4gIC8vZG9lcyBzb21ldGhpbmcgdy8gdGhlIGxpc3Qgb2YgZW50aXRpZXMgcGFzc2VkIHRvIGl0XG59XG4iLCJsZXQge1BhZGRsZSwgQmxvY2ssIEZpZ2h0ZXIsIFdhdGVyfSA9IHJlcXVpcmUoXCIuL2Fzc2VtYmxhZ2VzXCIpXG5sZXQgUGFkZGxlTW92ZXJTeXN0ZW0gICAgICAgPSByZXF1aXJlKFwiLi9QYWRkbGVNb3ZlclN5c3RlbVwiKVxubGV0IFBoeXNpY3NTeXN0ZW0gICAgICAgICAgID0gcmVxdWlyZShcIi4vUGh5c2ljc1N5c3RlbVwiKVxubGV0IFNwcml0ZVJlbmRlcmluZ1N5c3RlbSAgID0gcmVxdWlyZShcIi4vU3ByaXRlUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgUG9seWdvblJlbmRlcmluZ1N5c3RlbSAgPSByZXF1aXJlKFwiLi9Qb2x5Z29uUmVuZGVyaW5nU3lzdGVtXCIpXG5sZXQgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0gPSByZXF1aXJlKFwiLi9LZXlmcmFtZUFuaW1hdGlvblN5c3RlbVwiKVxubGV0IFNjZW5lICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vU2NlbmVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0U2NlbmVcblxuZnVuY3Rpb24gVGVzdFNjZW5lICgpIHtcbiAgbGV0IHN5c3RlbXMgPSBbXG4gICAgbmV3IFBhZGRsZU1vdmVyU3lzdGVtLCBcbiAgICBuZXcgS2V5ZnJhbWVBbmltYXRpb25TeXN0ZW0sXG4gICAgbmV3IFBoeXNpY3NTeXN0ZW0sXG4gICAgbmV3IFBvbHlnb25SZW5kZXJpbmdTeXN0ZW0sXG4gICAgbmV3IFNwcml0ZVJlbmRlcmluZ1N5c3RlbSxcbiAgXVxuXG4gIFNjZW5lLmNhbGwodGhpcywgXCJ0ZXN0XCIsIHN5c3RlbXMpXG59XG5cblRlc3RTY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNjZW5lLnByb3RvdHlwZSlcblxuVGVzdFNjZW5lLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChjYikge1xuICBsZXQge2NhY2hlLCBsb2FkZXIsIGVudGl0eVN0b3JlLCBhdWRpb1N5c3RlbX0gPSB0aGlzLmdhbWUgXG4gIGxldCB7Ymd9ID0gYXVkaW9TeXN0ZW0uY2hhbm5lbHNcbiAgbGV0IGFzc2V0cyA9IHtcbiAgICAvL3NvdW5kczogeyBiZ011c2ljOiBcIi9wdWJsaWMvc291bmRzL2JnbTEubXAzXCIgfSxcbiAgICB0ZXh0dXJlczogeyBcbiAgICAgIHBhZGRsZTogIFwiL3B1YmxpYy9zcHJpdGVzaGVldHMvcGFkZGxlLnBuZ1wiLFxuICAgICAgYmxvY2tzOiAgXCIvcHVibGljL3Nwcml0ZXNoZWV0cy9ibG9ja3MucG5nXCIsXG4gICAgICBmaWdodGVyOiBcIi9wdWJsaWMvc3ByaXRlc2hlZXRzL3B1bmNoLnBuZ1wiXG4gICAgfVxuICB9XG5cbiAgbG9hZGVyLmxvYWRBc3NldHMoYXNzZXRzLCBmdW5jdGlvbiAoZXJyLCBsb2FkZWRBc3NldHMpIHtcbiAgICBsZXQge3RleHR1cmVzLCBzb3VuZHN9ID0gbG9hZGVkQXNzZXRzIFxuXG4gICAgY2FjaGUuc291bmRzICAgPSBzb3VuZHNcbiAgICBjYWNoZS50ZXh0dXJlcyA9IHRleHR1cmVzXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyArK2kpIHtcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxMDApKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxNDUpKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAxOTApKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAyMzUpKSBcbiAgICAgIGVudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgQmxvY2sodGV4dHVyZXMuYmxvY2tzLCA5MCwgNDUsIDYwICsgOTAgKiBpLCAyODApKSBcbiAgICB9XG5cbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFBhZGRsZSh0ZXh0dXJlcy5wYWRkbGUsIDExMiwgMjUsIDYwMCwgNjAwKSlcbiAgICAvL2VudGl0eVN0b3JlLmFkZEVudGl0eShuZXcgRmlnaHRlcih0ZXh0dXJlcy5maWdodGVyLCA3NiwgNTksIDUwMCwgNTAwKSlcbiAgICBlbnRpdHlTdG9yZS5hZGRFbnRpdHkobmV3IFdhdGVyKDE5MjAsIDI4MCwgMCwgODAwLCAxMDApKVxuICAgIC8vYmcudm9sdW1lID0gMFxuICAgIC8vYmcubG9vcChjYWNoZS5zb3VuZHMuYmdNdXNpYylcbiAgICBjYihudWxsKVxuICB9KVxufVxuIiwibGV0IFBvbHlnb24gPSByZXF1aXJlKFwiLi9Qb2x5Z29uXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gV2F0ZXJQb2x5Z29uXG5cbmNvbnN0IFBPSU5UU19QRVJfVkVSVEVYICAgPSAyXG5jb25zdCBDT0xPUl9DSEFOTkVMX0NPVU5UID0gNFxuY29uc3QgSU5ESUNFU19QRVJfUVVBRCAgICA9IDZcbmNvbnN0IFFVQURfVkVSVEVYX1NJWkUgICAgPSA4XG5cbmZ1bmN0aW9uIHNldFZlcnRleCAodmVydGljZXMsIGluZGV4LCB4LCB5KSB7XG4gIGxldCBpID0gaW5kZXggKiBQT0lOVFNfUEVSX1ZFUlRFWFxuXG4gIHZlcnRpY2VzW2ldICAgPSB4XG4gIHZlcnRpY2VzW2krMV0gPSB5XG59XG5cbmZ1bmN0aW9uIHNldENvbG9yIChjb2xvcnMsIGluZGV4LCBjb2xvcikge1xuICBsZXQgaSA9IGluZGV4ICogQ09MT1JfQ0hBTk5FTF9DT1VOVFxuXG4gIGNvbG9ycy5zZXQoY29sb3IsIGkpXG59XG5cbmZ1bmN0aW9uIFdhdGVyUG9seWdvbiAodywgaCwgeCwgeSwgc2xpY2VDb3VudCwgdG9wQ29sb3IsIGJvdHRvbUNvbG9yKSB7XG4gIGxldCB2ZXJ0ZXhDb3VudCAgPSAyICsgKHNsaWNlQ291bnQgKiAyKVxuICBsZXQgdmVydGljZXMgICAgID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIFBPSU5UU19QRVJfVkVSVEVYKVxuICBsZXQgdmVydGV4Q29sb3JzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIENPTE9SX0NIQU5ORUxfQ09VTlQpXG4gIGxldCBpbmRpY2VzICAgICAgPSBuZXcgVWludDE2QXJyYXkoSU5ESUNFU19QRVJfUVVBRCAqIHNsaWNlQ291bnQpXG4gIGxldCB1bml0V2lkdGggICAgPSB3IC8gc2xpY2VDb3VudFxuICBsZXQgaSAgICAgICAgICAgID0gLTFcbiAgbGV0IGogICAgICAgICAgICA9IC0xXG5cbiAgd2hpbGUgKCArK2kgPD0gc2xpY2VDb3VudCApIHtcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGksICh4ICsgdW5pdFdpZHRoICogaSksIHkpXG4gICAgc2V0Q29sb3IodmVydGV4Q29sb3JzLCBpLCB0b3BDb2xvcilcbiAgICBzZXRWZXJ0ZXgodmVydGljZXMsIGkgKyBzbGljZUNvdW50ICsgMSwgKHggKyB1bml0V2lkdGggKiBpKSwgeSArIGgpXG4gICAgc2V0Q29sb3IodmVydGV4Q29sb3JzLCBpICsgc2xpY2VDb3VudCArIDEsIGJvdHRvbUNvbG9yKVxuICB9XG5cbiAgd2hpbGUgKCArKyBqIDwgc2xpY2VDb3VudCApIHtcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRF0gICA9IGogKyAxXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMV0gPSBqXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrMl0gPSBqICsgMSArIHNsaWNlQ291bnRcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCszXSA9IGogKyAxXG4gICAgaW5kaWNlc1tqKklORElDRVNfUEVSX1FVQUQrNF0gPSBqICsgMSArIHNsaWNlQ291bnRcbiAgICBpbmRpY2VzW2oqSU5ESUNFU19QRVJfUVVBRCs1XSA9IGogKyAyICsgc2xpY2VDb3VudFxuICB9XG5cbiAgcmV0dXJuIG5ldyBQb2x5Z29uKHZlcnRpY2VzLCBpbmRpY2VzLCB2ZXJ0ZXhDb2xvcnMpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFdvcmxkXG5cbmZ1bmN0aW9uIFdvcmxkICh3aWR0aCwgaGVpZ2h0KSB7XG4gIHRoaXMud2lkdGggID0gd2lkdGhcbiAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcbn1cbiIsImxldCB7UGh5c2ljcywgUGxheWVyQ29udHJvbGxlZH0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQge1Nwcml0ZSwgUG9seWdvbn0gPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpXG5sZXQgQW5pbWF0aW9uICAgID0gcmVxdWlyZShcIi4vQW5pbWF0aW9uXCIpXG5sZXQgRW50aXR5ICAgICAgID0gcmVxdWlyZShcIi4vRW50aXR5XCIpXG5sZXQgV2F0ZXJQb2x5Z29uID0gcmVxdWlyZShcIi4vV2F0ZXJQb2x5Z29uXCIpXG5cbm1vZHVsZS5leHBvcnRzLlBhZGRsZSAgPSBQYWRkbGVcbm1vZHVsZS5leHBvcnRzLkJsb2NrICAgPSBCbG9ja1xubW9kdWxlLmV4cG9ydHMuRmlnaHRlciA9IEZpZ2h0ZXJcbm1vZHVsZS5leHBvcnRzLldhdGVyICAgPSBXYXRlclxuXG5mdW5jdGlvbiBQYWRkbGUgKGltYWdlLCB3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpXG4gIFBoeXNpY3ModGhpcywgdywgaCwgeCwgeSlcbiAgUGxheWVyQ29udHJvbGxlZCh0aGlzKVxuICBTcHJpdGUodGhpcywgdywgaCwgaW1hZ2UsIFwiaWRsZVwiLCB7XG4gICAgaWRsZTogQW5pbWF0aW9uLmNyZWF0ZVNpbmdsZSgxMTIsIDI1LCAwLCAwKVxuICB9KVxufVxuXG5mdW5jdGlvbiBCbG9jayAoaW1hZ2UsIHcsIGgsIHgsIHkpIHtcbiAgRW50aXR5LmNhbGwodGhpcylcbiAgUGh5c2ljcyh0aGlzLCB3LCBoLCB4LCB5KVxuICB0aGlzLnBoeXNpY3MuZHkgPSBNYXRoLnJhbmRvbSgpICogLTJcbiAgdGhpcy5waHlzaWNzLmRkeSA9IC4wMDFcbiAgU3ByaXRlKHRoaXMsIHcsIGgsIGltYWdlLCBcImlkbGVcIiwge1xuICAgIGlkbGU6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoNDQsIDIyLCAwLCAwLCAzLCB0cnVlLCAxMDAwKVxuICB9KVxufVxuXG5mdW5jdGlvbiBGaWdodGVyIChpbWFnZSwgdywgaCwgeCwgeSkge1xuICBFbnRpdHkuY2FsbCh0aGlzKVxuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFNwcml0ZSh0aGlzLCB3LCBoLCBpbWFnZSwgXCJmaXJlYmFsbFwiLCB7XG4gICAgZmlyZWJhbGw6IEFuaW1hdGlvbi5jcmVhdGVMaW5lYXIoMTc0LCAxMzQsIDAsIDAsIDI1LCB0cnVlKVxuICB9KVxufVxuXG5mdW5jdGlvbiBXYXRlciAodywgaCwgeCwgeSwgc2xpY2VDb3VudCwgdG9wQ29sb3IsIGJvdHRvbUNvbG9yKSB7XG4gIGxldCB0b3BDb2xvciAgICA9IHRvcENvbG9yIHx8IFswLCAwLCAuNSwgLjVdXG4gIGxldCBib3R0b21Db2xvciA9IGJvdHRvbUNvbG9yIHx8IFsuNywgLjcsIC44LCAuOV1cblxuICBFbnRpdHkuY2FsbCh0aGlzKVxuICAvL1RPRE86IFBvbHlnb25zIHNob3VsZCBzdG9yZSBsb2NhbCBjb29yZGluYXRlc1xuICBQaHlzaWNzKHRoaXMsIHcsIGgsIHgsIHkpXG4gIFBvbHlnb24odGhpcywgV2F0ZXJQb2x5Z29uKHcsIGgsIHgsIHksIHNsaWNlQ291bnQsIHRvcENvbG9yLCBib3R0b21Db2xvcikpXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5QaHlzaWNzICAgICAgICAgID0gUGh5c2ljc1xubW9kdWxlLmV4cG9ydHMuUGxheWVyQ29udHJvbGxlZCA9IFBsYXllckNvbnRyb2xsZWRcbm1vZHVsZS5leHBvcnRzLlNwcml0ZSAgICAgICAgICAgPSBTcHJpdGVcbm1vZHVsZS5leHBvcnRzLlBvbHlnb24gICAgICAgICAgPSBQb2x5Z29uXG5cbmZ1bmN0aW9uIFNwcml0ZSAoZSwgd2lkdGgsIGhlaWdodCwgaW1hZ2UsIGN1cnJlbnRBbmltYXRpb25OYW1lLCBhbmltYXRpb25zKSB7XG4gIGUuc3ByaXRlID0ge1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBpbWFnZSxcbiAgICBhbmltYXRpb25zLFxuICAgIGN1cnJlbnRBbmltYXRpb25OYW1lLFxuICAgIGN1cnJlbnRBbmltYXRpb25JbmRleDogMCxcbiAgICBjdXJyZW50QW5pbWF0aW9uOiAgICAgIGFuaW1hdGlvbnNbY3VycmVudEFuaW1hdGlvbk5hbWVdLFxuICAgIHRpbWVUaWxsTmV4dEZyYW1lOiAgICAgYW5pbWF0aW9uc1tjdXJyZW50QW5pbWF0aW9uTmFtZV0uZnJhbWVzWzBdLmR1cmF0aW9uXG4gIH1cbn1cblxuZnVuY3Rpb24gUG9seWdvbiAoZSwgcG9seWdvbikge1xuICBlLnBvbHlnb24gPSBwb2x5Z29uXG59XG5cbmZ1bmN0aW9uIFBoeXNpY3MgKGUsIHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgZS5waHlzaWNzID0ge1xuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHgsIFxuICAgIHksIFxuICAgIGR4OiAgMCwgXG4gICAgZHk6ICAwLCBcbiAgICBkZHg6IDAsIFxuICAgIGRkeTogMFxuICB9XG4gIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIFBsYXllckNvbnRyb2xsZWQgKGUpIHtcbiAgZS5wbGF5ZXJDb250cm9sbGVkID0gdHJ1ZVxufVxuIiwibW9kdWxlLmV4cG9ydHMuZmluZFdoZXJlID0gZmluZFdoZXJlXG5tb2R1bGUuZXhwb3J0cy5oYXNLZXlzICAgPSBoYXNLZXlzXG5cbi8vOjogW3t9XSAtPiBTdHJpbmcgLT4gTWF5YmUgQVxuZnVuY3Rpb24gZmluZFdoZXJlIChrZXksIHByb3BlcnR5LCBhcnJheU9mT2JqZWN0cykge1xuICBsZXQgbGVuICAgPSBhcnJheU9mT2JqZWN0cy5sZW5ndGhcbiAgbGV0IGkgICAgID0gLTFcbiAgbGV0IGZvdW5kID0gbnVsbFxuXG4gIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgIGlmIChhcnJheU9mT2JqZWN0c1tpXVtrZXldID09PSBwcm9wZXJ0eSkge1xuICAgICAgZm91bmQgPSBhcnJheU9mT2JqZWN0c1tpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kXG59XG5cbmZ1bmN0aW9uIGhhc0tleXMgKGtleXMsIG9iaikge1xuICBsZXQgaSA9IC0xXG4gIFxuICB3aGlsZSAoa2V5c1srK2ldKSBpZiAoIW9ialtrZXlzW2ldXSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG4iLCIvLzo6ID0+IEdMQ29udGV4dCAtPiBCdWZmZXIgLT4gSW50IC0+IEludCAtPiBGbG9hdDMyQXJyYXlcbmZ1bmN0aW9uIHVwZGF0ZUJ1ZmZlciAoZ2wsIGJ1ZmZlciwgbG9jLCBjaHVua1NpemUsIGRhdGEpIHtcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvYywgY2h1bmtTaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApXG59XG5cbm1vZHVsZS5leHBvcnRzLnVwZGF0ZUJ1ZmZlciA9IHVwZGF0ZUJ1ZmZlclxuIiwibW9kdWxlLmV4cG9ydHMuc3ByaXRlVmVydGV4U2hhZGVyID0gXCIgXFxcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxuICBcXFxuICBhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOyBcXFxuICBhdHRyaWJ1dGUgdmVjMiBhX3RleENvb3JkOyBcXFxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXG4gIHVuaWZvcm0gbWF0MyB1X2NhbWVyYVRyYW5zZm9ybTsgXFxcbiAgdmFyeWluZyB2ZWMyIHZfdGV4Q29vcmQ7IFxcXG4gIFxcXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxuICAgIHJldHVybiBwb3NpdGlvbiAqIDIuMCAtIDEuMDsgXFxcbiAgfSBcXFxuICBcXFxuICB2b2lkIG1haW4oKSB7IFxcXG4gICAgdmVjMiBzY3JlZW5Qb3MgICAgID0gKHVfY2FtZXJhVHJhbnNmb3JtICogdmVjMyhhX3Bvc2l0aW9uLCAxKSkueHk7IFxcXG4gICAgbWF0MiBjbGlwU3BhY2UgICAgID0gbWF0MigxLjAsIDAuMCwgMC4wLCAtMS4wKTsgXFxcbiAgICB2ZWMyIGZyb21Xb3JsZFNpemUgPSBzY3JlZW5Qb3MgLyB1X3dvcmxkU2l6ZTsgXFxcbiAgICB2ZWMyIHBvc2l0aW9uICAgICAgPSBjbGlwU3BhY2UgKiBub3JtKGZyb21Xb3JsZFNpemUpOyBcXFxuICAgIFxcXG4gICAgdl90ZXhDb29yZCAgPSBhX3RleENvb3JkOyBcXFxuICAgIGdsX1Bvc2l0aW9uID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXG4gIH1cIlxuXG5tb2R1bGUuZXhwb3J0cy5zcHJpdGVGcmFnbWVudFNoYWRlciA9IFwiXFxcbiAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OyBcXFxuICBcXFxuICB1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOyBcXFxuICBcXFxuICB2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsgXFxcbiAgXFxcbiAgdm9pZCBtYWluKCkgeyBcXFxuICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X2ltYWdlLCB2X3RleENvb3JkKTsgXFxcbiAgfVwiXG5cbm1vZHVsZS5leHBvcnRzLnBvbHlnb25WZXJ0ZXhTaGFkZXIgPSBcIlxcXG4gIGF0dHJpYnV0ZSB2ZWMyIGFfdmVydGV4OyBcXFxuICBhdHRyaWJ1dGUgdmVjNCBhX3ZlcnRleENvbG9yOyBcXFxuICB1bmlmb3JtIHZlYzIgdV93b3JsZFNpemU7IFxcXG4gIHVuaWZvcm0gbWF0MyB1X2NhbWVyYVRyYW5zZm9ybTsgXFxcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXG4gIHZlYzIgbm9ybSAodmVjMiBwb3NpdGlvbikgeyBcXFxuICAgIHJldHVybiBwb3NpdGlvbiAqIDIuMCAtIDEuMDsgXFxcbiAgfSBcXFxuICB2b2lkIG1haW4gKCkgeyBcXFxuICAgIHZlYzIgc2NyZWVuUG9zICAgICA9ICh1X2NhbWVyYVRyYW5zZm9ybSAqIHZlYzMoYV92ZXJ0ZXgsIDEpKS54eTsgXFxcbiAgICBtYXQyIGNsaXBTcGFjZSAgICAgPSBtYXQyKDEuMCwgMC4wLCAwLjAsIC0xLjApOyBcXFxuICAgIHZlYzIgZnJvbVdvcmxkU2l6ZSA9IHNjcmVlblBvcyAvIHVfd29ybGRTaXplOyBcXFxuICAgIHZlYzIgcG9zaXRpb24gICAgICA9IGNsaXBTcGFjZSAqIG5vcm0oZnJvbVdvcmxkU2l6ZSk7IFxcXG4gICAgXFxcbiAgICB2X3ZlcnRleENvbG9yID0gYV92ZXJ0ZXhDb2xvcjsgXFxcbiAgICBnbF9Qb3NpdGlvbiAgID0gdmVjNChwb3NpdGlvbiwgMCwgMSk7IFxcXG4gIH1cIlxuXG5tb2R1bGUuZXhwb3J0cy5wb2x5Z29uRnJhZ21lbnRTaGFkZXIgPSBcIlxcXG4gIHByZWNpc2lvbiBoaWdocCBmbG9hdDsgXFxcbiAgXFxcbiAgdmFyeWluZyB2ZWM0IHZfdmVydGV4Q29sb3I7IFxcXG4gIFxcXG4gIHZvaWQgbWFpbigpIHsgXFxcbiAgICBnbF9GcmFnQ29sb3IgPSB2X3ZlcnRleENvbG9yOyBcXFxuICB9XCJcbiIsIi8vOjogPT4gR0xDb250ZXh0IC0+IEVOVU0gKFZFUlRFWCB8fCBGUkFHTUVOVCkgLT4gU3RyaW5nIChDb2RlKVxuZnVuY3Rpb24gU2hhZGVyIChnbCwgdHlwZSwgc3JjKSB7XG4gIGxldCBzaGFkZXIgID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpXG4gIGxldCBpc1ZhbGlkID0gZmFsc2VcbiAgXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG5cbiAgaXNWYWxpZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKVxuXG4gIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiTm90IHZhbGlkIHNoYWRlcjogXFxuXCIgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpXG4gIHJldHVybiAgICAgICAgc2hhZGVyXG59XG5cbi8vOjogPT4gR0xDb250ZXh0IC0+IFZlcnRleFNoYWRlciAtPiBGcmFnbWVudFNoYWRlclxuZnVuY3Rpb24gUHJvZ3JhbSAoZ2wsIHZzLCBmcykge1xuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0odnMsIGZzKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cylcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKVxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vLzo6ID0+IEdMQ29udGV4dCAtPiBUZXh0dXJlXG5mdW5jdGlvbiBUZXh0dXJlIChnbCkge1xuICBsZXQgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcblxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKVxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKVxuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKVxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuICByZXR1cm4gdGV4dHVyZVxufVxuXG5tb2R1bGUuZXhwb3J0cy5TaGFkZXIgID0gU2hhZGVyXG5tb2R1bGUuZXhwb3J0cy5Qcm9ncmFtID0gUHJvZ3JhbVxubW9kdWxlLmV4cG9ydHMuVGV4dHVyZSA9IFRleHR1cmVcbiIsImxldCBDYW1lcmEgICAgICAgICAgPSByZXF1aXJlKFwiLi9DYW1lcmFcIilcbmxldCBMb2FkZXIgICAgICAgICAgPSByZXF1aXJlKFwiLi9Mb2FkZXJcIilcbmxldCBHTFJlbmRlcmVyICAgICAgPSByZXF1aXJlKFwiLi9HTFJlbmRlcmVyXCIpXG5sZXQgRW50aXR5U3RvcmUgICAgID0gcmVxdWlyZShcIi4vRW50aXR5U3RvcmUtU2ltcGxlXCIpXG5sZXQgQ2xvY2sgICAgICAgICAgID0gcmVxdWlyZShcIi4vQ2xvY2tcIilcbmxldCBDYWNoZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi9DYWNoZVwiKVxubGV0IFNjZW5lTWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL1NjZW5lTWFuYWdlclwiKVxubGV0IFRlc3RTY2VuZSAgICAgICA9IHJlcXVpcmUoXCIuL1Rlc3RTY2VuZVwiKVxubGV0IEdhbWUgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIilcbmxldCBXb3JsZCAgICAgICAgICAgPSByZXF1aXJlKFwiLi9Xb3JsZFwiKVxubGV0IElucHV0TWFuYWdlciAgICA9IHJlcXVpcmUoXCIuL0lucHV0TWFuYWdlclwiKVxubGV0IEtleWJvYXJkTWFuYWdlciA9IHJlcXVpcmUoXCIuL0tleWJvYXJkTWFuYWdlclwiKVxubGV0IEF1ZGlvU3lzdGVtICAgICA9IHJlcXVpcmUoXCIuL0F1ZGlvU3lzdGVtXCIpXG5sZXQgY2FudmFzICAgICAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxuXG5jb25zdCBVUERBVEVfSU5URVJWQUwgPSAyNVxuY29uc3QgTUFYX0NPVU5UICAgICAgID0gMTAwMFxuXG5sZXQga2V5Ym9hcmRNYW5hZ2VyID0gbmV3IEtleWJvYXJkTWFuYWdlcihkb2N1bWVudClcbmxldCBpbnB1dE1hbmFnZXIgICAgPSBuZXcgSW5wdXRNYW5hZ2VyKGtleWJvYXJkTWFuYWdlcilcbmxldCBlbnRpdHlTdG9yZSAgICAgPSBuZXcgRW50aXR5U3RvcmVcbmxldCBjbG9jayAgICAgICAgICAgPSBuZXcgQ2xvY2soRGF0ZS5ub3cpXG5sZXQgY2FjaGUgICAgICAgICAgID0gbmV3IENhY2hlKFtcInNvdW5kc1wiLCBcInRleHR1cmVzXCJdKVxubGV0IGxvYWRlciAgICAgICAgICA9IG5ldyBMb2FkZXJcbmxldCByZW5kZXJlciAgICAgICAgPSBuZXcgR0xSZW5kZXJlcihjYW52YXMsIDE5MjAsIDEwODApXG5sZXQgYXVkaW9TeXN0ZW0gICAgID0gbmV3IEF1ZGlvU3lzdGVtKFtcIm1haW5cIiwgXCJiZ1wiXSlcbmxldCBzY2VuZU1hbmFnZXIgICAgPSBuZXcgU2NlbmVNYW5hZ2VyKFtuZXcgVGVzdFNjZW5lXSlcbmxldCBnYW1lICAgICAgICAgICAgPSBuZXcgR2FtZShjbG9jaywgY2FjaGUsIGxvYWRlciwgaW5wdXRNYW5hZ2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLCBhdWRpb1N5c3RlbSwgZW50aXR5U3RvcmUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTWFuYWdlcilcblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ2FtZSkge1xuICBsZXQgc3RvcmUgICAgICAgICAgPSBnYW1lLmVudGl0eVN0b3JlXG4gIGxldCBjbG9jayAgICAgICAgICA9IGdhbWUuY2xvY2tcbiAgbGV0IGlucHV0TWFuYWdlciAgID0gZ2FtZS5pbnB1dE1hbmFnZXJcbiAgbGV0IGNvbXBvbmVudE5hbWVzID0gW1wicmVuZGVyYWJsZVwiLCBcInBoeXNpY3NcIl1cblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICBjbG9jay50aWNrKClcbiAgICBpbnB1dE1hbmFnZXIua2V5Ym9hcmRNYW5hZ2VyLnRpY2soY2xvY2suZFQpXG4gICAgZ2FtZS5zY2VuZU1hbmFnZXIuYWN0aXZlU2NlbmUudXBkYXRlKGNsb2NrLmRUKVxuICB9XG59XG5cbmxldCB3ID0gbmV3IFdvcmxkKDE5MjAsIDEwODApXG5sZXQgYyA9IG5ldyBDYW1lcmEoMTkyMCwgMTA4MCwgMCwgMClcblxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdhbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIGdhbWUucmVuZGVyZXIucmVuZGVyKHcud2lkdGgsIHcuaGVpZ2h0LCBjLm1hdHJpeClcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgIFxuICB9XG59XG5cbndpbmRvdy5nYW1lID0gZ2FtZVxuXG5mdW5jdGlvbiBzZXR1cERvY3VtZW50IChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpIHtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXG4gIHJlbmRlcmVyLnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVuZGVyZXIucmVzaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpXG4gIH0pXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgc2V0dXBEb2N1bWVudChjYW52YXMsIGRvY3VtZW50LCB3aW5kb3cpXG4gIGdhbWUuc3RhcnQoKVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2FtZSkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSksIFVQREFURV9JTlRFUlZBTClcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cy51cGRhdGVWZWxvY2l0eSA9IHVwZGF0ZVZlbG9jaXR5XG5tb2R1bGUuZXhwb3J0cy51cGRhdGVQb3NpdGlvbiA9IHVwZGF0ZVBvc2l0aW9uIFxuXG5mdW5jdGlvbiB1cGRhdGVWZWxvY2l0eSAoZFQsIHBoeXNpY3MpIHtcbiAgcGh5c2ljcy5keCArPSAoZFQgKiBwaHlzaWNzLmRkeCkgXG4gIHBoeXNpY3MuZHkgKz0gKGRUICogcGh5c2ljcy5kZHkpIFxufVxuXG5mdW5jdGlvbiB1cGRhdGVQb3NpdGlvbiAoZFQsIHBoeXNpY3MpIHtcbiAgcGh5c2ljcy54ICs9IChkVCAqIHBoeXNpY3MuZHgpXG4gIHBoeXNpY3MueSArPSAoZFQgKiBwaHlzaWNzLmR5KVxufVxuIiwibW9kdWxlLmV4cG9ydHMuY2hlY2tUeXBlICAgICAgPSBjaGVja1R5cGVcbm1vZHVsZS5leHBvcnRzLmNoZWNrVmFsdWVUeXBlID0gY2hlY2tWYWx1ZVR5cGVcbm1vZHVsZS5leHBvcnRzLnNldEJveCAgICAgICAgID0gc2V0Qm94XG5cbmNvbnN0IFBPSU5UX0RJTUVOU0lPTiAgICAgPSAyXG5jb25zdCBQT0lOVFNfUEVSX0JPWCAgICAgID0gNlxuY29uc3QgQk9YX0xFTkdUSCAgICAgICAgICA9IFBPSU5UX0RJTUVOU0lPTiAqIFBPSU5UU19QRVJfQk9YXG5cbmZ1bmN0aW9uIGNoZWNrVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBjdG9yKSkgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBiZSBvZiB0eXBlIFwiICsgY3Rvci5uYW1lKVxufVxuXG5mdW5jdGlvbiBjaGVja1ZhbHVlVHlwZSAoaW5zdGFuY2UsIGN0b3IpIHtcbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhpbnN0YW5jZSlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIGNoZWNrVHlwZShpbnN0YW5jZVtrZXlzW2ldXSwgY3Rvcilcbn1cblxuZnVuY3Rpb24gc2V0Qm94IChib3hBcnJheSwgaW5kZXgsIHcsIGgsIHgsIHkpIHtcbiAgbGV0IGkgID0gQk9YX0xFTkdUSCAqIGluZGV4XG4gIGxldCB4MSA9IHhcbiAgbGV0IHkxID0geSBcbiAgbGV0IHgyID0geCArIHdcbiAgbGV0IHkyID0geSArIGhcblxuICBib3hBcnJheVtpXSAgICA9IHgxXG4gIGJveEFycmF5W2krMV0gID0geTFcbiAgYm94QXJyYXlbaSsyXSAgPSB4MVxuICBib3hBcnJheVtpKzNdICA9IHkyXG4gIGJveEFycmF5W2krNF0gID0geDJcbiAgYm94QXJyYXlbaSs1XSAgPSB5MVxuXG4gIGJveEFycmF5W2krNl0gID0geDFcbiAgYm94QXJyYXlbaSs3XSAgPSB5MlxuICBib3hBcnJheVtpKzhdICA9IHgyXG4gIGJveEFycmF5W2krOV0gID0geTJcbiAgYm94QXJyYXlbaSsxMF0gPSB4MlxuICBib3hBcnJheVtpKzExXSA9IHkxXG59XG4iXX0=
