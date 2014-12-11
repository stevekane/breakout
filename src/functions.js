module.exports.findWhere = findWhere
module.exports.hasKeys   = hasKeys

//:: [{}] -> String -> Maybe A
function findWhere (key, property, arrayOfObjects) {
  let len   = arrayOfObjects.length
  let i     = -1
  let found = null

  while ( ++i < len ) {
    if (arrayOfObjects[i][key] === property) {
      found = arrayOfObjects[i]
      break
    }
  }
  return found
}

function hasKeys (keys, obj) {
  let i = -1
  
  while (keys[++i]) if (!obj[keys[i]]) return false
  return true
}
