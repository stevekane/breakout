let Polygon = require("./Polygon")

module.exports = WaterPolygon

const POINTS_PER_VERTEX   = 2
const COLOR_CHANNEL_COUNT = 4
const INDICES_PER_QUAD    = 6
const QUAD_VERTEX_SIZE    = 8

function setVertex (vertices, index, x, y) {
  let i = index * POINTS_PER_VERTEX

  vertices[i]   = x
  vertices[i+1] = y
}

function setColor (colors, index, color) {
  let i = index * COLOR_CHANNEL_COUNT

  colors.set(color, i)
}

function WaterPolygon (w, h, x, y, sliceCount, topColor, bottomColor) {
  let vertexCount  = 2 + (sliceCount * 2)
  let vertices     = new Float32Array(vertexCount * POINTS_PER_VERTEX)
  let vertexColors = new Float32Array(vertexCount * COLOR_CHANNEL_COUNT)
  let indices      = new Uint16Array(INDICES_PER_QUAD * sliceCount)
  let unitWidth    = w / sliceCount
  let i            = -1
  let j            = -1

  while ( ++i <= sliceCount ) {
    setVertex(vertices, i, (x + unitWidth * i), y)
    setColor(vertexColors, i, topColor)
    setVertex(vertices, i + sliceCount + 1, (x + unitWidth * i), y + h)
    setColor(vertexColors, i + sliceCount + 1, bottomColor)
  }

  while ( ++ j < sliceCount ) {
    indices[j*INDICES_PER_QUAD]   = j + 1
    indices[j*INDICES_PER_QUAD+1] = j
    indices[j*INDICES_PER_QUAD+2] = j + 1 + sliceCount
    indices[j*INDICES_PER_QUAD+3] = j + 1
    indices[j*INDICES_PER_QUAD+4] = j + 1 + sliceCount
    indices[j*INDICES_PER_QUAD+5] = j + 2 + sliceCount
  }

  return new Polygon(vertices, indices, vertexColors)
}
