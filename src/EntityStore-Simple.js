let {hasKeys} = require("./functions")

module.exports = EntityStore

function EntityStore (max=1000) {
  this.entities  = []
  this.lastQuery = []
}

EntityStore.prototype.addEntity = function (e) {
  let id = this.entities.length

  this.entities.push(e)
  return id
}

EntityStore.prototype.query = function (componentNames) {
  let i = -1
  let entity

  this.lastQuery = []

  while (this.entities[++i]) {
    entity = this.entities[i]
    if (hasKeys(componentNames, entity)) this.lastQuery.push(entity)
  }
  return this.lastQuery
}
