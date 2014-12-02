function fetch (type, path, cb) {
  let xhr = new XMLHttpRequest

  xhr.responseType = type
  xhr.onload       = () => cb(null, xhr.response)
  xhr.onerror      = () => cb(new Error("Could not load " + path))
  xhr.open("GET", path, true)
  xhr.send(null)
}

function loadImage (path, cb) {
  let i = new Image

  i.onload  = () => cb(null, i)
  i.onerror = () => cb(new Error("Could not load " + path))
  i.src     = path
}

function loadSound (audioCtx, path, cb) {
  fetch("arraybuffer", path, function (err, binary) {
    if (err) return cb(err)

    let decodeSuccess = (buffer) => cb(null, buffer)
    let decodeFailure = cb

    audioCtx.decodeAudioData(binary, decodeSuccess, decodeFailure)
  })
}

module.exports.loadImage = loadImage
module.exports.loadSound = loadSound
module.exports.fetch     = fetch
