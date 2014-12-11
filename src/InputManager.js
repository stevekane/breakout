module.exports = InputManager

const EVENT_SIZE   = 2
const KEY_COUNT    = 256
const QUEUE_LENGTH = 10
const KEYDOWN      = 0
const JUSTDOWN     = 1
const JUSTUP       = 2

//[up/down, justDown, justUp]
let isDown  = (states, keyCode) => states[keyCode]
let setDown = (states, keyCode, val) => states[keyCode] = val

function EventQueue () {
  let queue = new Int8Array(QUEUE_LENGTH * EVENT_SIZE)

  queue.index = QUEUE_LENGTH - 1
  return queue
}

//type is ENUM see above for defs
function queueEvent (queue, keyCode, type) {
  queue[queue.index*2]   = keyCode
  queue[queue.index*2+1] = type
  queue.index--
}

function InputManager (document) {
  let eventQueue = new EventQueue
  let states     = new Int8Array(KEY_COUNT)
  
  let handleKeyDown = ({keyCode}) => {
    if (!isDown(states, keyCode)) queueEvent(eventQueue, keyCode, JUSTDOWN)
    setDown(states, keyCode, 1)
  }

  let handleKeyUp = ({keyCode}) => {
    setDown(states, keyCode, 0)
    queueEvent(eventQueue, keyCode, JUSTUP)
  }

  Object.defineProperty(this, "eventQueue", {
    get () { return eventQueue } 
  })

  this.tick = (dT) => {
    for (var i = 0, len = states.length; i < len; ++i) {
      if (isDown(states, i)) queueEvent(eventQueue, i, KEYDOWN)
    }    
  }

  this.flush = () => {
    let i   = -1
    let len = eventQueue.length

    while (++i < len) eventQueue[i] = 0
    eventQueue.index = QUEUE_LENGTH - 1
  }

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
}
