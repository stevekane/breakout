let Loader          = require("./Loader")
let GLRenderer      = require("./GLRenderer")
let EntityStore     = require("./EntityStore-Simple")
let Cache           = require("./Cache")
let SceneManager    = require("./SceneManager")
let Scene           = require("./Scene")
let TestScene       = require("./TestScene")
let Game            = require("./Game")
let KeyboardManager = require("./KeyboardManager")
let AudioSystem     = require("./AudioSystem")
let canvas          = document.createElement("canvas")
let vertexSrc       = document.getElementById("vertex").text
let fragSrc         = document.getElementById("fragment").text

//TESTING FOR INPUT MANAGER
let kbManager = new KeyboardManager(document)

window.kbManager = kbManager

const UPDATE_INTERVAL = 25
const MAX_COUNT       = 1000

let rendererOpts = { maxSpriteCount: MAX_COUNT }
let entityStore  = new EntityStore
let cache        = new Cache(["sounds", "textures"])
let loader       = new Loader
let renderer     = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts)
let audioSystem  = new AudioSystem(["main", "bg"])
let sceneManager = new SceneManager([new TestScene])
let game         = new Game(cache, loader, renderer, audioSystem, entityStore, sceneManager)

function makeUpdate (game) {
  let store   = game.entityStore
  let newTime = Date.now()
  let oldTime = newTime
  let dT      = newTime - oldTime
  let componentNames = ["renderable", "physics"]

  return function update () {
    let moveSpeed = 1
    let paddle    = store.query(componentNames)[0]

    oldTime = newTime
    newTime = Date.now()
    dT      = newTime - oldTime

    if (kbManager.isDowns[37]) paddle.physics.x -= dT * moveSpeed
    if (kbManager.isDowns[39]) paddle.physics.x += dT * moveSpeed
    kbManager.tick(dT)
    game.sceneManager.activeScene.update()
  }
}

function makeAnimate (game) {
  let store          = game.entityStore
  let r              = game.renderer
  let componentNames = ["renderable", "physics"]

  return function animate () {
    let renderables = store.query(componentNames)

    r.render(renderables)
    requestAnimationFrame(animate)  
  }
}

window.game = game

function setupDocument (canvas, document, window) {
  document.body.appendChild(canvas)
  renderer.resize(window.innerWidth, window.innerHeight)
  window.addEventListener("resize", function () {
    renderer.resize(window.innerWidth, window.innerHeight)
  })
}

document.addEventListener("DOMContentLoaded", function () {
  setupDocument(canvas, document, window)
  game.start()
  requestAnimationFrame(makeAnimate(game))
  setInterval(makeUpdate(game), UPDATE_INTERVAL)
})
