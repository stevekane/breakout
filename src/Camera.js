let {transpose, translate, create} = require("gl-mat3")

module.exports = Camera

function Camera (w, h, x, y) {
  let mat = create()

  this.x        = x
  this.y        = y
  this.w        = w
  this.h        = h
  this.rotation = 0
  this.scale    = 1

  //TODO: Start with only translation!
  Object.defineProperty(this, "matrix", {
    get() {
      mat[6] = -this.x
      mat[7] = -this.y
      return mat
    }
  })
}
