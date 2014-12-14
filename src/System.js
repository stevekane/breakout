module.exports = System

function System (componentNames=[]) {
  this.componentNames = componentNames
}

//scene.game.clock
System.prototype.run = function (scene, entities) {
  //does something w/ the list of entities passed to it
}
