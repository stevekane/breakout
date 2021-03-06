let Camera          = require("./Camera")
let Loader          = require("./Loader")
let GLRenderer      = require("./GLRenderer")
let EntityStore     = require("./EntityStore-Simple")
let Clock           = require("./Clock")
let Cache           = require("./Cache")
let SceneManager    = require("./SceneManager")
let TestScene       = require("./TestScene")
let Game            = require("./Game")
let World           = require("./World")
let InputManager    = require("./InputManager")
let KeyboardManager = require("./KeyboardManager")
let AudioSystem     = require("./AudioSystem")
let canvas          = document.createElement("canvas")

const UPDATE_INTERVAL = 25
const MAX_COUNT       = 1000

let keyboardManager = new KeyboardManager(document)
let inputManager    = new InputManager(keyboardManager)
let entityStore     = new EntityStore
let clock           = new Clock(Date.now)
let cache           = new Cache(["sounds", "textures"])
let loader          = new Loader
let renderer        = new GLRenderer(canvas, 1920, 1080)
let audioSystem     = new AudioSystem(["main", "bg"])
let sceneManager    = new SceneManager([new TestScene])
let game            = new Game(clock, cache, loader, inputManager,
                               renderer, audioSystem, entityStore, 
                               sceneManager)

function makeUpdate (game) {
  let store          = game.entityStore
  let clock          = game.clock
  let inputManager   = game.inputManager
  let componentNames = ["renderable", "physics"]

  return function update () {
    clock.tick()
    inputManager.keyboardManager.tick(clock.dT)
    game.sceneManager.activeScene.update(clock.dT)
  }
}

let w = new World(1920, 1080)
let c = new Camera(1920, 1080, 0, 0)

function makeAnimate (game) {
  return function animate () {
    game.renderer.render(w.width, w.height, c.matrix)
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
