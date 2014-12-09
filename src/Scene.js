module.exports = Scene

function Scene (name) {
  if (!name) throw new Error("Scene constructor requires a name")

  this.name = name
  this.game = null
}

Scene.prototype.initialize = function (game) {
  this.game = game
}
