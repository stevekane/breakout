let datGui = require("dat-gui")
let {LoadedProgram, clearContext} = require("./gl-utils")
let Loader = require("./Loader")
let {LoadStream, ImageAsset, SoundAsset} = require("./loaders")
let AudioSystem = require("./AudioSystem")

let raf         = window.requestAnimationFrame
let setInterval = window.setInterval

let audioSystem = new AudioSystem(["main", "bg"])
let {main, bg}  = audioSystem.channels
let canvas      = document.createElement("canvas")
let gui         = new datGui.GUI()

let gl = canvas.getContext("webgl")

let assets = {
  sounds: {
    background: "public/sounds/bgm1.mp3",
    hadouken:   "public/sounds/hadouken.mp3" 
  },
  textures: {
    paddle: "public/spritesheets/paddle.png" 
  },
  shaders: {
    baseF: "public/shaders/base.fragment",
    baseV: "public/shaders/base.vertex"
  }
}

//initial config
canvas.height = 600
canvas.width  = 400
bg.volume     = 0

let settings = {
  bgColor: [100, 0, 0, 1.0]
}

let testFns = {
  playHadouken: () => main.play(cache.sounds.hadouken)
}

let loader = new Loader

let cache = {
  sounds:   {},
  textures: {},
  shaders:  {},
  programs: {}
}

function makeUpdate () {
  return function update () {}
}

function makeRender (gl) {
  return function render () {
    clearContext(gl, settings.bgColor)
    raf(render) 
  }
}

let audioTab  = gui.addFolder("Audio")
let videoTab  = gui.addFolder("Video")
let actionTab = gui.addFolder("Actions")

audioTab.open()
videoTab.open()
actionTab.open()
audioTab.add(bg, "volume", [0.0, 0.5, 1.0])
audioTab.add(main, "volume", [0.0, 0.5, 1.0])
videoTab.add(gl.canvas, "width", 200, 400)
videoTab.add(gl.canvas, "height", 400, 600)
videoTab.addColor(settings, "bgColor")
actionTab.add(testFns, "playHadouken")

document.body.appendChild(canvas)

function startGame () {
  bg.loop(cache.sounds.background)
  raf(makeRender(gl))
  setInterval(makeUpdate(), 25)
}

loader.loadAssets(assets, (err, {sounds, textures, shaders}) => {
  cache.sounds   = sounds
  cache.shaders  = shaders
  cache.textures = textures
  cache.programs.base = new LoadedProgram(gl, shaders.basev, shaders.basec)
  startGame()
})
