module.exports = function Cache (keyNames) {
  if (!keyNames) throw new Error("Must provide some keyNames")
  for (var i = 0; i < keyNames.length; ++i) this[keyNames[i]] = {}
}
