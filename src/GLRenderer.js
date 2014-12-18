let {spriteVertexShader, spriteFragmentShader} = require("./gl-shaders")
let {polygonVertexShader, polygonFragmentShader} = require("./gl-shaders")
let {setBox} = require("./utils")
let {Shader, Program, Texture} = require("./gl-types")
let {updateBuffer} = require("./gl-buffer")

module.exports = GLRenderer

const POINT_DIMENSION     = 2
const COLOR_CHANNEL_COUNT = 4
const POINTS_PER_BOX      = 6
const BOX_LENGTH          = POINT_DIMENSION * POINTS_PER_BOX
const MAX_VERTEX_COUNT    = 1000000

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

function IndexArray (size) {
  return new Uint16Array(size)
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
  this.indices      = IndexArray(size)
  this.vertices     = VertexArray(size)
  this.vertexColors = VertexColorArray(size)
}

function GLRenderer (canvas, width, height) {
  let maxSpriteCount = 100
  let view           = canvas
  let gl             = canvas.getContext("webgl")      
  let svs            = Shader(gl, gl.VERTEX_SHADER, spriteVertexShader)
  let sfs            = Shader(gl, gl.FRAGMENT_SHADER, spriteFragmentShader)
  let pvs            = Shader(gl, gl.VERTEX_SHADER, polygonVertexShader)
  let pfs            = Shader(gl, gl.FRAGMENT_SHADER, polygonFragmentShader)
  let spriteProgram  = Program(gl, svs, sfs)
  let polygonProgram = Program(gl, pvs, pfs)

  //Sprite shader buffers
  let boxBuffer      = gl.createBuffer()
  let centerBuffer   = gl.createBuffer()
  let scaleBuffer    = gl.createBuffer()
  let rotationBuffer = gl.createBuffer()
  let texCoordBuffer = gl.createBuffer()

  //polygon shader buffers
  let vertexBuffer      = gl.createBuffer()
  let vertexColorBuffer = gl.createBuffer()
  let indexBuffer       = gl.createBuffer()

  //GPU buffer locations
  let boxLocation      = gl.getAttribLocation(spriteProgram, "a_position")
  let texCoordLocation = gl.getAttribLocation(spriteProgram, "a_texCoord")
  //let centerLocation   = gl.getAttribLocation(program, "a_center")
  //let scaleLocation    = gl.getAttribLocation(program, "a_scale")
  //let rotLocation      = gl.getAttribLocation(program, "a_rotation")

  let vertexLocation      = gl.getAttribLocation(polygonProgram, "a_vertex")
  let vertexColorLocation = gl.getAttribLocation(polygonProgram, "a_vertexColor")

  //Uniform locations
  let worldSizeSpriteLocation  = gl.getUniformLocation(spriteProgram, "u_worldSize")
  let worldSizePolygonLocation = gl.getUniformLocation(polygonProgram, "u_worldSize")

  let imageToTextureMap = new Map()
  let textureToBatchMap = new Map()
  let polygonBatch      = new PolygonBatch(MAX_VERTEX_COUNT)

  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
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

  this.addPolygon = (vertices, indices, vertexColors) => {
    let vertexCount = indices.length

    polygonBatch.vertices.set(vertices, polygonBatch.index)
    polygonBatch.indices.set(indices, polygonBatch.index)
    polygonBatch.vertexColors.set(vertexColors, polygonBatch.index)
    polygonBatch.index += vertexCount
  }

  let resetPolygons = (batch) => batch.index = 0

  let drawPolygons = (batch) => {
    updateBuffer(gl, 
      vertexBuffer, 
      vertexLocation, 
      POINT_DIMENSION, 
      batch.vertices)
    updateBuffer(
      gl, 
      vertexColorBuffer, 
      vertexColorLocation, 
      COLOR_CHANNEL_COUNT, 
      batch.vertexColors)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.DYNAMIC_DRAW)
    gl.drawElements(gl.TRIANGLES, batch.index, gl.UNSIGNED_SHORT, 0)
    //gl.drawElements(gl.LINES, batch.index, gl.UNSIGNED_SHORT, 0)
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

    //Spritesheet batch rendering
    gl.useProgram(spriteProgram)
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizeSpriteLocation, 1920, 1080)
    textureToBatchMap.forEach(drawBatch)

    //polgon rendering
    gl.useProgram(polygonProgram)
    //TODO: hardcoded for the moment for testing
    gl.uniform2f(worldSizePolygonLocation, 1920, 1080)
    drawPolygons(polygonBatch)
  }
}
