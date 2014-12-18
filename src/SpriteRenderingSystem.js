let System  = require("./System")

module.exports = SpriteRenderingSystem

function SpriteRenderingSystem () {
  System.call(this, ["physics", "sprite"])
}

SpriteRenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent
  let frame

  renderer.flushSprites()

  while (++i < len) {
    ent   = entities[i]
    frame = ent.sprite.currentAnimation.frames[ent.sprite.currentAnimationIndex]

    renderer.addSprite(
      ent.sprite.image,
      ent.physics.width,
      ent.physics.height,
      ent.physics.x,
      ent.physics.y,
      frame.aabb.w / ent.sprite.image.width,
      frame.aabb.h / ent.sprite.image.height,
      frame.aabb.x / ent.sprite.image.width,
      frame.aabb.y / ent.sprite.image.height
    )
  }
}
