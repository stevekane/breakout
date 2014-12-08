let {Renderable, Physics} = require("./components")
let Entity = require("./Entity")

module.exports.Paddle = Paddle

function Paddle (image, w, h, x, y) {
  Entity.call(this)
  Renderable(this, w, h)
  Physics(this, w, h, x, y)
}
