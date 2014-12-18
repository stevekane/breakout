module.exports.checkType      = checkType
module.exports.checkValueType = checkValueType
module.exports.setBox         = setBox

const POINT_DIMENSION     = 2
const POINTS_PER_BOX      = 6
const BOX_LENGTH          = POINT_DIMENSION * POINTS_PER_BOX

function checkType (instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name)
}

function checkValueType (instance, ctor) {
  let keys = Object.keys(instance)

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor)
}

function setBox (boxArray, index, w, h, x, y) {
  let i  = BOX_LENGTH * index
  let x1 = x
  let y1 = y 
  let x2 = x + w
  let y2 = y + h

  boxArray[i]    = x1
  boxArray[i+1]  = y1
  boxArray[i+2]  = x1
  boxArray[i+3]  = y2
  boxArray[i+4]  = x2
  boxArray[i+5]  = y1

  boxArray[i+6]  = x1
  boxArray[i+7]  = y2
  boxArray[i+8]  = x2
  boxArray[i+9]  = y2
  boxArray[i+10] = x2
  boxArray[i+11] = y1
}
