module.exports = Scene

function Scene (name, systems) {
  if (!name) throw new Error("Scene constructor requires a name")

  this.name    = name
  this.systems = systems
  this.game    = null
}

Scene.prototype.setup = function (cb) {
  cb(null, null)  
}

Scene.prototype.update = function (dT) {
  let store = this.game.entityStore
  let len   = this.systems.length
  let i     = -1
  let system

  while (++i < len) {
    system = this.systems[i] 
    system.run(this, store.query(system.componentNames))
  }
}
