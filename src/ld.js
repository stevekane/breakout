let canvas    = document.createElement("canvas")
let gl        = canvas.getContext("webgl")
let vertexSrc = document.getElementById("vertex").text
let fragSrc   = document.getElementById("fragment").text

//TODO: inserted this janky crap to deal with scrollbars
//:: GLContext -> DomElement
function fitTo (gl, target) {
  let canvas = gl.canvas

  canvas.width  = target.innerWidth * .9
  canvas.height = target.innerHeight * .9
  gl.viewport(0, 0, canvas.width, canvas.height)
}

//Shader: Program that is executed in parallel on the GPU

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

//Coordinate system for webGL is clipspace which is -1 -> 1 on both x and y
//  Point(-1, -1), Point(1, -1), Point(-1, 1)
//express the data above on a single array
//  [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0] -- standard JS Array  -- create with new Array(SIZE)
//express as Float32Array
//  new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0])

//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer (gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0)
}

function setBox (boxArray, index, x, y, w, h) {}

const POINT_DIMENSION = 2

let vs          = Shader(gl, gl.VERTEX_SHADER, vertexSrc)
let fs          = Shader(gl, gl.FRAGMENT_SHADER, fragSrc)
let program     = Program(gl, vs, fs)
let buffer      = Buffer(gl)
let boxes       = new Float32Array([-1.0, 1.0, 0.0, 0.0, -1.0, -1.0])
let posLocation = gl.getAttribLocation(program, "a_position")

/* 
 * Create a GL program (GL Shader(vertex), GL Shader(fragment))
 * Link the program to the GL context (this is stupid bookkeeping)
 * Use this GL program
 *
 * Send the GL program Data that it will use in the execution of the shaders
 *  vertex shaders: this is usually an array of points
 *  fragment shaders: this is usually textures, colors, filters, blah blah
 * 
 * Call the GL draw function
 *  1) run your vertex shaders in parallel for the chunks of data you have provided
 *  this usually means the big ass array of points in space you defined
 *
 *  2) run your fragment shaders in parallel and writes the resulting bitmap
 *  to a buffer.  By default, this buffer is the actual screen buffer
 *
 */

function makeAnimate (stuff) {
  gl.useProgram(program)
  return function animate () {
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    updateBuffer(gl, buffer, posLocation, POINT_DIMENSION, boxes)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    requestAnimationFrame(animate)
  }
}

//DOM Callback stuff
document.addEventListener("DOMContentLoaded", function () {
  document.body.appendChild(canvas)
  fitTo(gl, window)
  requestAnimationFrame(makeAnimate())
})

window.addEventListener("resize", ({target}) => fitTo(gl, target))
