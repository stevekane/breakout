let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

RenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game

  renderer.flush()
  renderer.addEntities(entities)
}
