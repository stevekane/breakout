function Loader () {
  let audioCtx = new AudioContext

  let loadXHR = (type) => {
    return function (path, cb) {
      if (!path) return cb(new Error("No path provided"))

      let xhr = new XMLHttpRequest 

      xhr.responseType = type
      xhr.onload       = () => cb(null, xhr.response)
      xhr.onerror      = () => cb(new Error("Could not load " + path))
      xhr.open("GET", path, true)
      xhr.send(null)
    } 
  }

  let loadBuffer = loadXHR("arraybuffer")
  let loadString = loadXHR("string")

  this.loadShader = loadString

  this.loadTexture = (path, cb) => {
    let i       = new Image
    let onload  = () => cb(null, i)
    let onerror = () => cb(new Error("Could not load " + path))
    
    i.onload  = onload
    i.onerror = onerror
    i.src     = path
  }

  this.loadSound = (path, cb) => {
    loadBuffer(path, (err, binary) => {
      let decodeSuccess = (buffer) => cb(null, buffer)   
      let decodeFailure = cb

      audioCtx.decodeAudioData(binary, decodeSuccess, decodeFailure)
    }) 
  }

  this.loadAssets = ({sounds, textures, shaders}, cb) => {
    let soundKeys    = Object.keys(sounds || {})
    let textureKeys  = Object.keys(textures || {})
    let shaderKeys   = Object.keys(shaders || {})
    let soundCount   = soundKeys.length
    let textureCount = textureKeys.length
    let shaderCount  = shaderKeys.length
    let i            = -1
    let j            = -1
    let k            = -1
    let out          = {
      sounds:{}, textures: {}, shaders: {} 
    }

    let checkDone = () => {
      if (soundCount <= 0 && textureCount <= 0 && shaderCount <= 0) cb(null, out) 
    }

    let registerSound = (name, data) => {
      soundCount--
      out.sounds[name] = data
      checkDone()
    }

    let registerTexture = (name, data) => {
      textureCount--
      out.textures[name] = data
      checkDone()
    }

    let registerShader = (name, data) => {
      shaderCount--
      out.shaders[name] = data
      checkDone()
    }

    while (soundKeys[++i]) {
      let key = soundKeys[i]

      this.loadSound(sounds[key], (err, data) => {
        registerSound(key, data)
      })
    }
    while (textureKeys[++j]) {
      let key = textureKeys[j]

      this.loadTexture(textures[key], (err, data) => {
        registerTexture(key, data)
      })
    }
    while (shaderKeys[++k]) {
      let key = shaderKeys[k]

      this.loadShader(shaders[key], (err, data) => {
        registerShader(key, data)
      })
    }
  }
}

module.exports = Loader
