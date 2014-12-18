let System = require("./System")

module.exports = KeyframeAnimationSystem

function KeyframeAnimationSystem () {
  System.call(this, ["sprite"])
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
    currentIndex  = ent.sprite.currentAnimationIndex
    currentAnim   = ent.sprite.currentAnimation
    currentFrame  = currentAnim.frames[currentIndex]
    nextFrame     = currentAnim.frames[currentIndex + 1] || currentAnim.frames[0]
    timeLeft      = ent.sprite.timeTillNextFrame
    overshoot     = timeLeft - dT   
    shouldAdvance = overshoot <= 0
      
    if (shouldAdvance) {
      ent.sprite.currentAnimationIndex = currentAnim.frames.indexOf(nextFrame)
      ent.sprite.timeTillNextFrame     = nextFrame.duration + overshoot 
    } else {
      ent.sprite.timeTillNextFrame = overshoot 
    }
  }
}
