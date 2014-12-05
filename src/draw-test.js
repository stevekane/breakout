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
  else           return shader
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

  boxes[index]    = x1
  boxes[index+1]  = y1
  boxes[index+2]  = x2
  boxes[index+3]  = y1
  boxes[index+4]  = x1
  boxes[index+5]  = y2

  boxes[index+6]  = x1
  boxes[index+7]  = y2
  boxes[index+8]  = x2
  boxes[index+9]  = y1
  boxes[index+10] = x2
  boxes[index+11] = y2
} 

//:: glContext, glBuffer, Int, Int, Float32Array
function updateBuffer (gl, buffer, position, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, chunkSize, gl.FLOAT, false, 0, 0)
}

//a_position vec2

const MAX_BOX_COUNT   = 1
const BOX_POINT_COUNT = 12
const POINT_DIMENSION = 2

let vShader   = Shader(gl, gl.VERTEX_SHADER, findEl("vertex").text)
let fShader   = Shader(gl, gl.FRAGMENT_SHADER, findEl("fragment").text)
let program   = Program(gl, vShader, fShader)
let posPtr    = gl.getAttribLocation(program, "a_position")
let colorPtr  = gl.getUniformLocation(program, "u_color")
let boxBuffer = gl.createBuffer()
let boxes     = new Float32Array(MAX_BOX_COUNT * BOX_POINT_COUNT)
let boxColor  = [0.0, 1.0, 1.0, 1.0]

//TODO: presently in clipspace -1 -> 1
setBox(boxes, 0, -1, -1, 2, 2)
gl.useProgram(program)
gl.uniform4f(colorPtr, boxColor[0], boxColor[1], boxColor[2], boxColor[3])
updateBuffer(gl, boxBuffer, posPtr, POINT_DIMENSION, boxes)
gl.drawArrays(gl.TRIANGLES, 0, 6)

window.gl      = gl
document.body.appendChild(canvas)
