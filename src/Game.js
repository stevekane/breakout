let {checkType} = require("./utils")
let Loader       = require("./Loader")
let GLRenderer   = require("./GLRenderer")
let Cache        = require("./Cache")
let SceneManager = require("./SceneManager")

//:: Cache -> Loader -> GLRenderer -> SceneManager
module.exports = function Game (cache, loader, renderer, sceneManager) {
  checkType(cache, Cache)
  checkType(loader, Loader)
  checkType(renderer, GLRenderer)
  checkType(sceneManager, SceneManager)

  this.cache        = cache 
  this.loader       = loader
  this.renderer     = renderer
  this.sceneManager = sceneManager
}
