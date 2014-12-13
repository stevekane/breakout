module.exports = InputManager

const EVENT_SIZE   = 2
const KEY_COUNT    = 256
const QUEUE_LENGTH = 20
const KEYDOWN      = 0
const JUSTDOWN     = 1
const JUSTUP       = 2

function fill (value, array) {
  let len = array.length
  let i   = -1

  while (++i < len) array[i] = value
}

function EventQueue () {
  let queue = new Uint8Array(QUEUE_LENGTH * EVENT_SIZE)

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
  let states     = new Uint8Array(KEY_COUNT)
  let justDowns  = new Uint8Array(KEY_COUNT)
  let justUps    = new Uint8Array(KEY_COUNT)
  
  let handleKeyDown = ({keyCode}) => {
    if (!states[keyCode]) queueEvent(eventQueue, keyCode, JUSTDOWN)
    justDowns[keyCode] = !states[keyCode]
    states[keyCode]    = true
  }

  let handleKeyUp = ({keyCode}) => {
    queueEvent(eventQueue, keyCode, JUSTUP)
    justUps[keyCode]   = true
    justDowns[keyCode] = false
    states[keyCode]    = false
  }

  let handleBlur = () => {
    let i   = -1
    let len = states.length

    while (++i < KEY_COUNT) {
      states[i]    = 0
      justDowns[i] = 0
      justUps[i]   = 0
    }
  }

  Object.defineProperty(this, "eventQueue", {
    get () { return eventQueue } 
  })

  this.isJustDown = (keyCode) => justDowns[keyCode]
  this.isJustUp   = (keyCode) => justUps[keyCode]
  this.isDown     = (keyCode) => states[keyCode]

  this.tick = (dT) => {
    let i   = -1
    let len = states.length

    while (++i < len) if (states[i]) queueEvent(eventQueue, i, KEYDOWN)
  }

  this.flush = () => {
    let i   = -1
    let len = eventQueue.length

    //flip justDown and justUps bits to false
    fill(false, justDowns) 
    fill(false, justUps)
    
    //flush eventQueue
    while (++i < len) eventQueue[i] = 0
    eventQueue.index = QUEUE_LENGTH - 1
  }

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
  document.addEventListener("blur", handleBlur)
}
