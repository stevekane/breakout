module.exports.Physics          = Physics
module.exports.PlayerControlled = PlayerControlled
module.exports.Sprite           = Sprite
module.exports.Polygon          = Polygon

function Sprite (e, width, height, image, currentAnimationName, animations) {
  e.sprite = {
    width,
    height,
    image,
    animations,
    currentAnimationName,
    currentAnimationIndex: 0,
    currentAnimation:      animations[currentAnimationName],
    timeTillNextFrame:     animations[currentAnimationName].frames[0].duration
  }
}

function Polygon (e, polygon) {
  e.polygon = polygon
}

function Physics (e, width, height, x, y) {
  e.physics = {
    width, 
    height, 
    x, 
    y, 
    dx:  0, 
    dy:  0, 
    ddx: 0, 
    ddy: 0
  }
  return e
}

function PlayerControlled (e) {
  e.playerControlled = true
}
