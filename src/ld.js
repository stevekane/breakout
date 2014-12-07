let canvas    = document.createElement("canvas")
let gl        = canvas.getContext("webgl")
let vertexSrc = document.getElementById("vertex").text
let fragSrc   = document.getElementById("fragment").text
let Loader    = require("./Loader")
let {resizeView} = require("./view")


const POINT_DIMENSION = 2
const POINTS_PER_BOX  = 6
const BOX_LENGTH      = POINT_DIMENSION * POINTS_PER_BOX

//:: => GLContext -> ENUM (VERTEX || FRAGMENT) -> String (Code)
function Shader (gl, type, src) {
  let shader  = gl.createShader(type)
  let isValid = false
  
  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!isValid) throw new Error("Not valid shader: \n" + src)
  return        shader
}

//:: => GLContext -> VertexShader -> FragmentShader
function Program (gl, vs, fs) {
  let program = gl.createProgram(vs, fs)

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return program
}

//:: => GLContext -> Buffer
function Buffer (gl) {
  return gl.createBuffer()
}

//:: => GLContext -> Image -> Texture
function Texture (gl, image) {
  let texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
  return texture
}

//:: => Int -> Int
function World (width, height) {
  let world = {width, height}

  Object.defineProperty(world, "ratio", {
    get() { return width/ height} 
  })
  return world
}

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer (gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0)
}

/* 
 * We now know that every Sprite that we wish to render must have:
 *   -Points defined for two triangles to form the box
 *   -center point (used in rotation and scaling)
 *   -Scalars for x-scale and y-scale
 *   -rotation in radians
 *   -reference to spritesheet
 *   -ulX, ulY, lrX, lrY (upper,lower) coordinates for frame we wish to draw
 *
 * sprite = {
 *   box:       AABB,
 *   center:    {x: Float, y: Float}
 *   scales:    {x: Float, y: Float},
 *   rotation:  Float
 *   sheetName: String,
 *   frameBox:  AABB
 * }
 *
 * What is a vertex?
 *  Vertex is a blob of data sliced from many arrays (buffers) that is read
 *  in a single pass of the vertex shader
 *
 *  [x,y,x1,y1...]  -- step by 2
 *
 *  [s, s1...] -- step by 1
 *
 *  in first pass of the vertex shader I would have [x,y] and s
 *
 * boxes:      Float32Array(size=12) -- chunkSize = 2
 * centers:    Float32Array(size=12) -- chunkSize = 2
 * scales:     Float32Array(size=12) -- chunkSize = 2
 * rotations:  Float32Array(size=6)  -- chunkSize = 1
 * frameBoxes: Float32Array(size=12) -- chunkSize = 2
 */

function setBox (boxArray, index, x, y, w, h) {
  let i  = BOX_LENGTH * index
  let x1 = x
  let y1 = y 
  let x2 = x + w
  let y2 = y + h

  boxArray[i]    = x1
  boxArray[i+1]  = y1
  boxArray[i+2]  = x2
  boxArray[i+3]  = y1
  boxArray[i+4]  = x1
  boxArray[i+5]  = y2

  boxArray[i+6]  = x1
  boxArray[i+7]  = y2
  boxArray[i+8]  = x2
  boxArray[i+9]  = y1
  boxArray[i+10] = x2
  boxArray[i+11] = y2
}

function TextureArray (size) {
  let textureSize = 12
  let texArray    = new Float32Array(size * textureSize)
 
  for (var i = 0, len = texArray.length; i < len; i+=textureSize) {
    texArray[i]    = 0
    texArray[i+1]  = 0
    texArray[i+2]  = 1
    texArray[i+3]  = 0
    texArray[i+4]  = 0
    texArray[i+5]  = 1

    texArray[i+6]  = 0
    texArray[i+7]  = 1
    texArray[i+8]  = 1
    texArray[i+9]  = 0
    texArray[i+10] = 1
    texArray[i+11] = 1
  } 
  return texArray
}

let BOX_COUNT         = 10
let activeBoxes       = 2
let vs                = Shader(gl, gl.VERTEX_SHADER, vertexSrc)
let fs                = Shader(gl, gl.FRAGMENT_SHADER, fragSrc)
let program           = Program(gl, vs, fs)
let posBuffer         = Buffer(gl)
let texBuffer         = Buffer(gl)
let boxes             = new Float32Array(BOX_COUNT * BOX_LENGTH)
let texArray          = TextureArray(BOX_COUNT)
let posLocation       = gl.getAttribLocation(program, "a_position")
let texLocation       = gl.getAttribLocation(program, "a_texCoord")
let worldSizeLocation = gl.getUniformLocation(program, "u_worldSize")
let imageLocation     = gl.getUniformLocation(program, "u_image")
let world             = World(1920, 1080)
let loader            = new Loader()
let paddleImage       
let paddleTexture
let assets    = {
  textures: {
    maptiles: "/public/spritesheets/maptiles.png",
    paddle:   "/public/spritesheets/paddle.png"
  },
  sounds: {},
  shaders: {} 
}


setBox(boxes, 0, 800, 800, 112, 25)
setBox(boxes, 1, 400, 400, 112, 25)

function makeAnimate (stuff) {
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)
  gl.uniform2f(worldSizeLocation, world.width, world.height)
  gl.uniform1i(imageLocation, 0)
  gl.bindTexture(gl.TEXTURE_2D, paddleTexture)
  updateBuffer(gl, texBuffer, texLocation, POINT_DIMENSION, texArray)

  return function animate () {
    gl.clearColor(1.0, 1.0, 1.0, 0.0)
    gl.colorMask(true, true, true, true)
    gl.clear(gl.COLOR_BUFFER_BIT)
    updateBuffer(gl, posBuffer, posLocation, POINT_DIMENSION, boxes)
    gl.drawArrays(gl.TRIANGLES, 0, activeBoxes * POINTS_PER_BOX)
    requestAnimationFrame(animate)
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loader.loadAssets(assets, function (err, results) {
    paddleImage   = results.textures.paddle
    paddleTexture = Texture(gl, paddleImage)
  
    document.body.appendChild(canvas)
    resizeView(gl, window, world)
    requestAnimationFrame(makeAnimate())
    window.addEventListener("resize", function ({target}) {
      resizeView(gl, target, world)
    })
  })
})
