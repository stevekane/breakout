module.exports.findWhere = findWhere

//:: [{}] -> String -> Maybe A
function findWhere (key, property, arrayOfObjects) {
  let len   = arrayOfObjects.length
  let i     = -1
  let found = null

  while ( ++i < len && !found) {
    if (arrayOfObjects[i][key] === property) {
      found = arrayOfObjects[i]
    }
  }
  return found
}
