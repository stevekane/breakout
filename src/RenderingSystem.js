let {setBox} = require("./utils")
let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

//x0, y0, x1, y1, x2, y2...
//let verts = new Float32Array([
//  0, 800, 
//  1920, 800, 
//  0, 1080,
//  1920, 800, 
//  1920, 1080, 
//  0, 1080
//])
//
////r,g,b,a...
//let vertColors = new Float32Array([
//  0, 0, 0.5, .6, //light
//  0, 0, 0.5, .6, //light
//  0, 0, 1,   1,
//  0, 0, 1,   1,
//  0, 0, 0.5, .6, //light
//  0, 0, 1,   1
//])

function Polygon (vertices, indices, vertexColors) {
  this.vertices     = vertices
  this.indices      = indices
  this.vertexColors = vertexColors
}

function createWater (w, h, x, y, subDiv, colorTop, colorBottom) {
  let vertices     = new Float32Array(subDiv * 6 * 2)
  let vertexColors = new Float32Array(subDiv * 6 * 4)
  let unitWidth    = w / subDiv
  let i = -1

  while ( ++ i < subDiv ) {
    setBox(vertices, i, unitWidth, h, unitWidth * i + x, y)
    vertexColors.set(vertColors, i * vertColors.length)
  }
  return new Polygon(vertices, vertexColors)
}

let waterVerts = new Float32Array([
  0,    800,
  1920, 400,
  0,    1080,
  1920, 1080 
])
let waterIndices = new Uint32Array([
  0, 1, 2,
  2, 1, 3
])
let waterColors = new Float32Array([
  0, 0, 0.5, .6,
  0, 0, 0.5, .6,
  0, 0, 1,   1,
  0, 0, 1,   1
])

let water = new Polygon(waterVerts, waterIndices, waterColors)

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
