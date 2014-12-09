module.exports = Scene

function Scene () {
  this.game = null //this reference will be set when a scene is activated
}

Scene.prototype.initialize = function (game) {
  this.game = game
}
