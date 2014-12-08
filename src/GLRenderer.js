let {Shader, Program, Texture} = require("./gl-types")
let {updateBuffer} = require("./gl-buffer")

const POINT_DIMENSION = 2
const POINTS_PER_BOX  = 6
const BOX_LENGTH      = POINT_DIMENSION * POINTS_PER_BOX

//TODO: Should we write to multiple buffers in one go?
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

function BoxArray (count) {
  return new Float32Array(count * BOX_LENGTH)
}

function CenterArray (count) {
  return new Float32Array(count * BOX_LENGTH)
}

function ScaleArray (count) {
  let ar = new Float32Array(count * BOX_LENGTH)

  for (var i = 0, len = ar.length; i < len; ++i) ar[i] = 1
  return ar
}

function RotationArray (count) {
  return new Float32Array(count * POINTS_PER_BOX)
}

function TextureCoordinatesArray (count) {
  let ar = new Float32Array(count * BOX_LENGTH)  

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    ar[i]    = 0
    ar[i+1]  = 0
    ar[i+2]  = 1
    ar[i+3]  = 0
    ar[i+4]  = 0
    ar[i+5]  = 1

    ar[i+6]  = 0
    ar[i+7]  = 1
    ar[i+8]  = 1
    ar[i+9]  = 0
    ar[i+10] = 1
    ar[i+11] = 1
  } 
  return ar
}

/*
 * Game
 *    Cache -- assets
 *    Renderer
 *    GUIRenderer?
 *    AudioSystem
 *    SceneManager
 *        [Scenes]
 *            World
 *              Entities
 *              Camera
 *
 *  PhysicsSystem.step(entities)
 *  RenderingSystem.render(world, entities)
 *  Renderer.cache(entities) //gets called on update?
 *  Renderer.render(world, entities)
 */

module.exports = function GLRenderer (canvas, vSrc, fSrc, maxSpriteCount=100) {
  let gl      = canvas.getContext("webgl")      
  let vs      = Shader(gl, gl.VERTEX_SHADER, vSrc)
  let fs      = Shader(gl, gl.FRAGMENT_SHADER, fSrc)
  let program = Program(gl, vs, fs)

  //index for tracking the current available position to instantiate from
  let freeIndex     = 0
  let activeSprites = 0

  //views over cpu buffers for data
  let boxes     = BoxArray(maxSpriteCount)
  let centers   = CenterArray(maxSpriteCount)
  let scales    = ScaleArray(maxSpriteCount)
  let rotations = RotationArray(maxSpriteCount)
  let texCoords = TextureCoordinatesArray(maxSpriteCount)

  //handles to GPU buffers
  let boxBuffer      = gl.createBuffer()
  let centerBuffer   = gl.createBuffer()
  let scaleBuffer    = gl.createBuffer()
  let rotationBuffer = gl.createBuffer()
  let texCoordBuffer = gl.createBuffer()

  //GPU buffer locations
  let boxLocation      = gl.getAttribLocation(program, "a_position")
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")
  let texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

  //Uniform locations
  let worldSizeLocation = gl.getUniformLocation(program, "u_worldSize")

  //TODO: This is temporary for testing the single texture case
  let onlyTexture = Texture(gl)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 0.0)
  gl.colorMask(true, true, true, true)
  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)
  //TODO: hardcoded for the moment for testing
  gl.uniform2f(worldSizeLocation, 1920, 1080)

  //TODO: Super dirty and possibly not robust...
  this.addTexture = (image) => {
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
  }

  this.addSprite = (x, y, w, h) => {
    setBox(boxes, freeIndex++, x, y, w, h)
    activeSprites++
  }

  this.resize = (w, h) => gl.viewPort(0, 0, w, h)

  this.render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindTexture(gl.TEXTURE_2D, onlyTexture)
    updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    //updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, boxes)
    updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, texCoords)
    gl.drawArrays(gl.TRIANGLES, 0, activeSprites * POINTS_PER_BOX)
  }
}
