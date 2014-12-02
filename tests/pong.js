let test = require("tape")
let pong = require("../src/pong")
let {Box, Ball, Paddle, Brick, Store} = pong
let {getVisible, AABBTree, boundBoth} = pong
let log = (x) => console.log(JSON.stringify(x, null, 2))

let ball    = new Ball(1,1)
let brick   = new Brick(8,8)
let paddle  = new Paddle(0,0)
let store   = new Store
let viewBox = new Box(4,4,0,0)
//let tree    = new AABBTree
let box1    = new Box(1,1,0,0)
let box2    = new Box(1,2,4,4)
let outBox  = new Box(0,0,0,0)

//tree.add(box)

store.addEntity(ball)
store.addEntity(brick)
store.addEntity(paddle)

boundBoth(outBox, box1, box2)
log(outBox)
