let {setBox} = require("./utils")
let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

function Polygon (vertices, indices, vertexColors) {
  this.vertices     = vertices
  this.indices      = indices
  this.vertexColors = vertexColors
}

const POINTS_PER_VERTEX   = 2
const COLOR_CHANNEL_COUNT = 4
const INDICES_PER_QUAD    = 6
const QUAD_VERTEX_SIZE    = 8
const QUAD_COLOR_SIZE     = 16

function setVertex (vertices, index, x, y) {
  let i = index * POINTS_PER_VERTEX

  vertices[i]   = x
  vertices[i+1] = y
}

function setColor (colors, index, color) {
  let i = index * COLOR_CHANNEL_COUNT

  colors.set(color, i)
}

//colors passed in as 4 length arrays [r, g, b, a]
//(i, i + sliceCount + 1, i + 1), (i + sliceCount + 1, i + sliceCount + 2, i + 1)
function createWater (w, h, x, y, sliceCount, topColor, bottomColor) {
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
    indices[j*INDICES_PER_QUAD]   = j
    indices[j*INDICES_PER_QUAD+1] = j + sliceCount + 1
    indices[j*INDICES_PER_QUAD+2] = j + 1
    indices[j*INDICES_PER_QUAD+3] = j + sliceCount + 1
    indices[j*INDICES_PER_QUAD+4] = j + sliceCount + 2
    indices[j*INDICES_PER_QUAD+5] = j + 1
  }

  return new Polygon(vertices, indices, vertexColors)
}

window.createWater = createWater

let waterVerts = new Float32Array([
  0,    800,
  1920, 800,
  0,    1080,
  1920, 1080 
])
let waterIndices = new Uint16Array([
  0, 2, 1,
  2, 3, 1 
])
let waterColors = new Float32Array([
  0, 0, 0.5, .6,
  0, 0, 0.5, .6,
  0, 0, 1,   1,
  0, 0, 1,   1
])

//let water = new Polygon(waterVerts, waterIndices, waterColors)
let water = createWater(1920, 280, 0, 800, 100, [0,0,.5, .6], [0,0,1,1])

for (var i = 0; i < 100; ++i) {
  water.vertices[i*2 + 1] += (Math.sin(i) * 10)
}

window.water = water

RenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent
  let frame

  renderer.flush()

  //TODO: For testing of polygon rendering
  renderer.addPolygon(water.vertices, water.indices, water.vertexColors)

  while (++i < len) {
    ent = entities[i]

    if (ent.animated) {
      frame = ent.animated.currentAnimation.frames[ent.animated.currentAnimationIndex]
      renderer.addSprite(
        ent.renderable.image, //image
        ent.physics.width,
        ent.physics.height,
        ent.physics.x,
        ent.physics.y,
        frame.aabb.w / ent.renderable.image.width,
        frame.aabb.h / ent.renderable.image.height,
        frame.aabb.x / ent.renderable.image.width,
        frame.aabb.y / ent.renderable.image.height
      )
    } else {
      renderer.addSprite(
        ent.renderable.image, //image
        ent.physics.width,
        ent.physics.height,
        ent.physics.x,
        ent.physics.y,
        1,  //texture width
        1,  //texture height
        0,  //texture x
        0   //texture y
      )
    }
  }
}
