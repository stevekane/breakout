let System = require("./System")

module.exports = RenderingSystem

function RenderingSystem () {
  System.call(this, ["physics", "renderable"])
}

//TODO: We need a reference to the scene that owns us!
//and by extension, if needed, we will have a reference
//to the game itself
RenderingSystem.prototype.run = function (entities) {
  let {renderer} = this.scene.game

  renderer.reset()
  entities.forEach(function (entity) {
    renderer.addSprite(//properties that it cares about) 
  })   
}
