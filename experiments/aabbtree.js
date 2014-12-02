let {max, min, abs} = Math

const FloatArray = Float32Array || Array

let isDefined = (val) => val !== undefined && val !== null

//calculate bounding box containing two bounding boxes
//function boundBoth (outBox, w1, h1, x1, y1, w2, h2, x2, y2) {
//  let maxX   = max(x1 + w1, x2 + w2)
//  let minX   = min(x1, x2)
//  let maxY   = max(y1 + h1, y2 + h2)
//  let minY   = min(y1, y2)
//  let width  = maxX - minX
//  let height = maxY - minY
//
//  outBox[0] = width
//  outBox[1] = height
//  outBox[2] = maxX - width
//  outBox[3] = maxY - height
//
//  return outBox
//}

//sets box parameters by bounding the AABBs found at index1 and index2
function boundBoth (nodes, outIndex, index1, index2) {
  let w1     = nodes[index1]
  let h1     = nodes[index1+1]
  let x1     = nodes[index1+2]
  let y1     = nodes[index1+3]

  let w2     = nodes[index2]
  let h2     = nodes[index2+1]
  let x2     = nodes[index2+2]
  let y2     = nodes[index2+3]

  let maxX   = max(x1 + w1, x2 + w2)
  let minX   = min(x1, x2)
  let maxY   = max(y1 + h1, y2 + h2)
  let minY   = min(y1, y2)
  let width  = maxX - minX
  let height = maxY - minY

  nodes[outIndex]   = width
  nodes[outIndex+1] = height
  nodes[outIndex+2] = maxX - width
  nodes[outIndex+3] = maxY - height
}

//write a branch node at a certain index
function writeBranch (arr, index, aabb, parent, left, right, height) {
  if (!isDefined(left))  throw new Error("branch must have left branch index")
  if (!isDefined(right)) throw new Error("branch must have right branch index")

  arr[index]   = aabb.width 
  arr[index+1] = aabb.height
  arr[index+2] = aabb.x
  arr[index+3] = aabb.y
  arr[index+4] = parent || -1
  arr[index+5] = left
  arr[index+6] = right
  arr[index+7] = height
  arr[index+8] = -1
}

//write a leaf node at a certain index
function writeLeaf (arr, index, aabb, parent, height, id) {
  if (!isDefined(parent)) throw new Error("leaf must have parent")
  if (!isDefined(id))     throw new Error("leaf must have id")

  arr[index]   = aabb.width 
  arr[index+1] = aabb.height
  arr[index+2] = aabb.x
  arr[index+3] = aabb.y
  arr[index+4] = parent
  arr[index+5] = -1
  arr[index+6] = -1
  arr[index+7] = height
  arr[index+8] = id
}

/*
 * Indices of values in node:
 * [w, h, x, y, parent, left, right, height, id]
 *
 * w,h,x,y     - params of fat aabb for this node
 * parent      - index of parent node or -1
 * left, right - indices of child nodes or -1
 * height      - height within the tree, used for balancing
 * id          - index into the boxes array where actual user data is kept
 */
//wraps Float array creation with initialization
function NodesArray (COUNT) {
  let NODE_SIZE = 9
  let ar        = new FloatArray(COUNT * NODE_SIZE)
  let i         = -1
  let len       = ar.length

  //human-readable "getters"
  ar.getWidth  = (index) => ar[index]
  ar.getHeight = (index) => ar[index+1]
  ar.getX      = (index) => ar[index+2]
  ar.getY      = (index) => ar[index+3]
  ar.getParent = (index) => ar[index+4]
  ar.getLeft   = (index) => ar[index+5]
  ar.getRight  = (index) => ar[index+6]
  ar.getHeight = (index) => ar[index+7]
  ar.getId     = (index) => ar[index+8]

  //human-readable "setters"
  ar.setWidth  = (index, val) => ar[index]   = val
  ar.setHeight = (index, val) => ar[index+1] = val  
  ar.setX      = (index, val) => ar[index+2] = val
  ar.setY      = (index, val) => ar[index+3] = val
  ar.setParent = (index, val) => ar[index+4] = val
  ar.setLeft   = (index, val) => ar[index+5] = val
  ar.setRight  = (index, val) => ar[index+6] = val
  ar.setHeight = (index, val) => ar[index+7] = val
  ar.setId     = (index, val) => ar[index+8] = val

  while (++i < len) ar[i] = -1
  return ar
}

//human-readable "getters"
let getWidth  = (nodes, index) => [index]
let getHeight = (nodes, index) => [index+1]
let getX      = (nodes, index) => [index+2]
let getY      = (nodes, index) => [index+3]
let getParent = (nodes, index) => [index+4]
let getLeft   = (nodes, index) => [index+5]
let getRight  = (nodes, index) => [index+6]
let getHeight = (nodes, index) => [index+7]
let getId     = (nodes, index) => [index+8]

//human-readable "setters"
let setWidth  = (nodes, index, val) => nodes[index]   = val
let setHeight = (nodes, index, val) => nodes[index+1] = val  
let setX      = (nodes, index, val) => nodes[index+2] = val
let setY      = (nodes, index, val) => nodes[index+3] = val
let setParent = (nodes, index, val) => nodes[index+4] = val
let setLeft   = (nodes, index, val) => nodes[index+5] = val
let setRight  = (nodes, index, val) => nodes[index+6] = val
let setHeight = (nodes, index, val) => nodes[index+7] = val
let setId     = (nodes, index, val) => nodes[index+8] = val
let setBox    = (nodes, index, w, h, x, y) => {
  nodes[index]   = w
  nodes[index+1] = h
  nodes[index+2] = x
  nodes[index+3] = y
}

function AABBTree (MAX_NODES) {
  this.MAX_NODES  = MAX_NODES || 2
  this.nodes      = new NodesArray(this.MAX_NODES)
  this.collisions = []
  this.boxes      = []
  this.root       = null

  this.sync = function (index) {
    let nodes = this.nodes
    let leftIndex, rightIndex, newHeight

    while (index !== null) {
      leftIndex  = getLeft(nodes, index)
      rightIndex = getRight(nodes, index)
      newHeight  = 1 + max(getHeight(nodes, leftIndex), getHeight(nodes, rightIndex))

      boundBoth(index, leftIndex, rightIndex)
      setHeight(nodes, index, newHeight)
      index = getParent(nodes, index)
    }
  }
}

module.exports = AABBTree
