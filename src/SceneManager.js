let {findWhere} = require("./functions")

module.exports = SceneManager

function SceneManager (scenes=[]) {
  if (scenes.length <= 0) throw new Error("Must provide one or more scenes")

  let activeSceneIndex = 0
  let scenes           = scenes

  this.scenes      = scenes
  this.activeScene = scenes[activeSceneIndex]

  this.transitionTo = function (sceneName) {
    let scene = findWhere("name", sceneName, scenes)

    if (!scene) throw new Error(sceneName + " is not a valid scene name")

    activeSceneIndex = scenes.indexOf(scene)
    this.activeScene = scene
  }

  this.advance = function () {
    let scene = scenes[activeSceneIndex + 1]

    if (!scene) throw new Error("No more scenes!")

    this.activeScene = scenes[++activeSceneIndex]
  }
}
