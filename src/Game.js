let {checkType} = require("./utils")
let Loader       = require("./Loader")
let GLRenderer   = require("./GLRenderer")
let Cache        = require("./Cache")
let EntityStore  = require("./EntityStore-Simple")
let SceneManager = require("./SceneManager")

module.exports = Game

//:: Cache -> Loader -> GLRenderer -> EntityStore -> SceneManager
function Game (cache, loader, renderer, entityStore, sceneManager) {
  checkType(cache, Cache)
  checkType(loader, Loader)
  checkType(renderer, GLRenderer)
  checkType(entityStore, EntityStore)
  checkType(sceneManager, SceneManager)

  this.cache        = cache 
  this.loader       = loader
  this.renderer     = renderer
  this.entityStore  = entityStore
  this.sceneManager = sceneManager

  //Introduce bi-directional reference to game object onto each scene
  for (var i = 0, len = this.sceneManager.scenes.length; i < len; ++i) {
    this.sceneManager.scenes[i].game = this
  }
}

Game.prototype.start = function () {
  let startScene = this.sceneManager.activeScene

  console.log("calling setup for " + startScene.name)
  startScene.setup((err) => console.log("setup completed"))
}

Game.prototype.stop = function () {
  //what does this even mean?
}
