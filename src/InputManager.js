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
  //let queue         = new Int8Array(QUEUE_LENGTH *STATE_LENGTH)
  let states        = new Int8Array(KEY_COUNT * STATE_LENGTH)
  let handleKeyDown = ({keyCode}) => setState(states, keyCode, 1, 1, 0)
  let handleKeyUp   = ({keyCode}) => setState(states, keyCode, 0, 0, 1)

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

  for (var i = 0, len = this.states.length; i < len; i += STATE_LENGTH) {
    if (isDown(this.states, i))   this.downQueue.push(i)
    if (justDown(this.states, i)) this.justDownQueue.push(i)
    if (justUp(this.states, i))   this.justUpQueue.push(i)
    setJustDown(this.states, i, 0)
    setJustUp(this.states, i, 0)
  }    
  console.log(this.downQueue)
  console.log(this.justDownQueue)
  console.log(this.justUpQueue)
}
