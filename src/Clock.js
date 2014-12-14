module.exports = Clock

function Clock (timeFn=Date.now) {
  this.oldTime = timeFn()
  this.newTime = timeFn()
  this.dT = 0
  this.tick = function () {
    this.oldTime = this.newTime
    this.newTime = timeFn()  
    this.dT      = this.newTime - this.oldTime
  }
}
