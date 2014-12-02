let {clearContext} = require("./gl-utils")
let {loadSound, loadImage} = require("./loaders")
let AudioSystem = require("./audio")

let raf         = window.requestAnimationFrame
let setInterval = window.setInterval

let audioSystem = new AudioSystem
let canvas      = document.createElement("canvas")
let slider      = document.createElement("input")
let button      = document.createElement("button")

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
    bgColor: [0.3, 0.0, 0.0, 1.0]
  }
}

let cache = {
  sounds:  {},
  sprites: {}
}

//debugging/dev
window.audioSystem = audioSystem
window.settings    = settings

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

slider.type  = "range"
slider.min   = 0
slider.max   = 1
slider.step  = 0.1
slider.value = settings.audio.bgVolume
document.body.appendChild(slider)
document.body.appendChild(button)
document.body.appendChild(canvas)

slider.addEventListener("change", function (e) {
  console.log(this.value)
  settings.audio.bgVolume = this.value
})

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
