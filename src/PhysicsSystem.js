let System = require("./System")

module.exports = PhysicsSystem

function PhysicsSystem () {
  System.call(this, ["physics"])
}

function updateVelocity (dT, entity) {
  entity.physics.dx += (dT * entity.physics.ddx)
  entity.physics.dy += (dT * entity.physics.ddy)
}

function updatePosition (dT, entity) {
  entity.physics.x += (dT * entity.physics.dx)
  entity.physics.y += (dT * entity.physics.dy)
}

function checkGround (maxY, ent) {
  if (ent.physics.y >= maxY) {
    ent.physics.ddy = 0 
    ent.physics.dy  = 0 
    ent.physics.y   = maxY
  }
}

PhysicsSystem.prototype.run = function (scene, entities) {
  let dT  = scene.game.clock.dT
  let len = entities.length
  let i   = -1 
  let ent

  while ( ++ i < len ) {
    ent = entities[i]
    updateVelocity(dT, ent)
    updatePosition(dT, ent)
    checkGround(1045, ent)
  }
}
