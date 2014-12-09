module.exports.checkType      = checkType
module.exports.checkValueType = checkValueType

function checkType (instance, ctor) {
  if (!(instance instanceof ctor)) throw new Error("Must be of type " + ctor.name)
}

function checkValueType (instance, ctor) {
  let keys = Object.keys(instance)

  for (var i = 0; i < keys.length; ++i) checkType(instance[keys[i]], ctor)
}
