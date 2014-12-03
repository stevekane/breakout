function Channel (context, name) {
  let channel = context.createGain()
  
  let connectPanner = function (src, panner, chan) {
    src.connect(panner)
    panner.connect(chan) 
  }

  let basePlay = function (options={}) {
    let shouldLoop = options.loop || false

    return function (buffer, panner) {
      let src = channel.context.createBufferSource() 

      if (panner) connectPanner(src, panner, channel)
      else        src.connect(channel)

      src.loop   = shouldLoop
      src.buffer = buffer
      src.start(0)
      return src
    } 
  }

  channel.connect(context.destination)

  Object.defineProperty(this, "volume", {
    enumerable: true,
    get() { return channel.gain.value },
    set(value) { channel.gain.value = value }
  })

  Object.defineProperty(this, "gain", {
    enumerable: true,
    get() { return channel }
  })

  this.name = name
  this.loop = basePlay({loop: true})
  this.play = basePlay()
}

function AudioSystem (channelNames) {
  let context  = new AudioContext
  let channels = {}
  let i        = -1

  while (channelNames[++i]) {
    channels[channelNames[i]] = new Channel(context, channelNames[i])
  }
  this.context  = context 
  this.channels = channels
}

module.exports = AudioSystem
