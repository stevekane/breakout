module.exports = InputManager

const STATE_LENGTH = 3
const KEY_COUNT    = 256
const QUEUE_LENGTH = 24

//[up/down, justDown, justUp]
let isDown      = (states, keyCode) => states[keyCode*STATE_LENGTH]
let justDown    = (states, keyCode) => states[keyCode*STATE_LENGTH+1]
let justUp      = (states, keyCode) => states[keyCode*STATE_LENGTH+2]
let setDown     = (states, keyCode, val) => states[keyCode*STATE_LENGTH] = val
let setJustDown = (states, keyCode, val) => states[keyCode*STATE_LENGTH+1] = val
let setJustUp   = (states, keyCode, val) => states[keyCode*STATE_LENGTH+2] = val
let setState    = (states, keyCode, isDown, justDown, justUp) => {
  states[keyCode*STATE_LENGTH]   = isDown
  states[keyCode*STATE_LENGTH+1] = justDown
  states[keyCode*STATE_LENGTH+2] = justUp
}

function InputManager (document) {
  let downQueue     = []
  let justDownQueue = []
  let justUpQueue   = []
  let states        = new Int8Array(KEY_COUNT * STATE_LENGTH)
  
  let handleKeyDown = ({keyCode}) => {
    let alreadyDown = isDown(states, keyCode)

    setDown(states, keyCode, 1)
    setJustDown(states, keyCode, 1)
  }

  let handleKeyUp = ({keyCode}) => {
    setDown(states, keyCode, 0)
    setJustUp(states, keyCode, 1)
  }

  this.states        = states
  this.downQueue     = downQueue
  this.justDownQueue = justDownQueue
  this.justUpQueue   = justUpQueue

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
}

InputManager.prototype.tick = function (dT) {
  this.downQueue     = []
  this.justDownQueue = []
  this.justUpQueue   = []

  for (var i = 0, len = this.states.length; i < len; ++i) {
    if (isDown(this.states, i))   this.downQueue.push(i)
    if (justDown(this.states, i)) this.justDownQueue.push(i)
    if (justUp(this.states, i))   this.justUpQueue.push(i)
    setJustDown(this.states, i, 0)
    setJustUp(this.states, i, 0)
  }    
}
