let {checkType} = require("./utils")
let InputManager = require("./InputManager")
let Clock        = require("./Clock")
let Loader       = require("./Loader")
let GLRenderer   = require("./GLRenderer")
let AudioSystem  = require("./AudioSystem")
let Cache        = require("./Cache")
let EntityStore  = require("./EntityStore-Simple")
let SceneManager = require("./SceneManager")

module.exports = Game

//:: Clock -> Cache -> Loader -> GLRenderer -> AudioSystem -> EntityStore -> SceneManager
function Game (clock, cache, loader, inputManager, renderer, audioSystem, 
               entityStore, sceneManager) {
  checkType(clock, Clock)
  checkType(cache, Cache)
  checkType(inputManager, InputManager)
  checkType(loader, Loader)
  checkType(renderer, GLRenderer)
  checkType(audioSystem, AudioSystem)
  checkType(entityStore, EntityStore)
  checkType(sceneManager, SceneManager)

  this.clock        = clock
  this.cache        = cache 
  this.loader       = loader
  this.inputManager = inputManager
  this.renderer     = renderer
  this.audioSystem  = audioSystem
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
