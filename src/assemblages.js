let {Renderable, Physics, PlayerControlled} = require("./components")
let {Animated} = require("./components")
let Animation = require("./Animation")
let Entity    = require("./Entity")

module.exports.Paddle = Paddle
module.exports.Block  = Block

function Paddle (image, w, h, x, y) {
  Entity.call(this)
  Renderable(this, image, w, h)
  Physics(this, w, h, x, y)
  PlayerControlled(this)
}

function Block (image, w, h, x, y) {
  Entity.call(this)
  Renderable(this, image, w, h)
  Physics(this, w, h, x, y)
  Animated(this, "idle", {
    idle: new Animation(44, 22, 0, 0, 3, true, 1000)
  })
}
