let {Paddle, Block, Fighter} = require("./assemblages")
let PaddleMoverSystem       = require("./PaddleMoverSystem")
let RenderingSystem         = require("./RenderingSystem")
let KeyframeAnimationSystem = require("./KeyframeAnimationSystem")
let Scene                   = require("./Scene")

module.exports = TestScene

function TestScene () {
  let systems = [
    new PaddleMoverSystem, 
    new KeyframeAnimationSystem,
    new RenderingSystem
  ]

  Scene.call(this, "test", systems)
}

TestScene.prototype = Object.create(Scene.prototype)

TestScene.prototype.setup = function (cb) {
  let {cache, loader, entityStore, audioSystem} = this.game 
  let {bg} = audioSystem.channels
  let assets = {
    //sounds: { bgMusic: "/public/sounds/bgm1.mp3" },
    textures: { 
      paddle:  "/public/spritesheets/paddle.png",
      blocks:  "/public/spritesheets/blocks.png",
      fighter: "/public/spritesheets/punch.png"
    }
  }

  loader.loadAssets(assets, function (err, loadedAssets) {
    let {textures, sounds} = loadedAssets 

    cache.sounds   = sounds
    cache.textures = textures
    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 400, 400))
    entityStore.addEntity(new Block(textures.blocks, 44, 22, 800, 800))
    entityStore.addEntity(new Fighter(textures.fighter, 76, 59, 500, 500))
    //bg.volume = 0
    //bg.loop(cache.sounds.bgMusic)
    cb(null)
  })
}
