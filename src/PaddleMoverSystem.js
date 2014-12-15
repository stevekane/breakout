let System = require("./System")

module.exports = PaddleMoverSystem

function PaddleMoverSystem () {
  System.call(this, ["physics", "playerControlled"])
}

PaddleMoverSystem.prototype.run = function (scene, entities) {
  let {clock, inputManager} = scene.game
  let {keyboardManager} = inputManager
  let moveSpeed = 1
  let paddle    = entities[0]

  //can happen during loading for example
  if (!paddle) return

  if (keyboardManager.isDowns[37]) paddle.physics.x -= clock.dT * moveSpeed
  if (keyboardManager.isDowns[39]) paddle.physics.x += clock.dT * moveSpeed
}
