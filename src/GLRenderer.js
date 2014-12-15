let {Shader, Program, Texture} = require("./gl-types")
let {updateBuffer} = require("./gl-buffer")

module.exports = GLRenderer

const POINT_DIMENSION = 2
const POINTS_PER_BOX  = 6
const BOX_LENGTH      = POINT_DIMENSION * POINTS_PER_BOX

function setBox (boxArray, index, w, h, x, y) {
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

function GLRenderer (canvas, vSrc, fSrc, options={}) {
  let {maxSpriteCount, width, height} = options
  let maxSpriteCount = maxSpriteCount || 100
  let view           = canvas
  let gl             = canvas.getContext("webgl")      
  let vs             = Shader(gl, gl.VERTEX_SHADER, vSrc)
  let fs             = Shader(gl, gl.FRAGMENT_SHADER, fSrc)
  let program        = Program(gl, vs, fs)

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

  let imageToTextureMap = new Map()
  let textureToBatchMap = new Map()

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 0.0)
  gl.colorMask(true, true, true, true)
  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)

  this.dimensions = {
    width:  width || 1920, 
    height: height || 1080
  }

  this.addBatch = (texture) => {
    textureToBatchMap.set(texture, {
      count:     0,
      boxes:     BoxArray(maxSpriteCount),
      centers:   CenterArray(maxSpriteCount),
      scales:    ScaleArray(maxSpriteCount),
      rotations: RotationArray(maxSpriteCount),
      texCoords: TextureCoordinatesArray(maxSpriteCount)
    }) 
    return textureToBatchMap.get(texture)
  }

  this.addTexture = (image) => {
    let texture = Texture(gl)

    imageToTextureMap.set(image, texture)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
    return texture
  }

  this.resize = (width, height) => {
    let ratio       = this.dimensions.width / this.dimensions.height
    let targetRatio = width / height
    let useWidth    = ratio >= targetRatio
    let newWidth    = useWidth ? width : (height * ratio) 
    let newHeight   = useWidth ? (width / ratio) : height

    canvas.width  = newWidth 
    canvas.height = newHeight 
    gl.viewport(0, 0, newWidth, newHeight)
  }

  this.addSprite = (image, w, h, x, y, tw, th, tx, ty) => {
    let tx    = imageToTextureMap.get(image) || this.addTexture(image)
    let batch = textureToBatchMap.get(tx) || this.addBatch(tx)

    setBox(batch.boxes, batch.count, w, h, x, y)
    //TODO: We should set the texcoords for this sprite as well
    batch.count++
  }

  let resetBatch = (batch) => batch.count = 0

  let drawBatch = (batch, texture) => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    updateBuffer(gl, boxBuffer, boxLocation, POINT_DIMENSION, batch.boxes)
    //updateBuffer(gl, centerBuffer, centerLocation, POINT_DIMENSION, centers)
    //updateBuffer(gl, scaleBuffer, scaleLocation, POINT_DIMENSION, scales)
    //updateBuffer(gl, rotationBuffer, rotLocation, 1, rotations)
    updateBuffer(gl, texCoordBuffer, texCoordLocation, POINT_DIMENSION, batch.texCoords)
    gl.drawArrays(gl.TRIANGLES, 0, batch.count * POINTS_PER_BOX)
    
  }

  this.flush = () => {
    textureToBatchMap.forEach(resetBatch)
  }

  this.render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080)
    textureToBatchMap.forEach(drawBatch)
  }
}
