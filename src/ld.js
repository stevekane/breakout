let canvas     = document.createElement("canvas")
let gl         = canvas.getContext("webgl")
let vertexSrc  = document.getElementById("vertex").text
let fragSrc    = document.getElementById("fragment").text
let Loader     = require("./Loader")
let GLRenderer = require("./GLRenderer")
let {resizeView} = require("./view")

//:: => Int -> Int
function World (width, height) {
  let world = {width, height}

  Object.defineProperty(world, "ratio", {
    get() { return width/ height } 
  })
  return world
}

const MAX_COUNT = 1000

let world    = World(1920, 1080)
let loader   = new Loader()
let renderer = new GLRenderer(canvas, vertexSrc, fragSrc, MAX_COUNT)
let assets   = {
  textures: {
    maptiles: "/public/spritesheets/maptiles.png",
    paddle:   "/public/spritesheets/paddle.png"
  },
  sounds:  {},
  shaders: {} 
}

function makeAnimate () {
  return function animate () {
    renderer.render()
    requestAnimationFrame(animate)  
  }
}

function addSprites (renderer, count) {
  let width  = 112
  let height = 25
  let i      = -1
  let x, y

  while (++i < count) {
    x = Math.random() * 1920
    y = Math.random() * 1080
    renderer.addSprite(x, y, width, height) 
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loader.loadAssets(assets, function (err, results) {
    document.body.appendChild(canvas)
    renderer.addTexture(results.textures.paddle)
    addSprites(renderer, 400)
    resizeView(gl, window, world)
    requestAnimationFrame(makeAnimate())
    window.addEventListener("resize", function ({target}) {
      resizeView(gl, target, world)
    })
  })
})
