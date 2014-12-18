module.exports = PolygonRenderingSystem

function PolygonRenderingSystem () {
  System.call(this, ["physics", "polygon"])
}

PolygonRenderingSystem.prototype.run = function (scene, entities) {
  let {renderer} = scene.game
  let len = entities.length
  let i   = -1
  let ent

  //add polygons to the renderer
  while (++ i < len) {
    ent = entities[i] 
    //TODO: vertices should be in local coords.  Need to translate to global
    renderer.addPolygon(ent.sprite.vertices, ent.sprite.indices, ent.sprite.vertexColors)
  }
}
