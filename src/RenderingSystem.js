let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

function Polygon (vertices, vertexColors) {
  this.vertices     = vertices  
  this.vertexColors = vertexColors
}

//x0, y0, x1, y1, x2, y2...
let vertices = new Float32Array([
  0, 800, 
  1920, 800, 
  0, 1080,
  1920, 800, 
  1920, 1080, 
  0, 1080
])

//r,g,b,a...
let vertexColors = new Float32Array([
  0, 0, 0.5, .6, //light
  0, 0, 0.5, .6, //light
  0, 0, 1,   1,
  0, 0, 0.5, .6, //light
  0, 0, 1,   1,
  0, 0, 1,   1
])

//TODO: This is a hack to test polygon rendering
let polygon = new Polygon(vertices, vertexColors)

RenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent
  let frame

  renderer.flush()

  //TODO: For testing of polygon rendering
  renderer.addPolygon(polygon.vertices, polygon.vertexColors)

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
