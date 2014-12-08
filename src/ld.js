let {Paddle} = require("./assemblages")
let Loader     = require("./Loader")
let GLRenderer = require("./GLRenderer")
let canvas     = document.createElement("canvas")
let vertexSrc  = document.getElementById("vertex").text
let fragSrc    = document.getElementById("fragment").text

/*
 * Game
 *    Cache
 *    Renderer
 *    GUIRenderer?
 *    AudioSystem
 *    SceneManager
 *        [Scenes]
 *            World
 *              Entities
 *              Camera
 */

const UPDATE_INTERVAL = 25
const MAX_COUNT       = 1000

let loader       = new Loader()
let rendererOpts = { maxSpriteCount: MAX_COUNT }
let renderer     = new GLRenderer(canvas, vertexSrc, fragSrc, rendererOpts)
let assets       = {
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
