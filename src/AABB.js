module.exports = function AABB (w, h, x, y) {
  this.x = x
  this.y = y
  this.w = w
  this.h = h

  Object.defineProperty(this, "ulx", {
    get() { return x } 
  })
  Object.defineProperty(this, "uly", {
    get() { return y } 
  })
  Object.defineProperty(this, "lrx", {
    get() { return x + w }
  })
  Object.defineProperty(this, "lry", {
    get() { return y + h }
  })
}
