let body   = document.body
let canvas = document.createElement("canvas")
let gl     = canvas.getContext("webgl")
let findEl = (x) => document.getElementById(x)

function Shader (gl, type, text) {
  let shader  = gl.createShader(type)
  let isValid = false

  gl.shaderSource(shader, text)
  gl.compileShader(shader)

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!isValid) throw new Error("Not valid shader: \n" + text)
  else          return shader
}

function Program (gl, vs, fs) {
  let program = gl.createProgram(vs, fs)

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return program
}

//no allocation.  writes data into an allocated Typed Array at given index
function setBox (boxes, index, x, y, w, h) {
  let x1 = x
  let x2 = x + w
  let y1 = y
  let y2 = y + h
  let i  = index * BOX_POINT_COUNT

  boxes[i]    = x1
  boxes[i+1]  = y1
  boxes[i+2]  = x2
  boxes[i+3]  = y1
  boxes[i+4]  = x1
  boxes[i+5]  = y2

  boxes[i+6]  = x1
  boxes[i+7]  = y2
  boxes[i+8]  = x2
  boxes[i+9]  = y1
  boxes[i+10] = x2
  boxes[i+11] = y2
} 

//:: glContext, glBuffer, Int, Int, Float32Array
function updateBuffer (gl, buffer, position, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, chunkSize, gl.FLOAT, false, 0, 0)
}

//a_position vec2

const MAX_BOX_COUNT      = 2
const BOX_POINT_COUNT    = 12
const BOX_TRIANGLE_COUNT = BOX_POINT_COUNT / 2
const POINT_DIMENSION    = 2

let vShader   = Shader(gl, gl.VERTEX_SHADER, findEl("vertex").text)
let fShader   = Shader(gl, gl.FRAGMENT_SHADER, findEl("fragment").text)
let program   = Program(gl, vShader, fShader)
let posPtr    = gl.getAttribLocation(program, "a_position")
let colorPtr  = gl.getUniformLocation(program, "u_color")
let resPtr    = gl.getUniformLocation(program, "u_resolution")
let boxBuffer = gl.createBuffer()
let boxes     = new Float32Array(MAX_BOX_COUNT * BOX_POINT_COUNT)
let boxColor  = [0.0, 1.0, 1.0, 1.0]

setBox(boxes, 0, 0, 0, 30, 30)
setBox(boxes, 1, 500, 50, 200, 200)

function fitTo (reference, element) {
  element.width  = reference.innerWidth
  element.height = reference.innerHeight
}

function makeRender () {
  return function render () {
    let w = canvas.clientWidth
    let h = canvas.clientHeight

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniform2f(resPtr, w, h)
    gl.uniform4f(colorPtr, boxColor[0], boxColor[1], boxColor[2], boxColor[3])
    updateBuffer(gl, boxBuffer, posPtr, POINT_DIMENSION, boxes)
    gl.drawArrays(gl.TRIANGLES, 0, BOX_TRIANGLE_COUNT * MAX_BOX_COUNT)
    requestAnimationFrame(render)
  }
}

function boot () {
  fitTo(window, canvas) 
  document.body.appendChild(canvas)
  requestAnimationFrame(makeRender())
}

document.addEventListener("DOMContentLoaded", boot)
window.addEventListener("resize", ({target}) => fitTo(target, canvas))
