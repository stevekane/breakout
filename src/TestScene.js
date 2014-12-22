let {Paddle, Block, Fighter, Water} = require("./assemblages")
let PaddleMoverSystem       = require("./PaddleMoverSystem")
let SpriteRenderingSystem   = require("./SpriteRenderingSystem")
let PolygonRenderingSystem  = require("./PolygonRenderingSystem")
let KeyframeAnimationSystem = require("./KeyframeAnimationSystem")
let Scene                   = require("./Scene")

module.exports = TestScene

function TestScene () {
  let systems = [
    new PaddleMoverSystem, 
    new KeyframeAnimationSystem,
    new PolygonRenderingSystem,
    new SpriteRenderingSystem,
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

    for (var i = 0; i < 20; ++i) {
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 100)) 
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 145)) 
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 190)) 
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 235)) 
      entityStore.addEntity(new Block(textures.blocks, 90, 45, 60 + 90 * i, 280)) 
    }

    entityStore.addEntity(new Paddle(textures.paddle, 112, 25, 600, 600))
    //entityStore.addEntity(new Fighter(textures.fighter, 76, 59, 500, 500))
    entityStore.addEntity(new Water(1920, 280, 0, 800, 100))
    //bg.volume = 0
    //bg.loop(cache.sounds.bgMusic)
    cb(null)
  })
}
