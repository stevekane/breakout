module.exports = InputManager

const EVENT_SIZE   = 2
const KEY_COUNT    = 256
const QUEUE_LENGTH = 20
const KEYDOWN      = 0
const JUSTDOWN     = 1
const JUSTUP       = 2

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
    if (!states[keyCode]) queueEvent(eventQueue, keyCode, JUSTDOWN)
    states[keyCode] = 1
  }

  let handleKeyUp = ({keyCode}) => {
    queueEvent(eventQueue, keyCode, JUSTUP)
    states[keyCode] = 0
  }

  let handleBlur = () => {
    let i   = -1
    let len = states.length

    while (++i < KEY_COUNT) states[i] = 0
  }

  Object.defineProperty(this, "eventQueue", {
    get () { return eventQueue } 
  })

  this.tick = (dT) => {
    let i   = -1
    let len = states.length

    while (++i < len) if (states[i]) queueEvent(eventQueue, i, KEYDOWN)
  }

  this.flush = () => {
    let i   = -1
    let len = eventQueue.length

    while (++i < len) eventQueue[i] = 0
    eventQueue.index = QUEUE_LENGTH - 1
  }

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
  document.addEventListener("blur", handleBlur)
}
