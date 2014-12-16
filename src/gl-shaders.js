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
    mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0); \
    vec2 fromWorldSize = a_position / u_worldSize; \
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

module.exports.polygonVertexShader = "\
  attribute vec2 a_vertex; \
  attribute vec4 a_vertexColor; \
  uniform vec2 u_worldSize; \
  varying vec4 v_vertexColor; \
  vec2 norm (vec2 position) { \
    return position * 2.0 - 1.0; \
  } \
  void main () { \
    mat2 clipSpace     = mat2(1.0, 0.0, 0.0, -1.0); \
    vec2 fromWorldSize = a_vertex / u_worldSize; \
    vec2 position      = clipSpace * norm(fromWorldSize); \
    \
    v_vertexColor = a_vertexColor; \
    gl_Position   = vec4(position, 0, 1); \
  }"

module.exports.polygonFragmentShader = "\
  precision highp float; \
  \
  varying vec4 v_vertexColor; \
  \
  void main() { \
    gl_FragColor = v_vertexColor; \
  }"
