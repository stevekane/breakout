let {Renderable, Physics, PlayerControlled} = require("./components")
let {Animated} = require("./components")
let Animation = require("./Animation")
let Entity    = require("./Entity")

module.exports.Paddle  = Paddle
module.exports.Block   = Block
module.exports.Fighter = Fighter

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
    idle: Animation.createLinear(44, 22, 0, 0, 3, true, 1000)
  })
}

function Fighter (image, w, h, x, y) {
  Entity.call(this)
  Renderable(this, image, w, h)
  Physics(this, w, h, x, y)
  Animated(this, "fireball", {
    fireball: Animation.createLinear(174, 134, 0, 0, 25, true)
  })
}
