let {checkType} = require("./utils")
let KeyboardManager = require("./KeyboardManager")

module.exports = InputManager

//TODO: could take mouseManager and gamepad manager?
function InputManager (keyboardManager) {
  checkType(keyboardManager, KeyboardManager)
  this.keyboardManager = keyboardManager 
}
