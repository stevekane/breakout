let maxFromWidth  = (ratio, width) => width / ratio
let maxFromHeight = (ratio, height) => height * ratio

//:: => GLContext -> DOMElement -> World
function resizeView (gl, target, world) {
  let canvas      = gl.canvas
  let ratio       = world.ratio
  let maxWidth    = target.innerWidth
  let maxHeight   = target.innerHeight
  let targetRatio = maxWidth / maxHeight
  let useWidth    = ratio >= targetRatio
  let w           = useWidth ? maxWidth : maxFromHeight(ratio, maxHeight)
  let h           = useWidth ? maxFromWidth(ratio, maxWidth) : maxHeight

  canvas.width  = w
  canvas.height = h
  gl.viewport(0, 0, canvas.width, canvas.height)
}

module.exports.resizeView = resizeView
