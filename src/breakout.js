let datGui = require("dat-gui")
let {clearContext} = require("./gl-utils")
let {LoadStream, ImageAsset, SoundAsset} = require("./loaders")
let AudioSystem = require("./audio")

let raf         = window.requestAnimationFrame
let setInterval = window.setInterval

let audioSystem = new AudioSystem(["main", "bg"])
let {main, bg}  = audioSystem.channels
let canvas      = document.createElement("canvas")
let gui         = new datGui.GUI()

//perhaps wrap this?
let gl = canvas.getContext("webgl")

let assets = {
  sounds: {
    background: "public/sounds/bgm1.mp3",
    hadouken:   "public/sounds/hadouken.mp3" 
  }
}

let settings = {
  audio: {
    bgVolume:   0.0,
    mainVolume: 1.0
  },
  video: {
    resolution: {
      width: 400,
      height: 600
    },
    bgColor: [100, 0, 0, 1.0]
  }
}

let testFns = {
  playHadouken: () => main.play(cache.sounds.hadouken)
}

let loadStream = new LoadStream
let cache = {
  sounds:  {},
  sprites: {}
}

function makeUpdate () {
  return function update () {
    bg.volume   = settings.audio.bgVolume
    main.volume = settings.audio.mainVolume
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

let audioTab  = gui.addFolder("Audio")
let videoTab  = gui.addFolder("Video")
let actionTab = gui.addFolder("Actions")

audioTab.open()
videoTab.open()
actionTab.open()
audioTab.add(settings.audio, "bgVolume", [0.0, 0.5, 1.0])
audioTab.add(settings.audio, "mainVolume", [0.0, 0.5, 1.0])
videoTab.add(settings.video.resolution, "width", 200, 400)
videoTab.add(settings.video.resolution, "height", 400, 600)
videoTab.addColor(settings.video, "bgColor")
actionTab.add(testFns, "playHadouken")

window.gui = gui
document.body.appendChild(canvas)

function startGame () {
  bg.loop(cache.sounds.background)
  raf(makeRender(gl))
  setInterval(makeUpdate(), 25)
}

loadStream.loadMany([
  new SoundAsset("background", "public/sounds/bgm1.mp3"),
  new SoundAsset("hadouken", "public/sounds/hadouken.mp3"),
])
loadStream.on("load", function (asset) {
  let key = null

  if (asset instanceof SoundAsset)      key = "sounds"
  else if (asset instanceof ImageAsset) key = "sprites"
  cache[key][asset.name] = asset.data
})
loadStream.on("error", function (asset) {
  console.log(asset.name + " failed to load")
})
loadStream.on("done", function () {
  startGame()
})
