let AABB = require("./AABB")

module.exports = Animation

function Frame (aabb, duration) {
  this.aabb     = aabb
  this.duration = duration
}

//rate is in ms.  This is the time per frame (42 ~ 24fps)
function Animation (frames, doesLoop, rate=42) {
  this.loop   = doesLoop
  this.rate   = rate
  this.frames = frames
}

Animation.createLinear = function (w, h, x, y, count, doesLoop, rate=42) {
  let frames = []
  let i      = -1
  let eachX
  let aabb

  while (++i < count) {
    eachX = x + i * w
    aabb  = new AABB(w, h, eachX, y)
    frames.push(new Frame(aabb, rate))
  }

  return new Animation(frames, doesLoop, rate)
}
