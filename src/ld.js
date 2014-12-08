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

let world    = World(1920, 1080)
let loader   = new Loader()
let renderer = new GLRenderer(canvas, vertexSrc, fragSrc, 2)
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

document.addEventListener("DOMContentLoaded", function () {
  loader.loadAssets(assets, function (err, results) {
    document.body.appendChild(canvas)
    renderer.addTexture(results.textures.paddle)
    renderer.addSprite()
    resizeView(gl, window, world)
    requestAnimationFrame(makeAnimate())
    window.addEventListener("resize", function ({target}) {
      resizeView(gl, target, world)
    })
  })
})
