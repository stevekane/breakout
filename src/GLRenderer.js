let {spriteVertexShader, spriteFragmentShader} = require("./gl-shaders")
let {Shader, Program, Texture} = require("./gl-types")
let {updateBuffer} = require("./gl-buffer")

module.exports = GLRenderer

const POINT_DIMENSION  = 2
const POINTS_PER_BOX   = 6
const BOX_LENGTH       = POINT_DIMENSION * POINTS_PER_BOX
const MAX_VERTEX_COUNT = 1000

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

//texture coords are initialized to 0 -> 1 texture coord space
function TextureCoordinatesArray (count) {
  let ar = new Float32Array(count * BOX_LENGTH)  

  for (var i = 0, len = ar.length; i < len; i += BOX_LENGTH) {
    setBox(ar, i, 1, 1, 0, 0)
  } 
  return ar
}

function VertexArray (size) {
  return new Float32Array(size * POINT_DIMENSION)
}

//4 for r, g, b, a
function VertexColorArray (size) {
  return new Float32Array(size * 4)
}

function SpriteBatch (size) {
  this.count      = 0
  this.boxes      = BoxArray(size)
  this.centers    = CenterArray(size)
  this.scales     = ScaleArray(size)
  this.rotations  = RotationArray(size)
  this.texCoords  = TextureCoordinatesArray(size)
}

function PolygonBatch (size) {
  this.index        = 0
  this.vertices     = VertexArray(size)
  this.vertexColors = VertexColorArray(size)
}

function GLRenderer (canvas, width, height) {
  let maxSpriteCount = 100
  let view           = canvas
  let gl             = canvas.getContext("webgl")      
  let svs            = Shader(gl, gl.VERTEX_SHADER, spriteVertexShader)
  let sfs            = Shader(gl, gl.FRAGMENT_SHADER, spriteFragmentShader)
  //let pvs            = Shader(gl, gl.VERTEX_SHADER, polygonVertexShader)
  //let pfs            = Shader(gl, gl.FRAGMENT_SHADER, polygonFragmentShader)
  let spriteProgram  = Program(gl, svs, sfs)
  //let polygonProgram = Program(gl, pvs, pfs)

  //handles to GPU buffers
  let boxBuffer      = gl.createBuffer()
  let centerBuffer   = gl.createBuffer()
  let scaleBuffer    = gl.createBuffer()
  let rotationBuffer = gl.createBuffer()
  let texCoordBuffer = gl.createBuffer()

  //GPU buffer locations
  let boxLocation      = gl.getAttribLocation(spriteProgram, "a_position")
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")
  let texCoordLocation = gl.getAttribLocation(spriteProgram, "a_texCoord")

  //Uniform locations
  let worldSizeLocation = gl.getUniformLocation(spriteProgram, "u_worldSize")

  let imageToTextureMap = new Map()
  let textureToBatchMap = new Map()
  let polygonBatch      = new PolygonBatch(MAX_VERTEX_COUNT)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 0.0)
  gl.colorMask(true, true, true, true)
  gl.activeTexture(gl.TEXTURE0)

  this.dimensions = {
    width:  width || 1920, 
    height: height || 1080
  }

  this.addBatch = (texture) => {
    textureToBatchMap.set(texture, new SpriteBatch(maxSpriteCount))
    return textureToBatchMap.get(texture)
  }

  this.addTexture = (image) => {
    let texture = Texture(gl)

    imageToTextureMap.set(image, texture)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
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

  this.addSprite = (image, w, h, x, y, texw, texh, texx, texy) => {
    let tx    = imageToTextureMap.get(image) || this.addTexture(image)
    let batch = textureToBatchMap.get(tx) || this.addBatch(tx)

    setBox(batch.boxes, batch.count, w, h, x, y)
    setBox(batch.texCoords, batch.count, texw, texh, texx, texy)
    batch.count++
  }

  //vertices and vertexColors are arrays or typed arrays
  //[x0, y0, x1, y1, ...]
  //[r0, g0, b0, a0, ...]
  this.addPolygon = (vertices, vertexColors) => {
    let vertexCount = vertices.length / POINT_DIMENSION

    polygonBatch.vertices.set(vertices, polygonBatch.index)
    polygonBatch.vertexColors.set(vertexColors, polygonBatch.index)
    polygonBatch.index += vertexCount
  }

  let resetPolygons = (batch) => batch.index = 0

  let drawPolygons = (batch) => {
    //use the correct program
    //buffer the vertices
    //buffer the vertexcolors
    //draw the arrays
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
    resetPolygons(polygonBatch)
  }

  this.render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(spriteProgram)
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeLocation, 1920, 1080)
    textureToBatchMap.forEach(drawBatch)
    //gl.useProgram(polygonProgram)
    //drawPolygons(polygonBatch)
  }
}
