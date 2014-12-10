module.exports = System

function System (componentNames=[]) {
  this.componentNames = componentNames
}

System.prototype.run = function (entities) {
  //does something w/ the list of entities passed to it
}
