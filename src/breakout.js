let datGui = require("dat-gui")
let {clearContext} = require("./gl-utils")
let {loadSound, loadImage} = require("./loaders")
let AudioSystem = require("./audio")

let raf         = window.requestAnimationFrame
let setInterval = window.setInterval

let audioSystem = new AudioSystem
let canvas      = document.createElement("canvas")
let button      = document.createElement("button")
let gui         = new datGui.GUI()

//perhaps wrap this?
let gl = canvas.getContext("webgl")

let settings = {
  audio: {
    bgVolume: 1.0,
    mainVolume:    1.0
  },
  video: {
    resolution: {
      width: 400,
      height: 600
    },
    bgColor: {r: 0.3, g: 0.0, b: 0.0, a: 1.0}
  }
}

let cache = {
  sounds:  {},
  sprites: {}
}

function makeUpdate () {
  return function update () {
    audioSystem.bgGain.gain.value   = settings.audio.bgVolume
    audioSystem.mainGain.gain.value = settings.audio.mainVolume
  }
}

function makeRender (gl) {
  return function render () {
    gl.canvas.width  = settings.video.resolution.width
    gl.canvas.height = settings.video.resolution.height

    clearContext(gl, settings.video.bgColor)
    raf(render) 
  }
}

gui.add(settings.audio, "bgVolume", 0, 1)
gui.add(settings.audio, "mainVolume", 0, 1)
gui.add(settings.video.resolution, "width", 200, 400)
gui.add(settings.video.resolution, "height", 400, 600)
gui.add(settings.video.bgColor, "r", 0, 1)
gui.add(settings.video.bgColor, "g", 0, 1)
gui.add(settings.video.bgColor, "b", 0, 1)
gui.add(settings.video.bgColor, "a", 0, 1)
document.body.appendChild(canvas)
document.body.appendChild(button)

button.addEventListener("click", function (e) {
  audioSystem.play(cache.hadouken)
})

raf(makeRender(gl))
setInterval(makeUpdate(), 25)

loadSound(audioSystem.actx, "public/sounds/bgm1.mp3", function (err, buffer) {
  cache.bgm1 = buffer
  audioSystem.playBackground(cache.bgm1, true)
})

loadSound(audioSystem.actx, "public/sounds/hadouken.mp3", function (err, buffer) {
  cache.hadouken = buffer
})
