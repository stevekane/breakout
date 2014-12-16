module.exports.spriteVertexShader = " \
  precision highp float; \
  \
  attribute vec2 a_position; \
  attribute vec2 a_texCoord; \
  \
  uniform vec2 u_worldSize; \
  \
  varying vec2 v_texCoord; \
  \
  vec2 norm (vec2 position) { \
    return position * 2.0 - 1.0; \
  } \
  \
  void main() { \
    vec3 pos           = vec3(a_position, 1.0); \
    vec2 rotated       = pos.xy; \
    mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0); \
    vec2 fromWorldSize = rotated / u_worldSize; \
    vec2 position      = clipSpace * norm(fromWorldSize); \
    \
    v_texCoord  = a_texCoord; \
    gl_Position = vec4(position, 0, 1); \
  }"

module.exports.spriteFragmentShader = "\
  precision highp float; \
  \
  uniform sampler2D u_image; \
  \
  varying vec2 v_texCoord; \
  \
  void main() { \
  gl_FragColor = texture2D(u_image, v_texCoord); \
  }"
