//:: => GLContext -> Buffer -> Int -> Int -> Float32Array
function updateBuffer (gl, buffer, loc, chunkSize, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, chunkSize, gl.FLOAT, false, 0, 0)
}

module.exports.updateBuffer = updateBuffer
