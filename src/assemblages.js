let {Renderable, Physics, PlayerControlled} = require("./components")
let Entity = require("./Entity")

module.exports.Paddle = Paddle

function Paddle (image, w, h, x, y) {
  Entity.call(this)
  Renderable(this, image, w, h)
  Physics(this, w, h, x, y)
  PlayerControlled(this)
}
