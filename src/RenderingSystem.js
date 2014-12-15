let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

RenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent

  renderer.flush()

  while (++i < len) {
    ent = entities[i]
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
