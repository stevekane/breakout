module.exports = Scene

function Scene (name) {
  if (!name) throw new Error("Scene constructor requires a name")

  this.name = name
  this.game = null
}

Scene.prototype.setup = function (game, cb) {
  cb(null, null)  
}

Scene.prototype.update = function (game) {
  console.log("updating wow, really impressive")  
}
