module.exports.Renderable       = Renderable
module.exports.Physics          = Physics
module.exports.PlayerControlled = PlayerControlled
module.exports.Animated         = Animated

function Renderable (e, image, width, height) {
  e.renderable = {
    image,
    width,
    height,
    rotation: 0,
    center: {
      x: width / 2,
      y: height / 2 
    },
    scale: {
      x: 1,
      y: 1 
    }
  } 
  return e
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

function Animated (e, defaultAnimationName, animHash) {
  e.animated = {
    animations:            animHash,
    currentAnimationName:  defaultAnimationName,
    currentAnimationIndex: 0,
    currentAnimation:      animHash[defaultAnimationName],
    timeTillNextFrame:     animHash[defaultAnimationName].frames[0].duration
  } 
}
