let System = require("./System")

module.exports = PolygonRenderingSystem

function PolygonRenderingSystem () {
  System.call(this, ["physics", "polygon"])
}

PolygonRenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent

  renderer.flushPolygons()
  
  while (++ i < len) {
    ent = entities[i] 
    //TODO: vertices should be in local coords.  Need to translate to global
    renderer.addPolygon(ent.polygon.vertices, ent.polygon.indices, ent.polygon.vertexColors)
  }
}
