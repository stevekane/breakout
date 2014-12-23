let {updateVelocity, updatePosition} = require("./physics/newtonion")
let System = require("./System")

module.exports = PhysicsSystem

function PhysicsSystem () {
  System.call(this, ["physics"])
}

PhysicsSystem.prototype.run = function (scene, entities) {
  let dT  = scene.game.clock.dT
  let len = entities.length
  let i   = -1 
  let ent

  while ( ++ i < len ) {
    ent = entities[i]
    updateVelocity(dT, ent.physics)
    updatePosition(dT, ent.physics)
  }
}
