let {checkType, checkValueType} = require("./utils")
let Scene = require("./Scene")

//:: => {Scenes} -> SceneManager
module.exports = function SceneManager (scenes={}) {
  checkValueType(scenes, Scene) 

  this.scenes = scenes    
}
