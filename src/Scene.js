module.exports = Scene

/* GAME
 *    RENDERER
 *    AUDIO THING
 *    INPUT THING
 *    ASSET LOADER
 *    ASSET CACHE
 *    ENTITY STORE -- at simplest, this is an array of entities
 *    SCENEMANAGER
 *      [SCENES]  -- analogs to programs.  One program executes at a time
 *        SYSTEMS
 */

function Scene (name, systems) {
  if (!name) throw new Error("Scene constructor requires a name")

  this.name    = name
  this.systems = systems
  this.game    = null
}

Scene.prototype.setup = function (cb) {
  cb(null, null)  
}

Scene.prototype.update = function () {
  let store = this.game.entityStore
  let len   = this.systems.length
  let i     = -1
  let system

  while (++i < len) {
    system = this.systems[i] 
    system.run(store.query(system.componentNames))
  }
}
