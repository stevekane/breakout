let canvas    = document.createElement("canvas")
let gl        = canvas.getContext("webgl")
let vertexSrc = document.getElementById("vertex").text
let fragSrc   = document.getElementById("fragment").text

const POINT_DIMENSION = 2
const POINTS_PER_BOX  = 6
const BOX_LENGTH      = POINT_DIMENSION * POINTS_PER_BOX

let maxFromWidth  = (ratio, width) => width / ratio
let maxFromHeight = (ratio, height) => height * ratio

//get the target dimensions
//fit largest possible box of world ratio into these dimensions
//resize canvas to these dimensions
//update viewport with canvas dimensions
//:: => GLContext -> DOMElement -> World
function resizeView (gl, target, world) {
  let canvas      = gl.canvas
  let ratio       = world.ratio
  let maxWidth    = target.innerWidth
  let maxHeight   = target.innerHeight
  let targetRatio = maxWidth / maxHeight
  let useWidth    = ratio >= targetRatio
  let w           = useWidth ? maxWidth : maxFromHeight(ratio, maxHeight)
  let h           = useWidth ? maxFromWidth(ratio, maxWidth) : maxHeight

  canvas.width  = w * .9
  canvas.height = h * .9
  gl.viewport(0, 0, canvas.width, canvas.height)
}

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

//:: => Int -> Int
function World (width, height) {
  return {
    ratio: width / height,
    width, 
    height
  }
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

let BOX_COUNT   = 10
let activeBoxes = 1
let vs          = Shader(gl, gl.VERTEX_SHADER, vertexSrc)
let fs          = Shader(gl, gl.FRAGMENT_SHADER, fragSrc)
let program     = Program(gl, vs, fs)
let buffer      = Buffer(gl)
let boxes       = new Float32Array(BOX_COUNT * BOX_LENGTH)
let posLocation = gl.getAttribLocation(program, "a_position")
let world       = World(1920, 1080)

window.world = world

setBox(boxes, 0, 0, 0, 1, 1)

function makeAnimate (stuff) {
  gl.useProgram(program)
  return function animate () {
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    updateBuffer(gl, buffer, posLocation, POINT_DIMENSION, boxes)
    gl.drawArrays(gl.TRIANGLES, 0, activeBoxes * POINTS_PER_BOX)
    requestAnimationFrame(animate)
  }
}

//DOM Callback stuff
document.addEventListener("DOMContentLoaded", function () {
  document.body.appendChild(canvas)
  resizeView(gl, window, world)
  requestAnimationFrame(makeAnimate())
})

window.addEventListener("resize", function ({target}) {
  resizeView(gl, target, world)
})
