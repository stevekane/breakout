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
  //if (keyboardManager.isDowns[37]) paddle.physics.x -= clock.dT * moveSpeed
  //if (keyboardManager.isDowns[39]) paddle.physics.x += clock.dT * moveSpeed
  if (paddle.physics.x < 100)  {
    paddle.physics.dx = 1
  } else if (paddle.physics.x >= 800) {
    paddle.physics.dx = -1
  } else {
    paddle.physics.dx = paddle.physics.dx || 1
  }
  paddle.physics.x += clock.dT * moveSpeed * paddle.physics.dx
}
