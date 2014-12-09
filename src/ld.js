let {Paddle} = require("./assemblages")
let {checkType} = require("./utils")
let Loader       = require("./Loader")
let GLRenderer   = require("./GLRenderer")
let Cache        = require("./Cache")
let SceneManager = require("./SceneManager")
let Scene        = require("./Scene")
let Game         = require("./Game")
let canvas       = document.createElement("canvas")
let vertexSrc    = document.getElementById("vertex").text
let fragSrc      = document.getElementById("fragment").text

const UPDATE_INTERVAL = 25
const MAX_COUNT       = 1000

/*
 * OOP techniques for modeling the major systems in the game
 * OOP techniques for modeling the game heirarchy
 * Data for modeling the entities/components
 */

let rendererOpts = { maxSpriteCount: MAX_COUNT }
let cache        = new Cache(["sounds", "textures"])
let loader       = new Loader
let renderer     = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts)
let sceneManager = new SceneManager([
  new Scene("main"),
  new Scene("menu"),
  new Scene("level1")
])
let game         = new Game(cache, loader, renderer, sceneManager)

window.game = game        
        
//TODO: move into scene constructor or file or something...
let assets = {
  textures: {
    maptiles: "/public/spritesheets/maptiles.png",
    paddle:   "/public/spritesheets/paddle.png"
  },
  sounds:  {},
  shaders: {} 
}

function makeUpdate () {
  return function update () {}
}

function makeAnimate () {
  return function animate () {
    renderer.render()
    requestAnimationFrame(animate)  
  }
}

function startGame () {
  loader.loadAssets(assets, function (err, results) {
    setInterval(makeUpdate(), UPDATE_INTERVAL)
    requestAnimationFrame(makeAnimate())
  })
}

function setupDocument (canvas, document, window) {
  document.body.appendChild(canvas)
  renderer.resize(window.innerWidth, window.innerHeight)
  window.addEventListener("resize", function () {
    renderer.resize(window.innerWidth, window.innerHeight)
  })
}

document.addEventListener("DOMContentLoaded", function () {
  setupDocument(canvas, document, window)
  startGame()
})
