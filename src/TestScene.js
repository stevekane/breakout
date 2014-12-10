let {Paddle} = require("./assemblages")
let Scene = require("./Scene")

module.exports = TestScene

function TestScene () {
  Scene.call(this, "test")
}

TestScene.prototype = Object.create(Scene.prototype)

TestScene.prototype.setup = function (cb) {
  let {cache, loader, entityStore} = this.game 
  let assets = {
    textures: { paddle: "/public/spritesheets/paddle.png" },
  }

  loader.loadAssets(assets, function (err, loadedAssets) {
    let {textures, sounds} = loadedAssets 

    cache.sounds   = sounds
    cache.textures = textures
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400))
    cb(null)
  })
}
