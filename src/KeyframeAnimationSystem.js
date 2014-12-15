let System = require("./System")

module.exports = KeyframeAnimationSystem

function KeyframeAnimationSystem () {
  System.call(this, ["renderable", "animated"])
}

KeyframeAnimationSystem.prototype.run = function (scene, entities) {
  let dT  = scene.game.clock.dT
  let len = entities.length
  let i   = -1
  let ent
  let timeLeft
  let currentIndex
  let currentAnim
  let currentFrame
  let nextFrame
  let overshoot
  let shouldAdvance

  while (++i < len) {
    ent           = entities[i] 
    currentIndex  = ent.animated.currentAnimationIndex
    currentAnim   = ent.animated.currentAnimation
    currentFrame  = currentAnim.frames[currentIndex]
    nextFrame     = currentAnim.frames[currentIndex + 1] || currentAnim.frames[0]
    timeLeft      = ent.animated.timeTillNextFrame
    overshoot     = timeLeft - dT   
    shouldAdvance = overshoot <= 0
      
    if (shouldAdvance) {
      ent.animated.currentAnimationIndex = currentAnim.frames.indexOf(nextFrame)
      ent.animated.timeTillNextFrame     = nextFrame.duration + overshoot 
    } else {
      ent.animated.timeTillNextFrame = overshoot 
    }
  }
}
