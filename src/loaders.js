let {EventEmitter} = require("events")

function Asset (name, path) {
  this.name = name
  this.path = path
  this.data = null
}

function ImageAsset (name, path) {
  Asset.call(this, name, path)
}

function SoundAsset (name, path) {
  Asset.call(this, name, path)
}

function LoadStream () {
  let audioCtx      = new (AudioContext || webkitAudioContext)()
  let inFlightCount = 0

  EventEmitter.call(this)

  let emitResult = (eventName, asset) => {
    inFlightCount--
    this.emit(eventName, asset)
    if (inFlightCount === 0) this.emit("done")
  }

  let loadImage = (asset) => {
    asset.data = new Image

    asset.data.onload  = () => emitResult("load", asset)
    asset.data.onerror = () => emitResult("error", asset)
    asset.data.src     = asset.path
  }

  let loadSound = (asset) => {
    fetch("arraybuffer", asset.path, function (err, binary) {
      if (err) return this.returnError(asset)

      let decodeSuccess = (buffer) => {
        asset.data = buffer 
        emitResult("load", asset)
      }
      let decodeFailure = (err) => {
        emitResult("error", asset) 
      }

      audioCtx.decodeAudioData(binary, decodeSuccess, decodeFailure)
    })
  }

  this.load = (asset) => {
    inFlightCount++
    if      (asset instanceof SoundAsset) loadSound(asset)
    else if (asset instanceof ImageAsset) loadImage(asset)
    else                                  throw new Error("invalid asset")
  }

  this.loadMany = (assets) => assets.forEach(this.load, this)
}

LoadStream.prototype = Object.create(EventEmitter.prototype)

function fetch (type, path, cb) {
  let xhr = new XMLHttpRequest

  xhr.responseType = type
  xhr.onload       = () => cb(null, xhr.response)
  xhr.onerror      = () => cb(new Error("Could not load " + path))
  xhr.open("GET", path, true)
  xhr.send(null)
}

module.exports.ImageAsset = ImageAsset
module.exports.SoundAsset = SoundAsset
module.exports.LoadStream = LoadStream
