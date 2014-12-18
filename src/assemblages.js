let {Physics, PlayerControlled} = require("./components")
let {Sprite, Polygon} = require("./components")
let Animation    = require("./Animation")
let Entity       = require("./Entity")
let WaterPolygon = require("./WaterPolygon")

module.exports.Paddle  = Paddle
module.exports.Block   = Block
module.exports.Fighter = Fighter
module.exports.Water   = Water

function Paddle (image, w, h, x, y) {
  Entity.call(this)
  Physics(this, w, h, x, y)
  PlayerControlled(this)
  Sprite(this, w, h, image, "idle", {
    idle: Animation.createSingle(112, 25, 0, 0)
  })
}

function Block (image, w, h, x, y) {
  Entity.call(this)
  Physics(this, w, h, x, y)
  Sprite(this, w, h, image, "idle", {
    idle: Animation.createLinear(44, 22, 0, 0, 3, true, 500)
  })
}

function Fighter (image, w, h, x, y) {
  Entity.call(this)
  Physics(this, w, h, x, y)
  Sprite(this, w, h, image, "fireball", {
    fireball: Animation.createLinear(174, 134, 0, 0, 25, true)
  })
}

function Water (w, h, x, y, sliceCount, topColor, bottomColor) {
  let topColor    = topColor || [0, 0, .5, .5]
  let bottomColor = bottomColor || [.7, .7, .8, .9]

  Entity.call(this)
  //TODO: Polygons should store local coordinates
  Physics(this, w, h, x, y)
  Polygon(this, WaterPolygon(w, h, x, y, sliceCount, topColor, bottomColor))
}
