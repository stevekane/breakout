let {checkType} = require("./utils")
let Loader       = require("./Loader")
let GLRenderer   = require("./GLRenderer")
let Cache        = require("./Cache")
let SceneManager = require("./SceneManager")

module.exports = Game

//:: Cache -> Loader -> GLRenderer -> SceneManager
function Game (cache, loader, renderer, sceneManager) {
  checkType(cache, Cache)
  checkType(loader, Loader)
  checkType(renderer, GLRenderer)
  checkType(sceneManager, SceneManager)

  this.cache        = cache 
  this.loader       = loader
  this.renderer     = renderer
  this.sceneManager = sceneManager
}

Game.prototype.start = function () {
  console.log(this.sceneManager.activeScene.name)
}

Game.prototype.stop = function () {
  //what does this even mean?
}
