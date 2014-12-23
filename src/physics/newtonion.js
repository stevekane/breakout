module.exports.updateVelocity = updateVelocity
module.exports.updatePosition = updatePosition 

function updateVelocity (dT, physics) {
  physics.dx += (dT * physics.ddx) 
  physics.dy += (dT * physics.ddy) 
}

function updatePosition (dT, physics) {
  physics.x += (dT * physics.dx)
  physics.y += (dT * physics.dy)
}
