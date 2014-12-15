let AABB = require("./AABB")

function Frame (aabb, duration) {
  this.aabb     = aabb
  this.duration = duration
}

//rate is in ms.  This is the time per frame (42 ~ 24fps)
module.exports = function Animation (w, h, x, y, count, doesLoop, rate=42) {
  let frames = []
  let i      = -1
  let eachX
  let aabb

  while (++i < count) {
    eachX = x + count * w
    aabb  = new AABB(w, h, eachX, y)
    frames.push(new Frame(aabb, rate))
  }

  this.loop   = doesLoop
  this.rate   = rate
  this.frames = frames
}
