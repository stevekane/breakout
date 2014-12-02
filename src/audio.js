function AudioSystem () {
  this.actx     = new (AudioContext || webkitAudioContext)()
  this.bgGain   = this.actx.createGain()
  this.mainGain = this.actx.createGain()

  this.bgGain.connect(this.actx.destination)
  this.mainGain.connect(this.actx.destination)

  this.play = (buffer, loop) => {
    let bs = this.actx.createBufferSource()

    bs.loop   = loop || false
    bs.buffer = buffer
    bs.connect(this.mainGain)
    bs.start(0)
  }

  this.playBackground = (buffer, loop) => {
    let bs = this.actx.createBufferSource()

    bs.loop = loop || false
    bs.buffer = buffer
    bs.connect(this.bgGain)
    bs.start(0)
  }
}

module.exports = AudioSystem
