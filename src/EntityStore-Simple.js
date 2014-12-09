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

EntityStore.prototype.query = function (components) {
  let i       = -1
  let j       = -1
  let include = false

  while (this.entities[++i]) {
    while (components[++j]) {
      include = this.entities[i][components[j]] ? true : false
    }
    if (include) this.lastQuery.push(this.entities[i])
    include = false
    j       = -1
  }
  return this.lastQuery
}
