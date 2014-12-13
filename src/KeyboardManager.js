module.exports = KeyboardManager

const KEY_COUNT = 256

function KeyboardManager (document) {
  let isDowns       = new Uint8Array(KEY_COUNT)
  let justDowns     = new Uint8Array(KEY_COUNT)
  let justUps       = new Uint8Array(KEY_COUNT)
  let downDurations = new Uint32Array(KEY_COUNT)
  
  let handleKeyDown = ({keyCode}) => {
    justDowns[keyCode] = !isDowns[keyCode]
    isDowns[keyCode]   = true
  }

  let handleKeyUp = ({keyCode}) => {
    justUps[keyCode]   = true
    isDowns[keyCode]   = false
  }

  let handleBlur = () => {
    let i = -1

    while (++i < KEY_COUNT) {
      isDowns[i]   = 0
      justDowns[i] = 0
      justUps[i]   = 0
    }
  }

  this.isDowns       = isDowns
  this.justUps       = justUps
  this.justDowns     = justDowns
  this.downDurations = downDurations

  this.tick = (dT) => {
    let i = -1

    while (++i < KEY_COUNT) {
      justDowns[i] = false 
      justUps[i]   = false
      if (isDowns[i]) downDurations[i] += dT
      else            downDurations[i] = 0
    }
  }

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
  document.addEventListener("blur", handleBlur)
}
