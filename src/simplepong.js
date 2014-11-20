var canvas = document.createElement("canvas")
var gl     = canvas.getContext("webgl")

var log   = console.log.bind(console)
var print = function (x) { 
  console.log(JSON.stringify(x, null, 2))
}
var defined = function (obj, key) {
  return obj[key] !== undefined && obj[key] !== null
}

var MAX_ENTITY_COUNT = 10
var MAX_SWAP_SIZE    = 30

function SortedBuffer (elementSize, count) {
  var swapBuffer = new Float32Array(MAX_SWAP_SIZE)
  var buffer     = new Float32Array(elementSize * count)

  this.count       = 0
  this.liveCount   = 0
  this.elementSize = elementSize

  Object.defineProperty(this, "maxIndex", {
    get: function () {
      return this.count * this.elementSize
    } 
  })

  Object.defineProperty(this, "livingIndex", {
    get: function () {
      retur this.liveCount * this.elementSize  
    } 
  })

  Object.defineProperty(this, "buffer", {
    get: function () {
      return buffer
    } 
  })

  this.get = function (i) {
    return buffer[i] 
  }

  this.set = function (i, val) {
    buffer[i] = val 
  }

  this.getRange = function (output, start, end) {
    var len = end - start
    var i   = -1

    while (++i < len) {
      output[i] = buffer[start + i]  
    }
    return output
  }

  this.setRange = function (input, start, end) {
    var len = end - start
    var i   = -1

    while (++i < len) {
      buffer[start + i] = input[i]
    }
  }

  this.swap = function (index1, index2) {
    var len = this.elementSize
    var i   = -1

    while (++i < len) {
      swapBuffer[i]      = buffer[index1 + i] 
      buffer[index1 + i] = buffer[index2 + i]  
      buffer[index2 + i] = swapBuffer[i]
    }
  }
}

/*
 * physics: [posX, posY, velX, velY, accX, accY, width, height]
 */
function EntityStore () {
  this.entities = []
  this.physics  = new SortedBuffer(8, MAX_ENTITY_COUNT)

  this.addPhysics = function (id, physics) {
    var physIndex = this.physics.maxIndex
    var entIndex  = this.entities[id]

    entIndex.physics = physIndex
    this.physics.set(physIndex+0, physics.position.x)
    this.physics.set(physIndex+1, physics.position.y)
    this.physics.set(physIndex+2, physics.velocity.x)
    this.physics.set(physIndex+3, physics.velocity.y)
    this.physics.set(physIndex+4, physics.acceleration.x)
    this.physics.set(physIndex+5, physics.acceleration.y)
    this.physics.set(physIndex+6, physics.size.x)
    this.physics.set(physIndex+7, physics.size.y)
    this.physics.count++
  }

  this.activate = function (eid) {
    var entityIndex = this.entities[eid]
    var len         = this.tables.length
    var i           = -1

    if (defined(entityIndex, "physics")) {
      this.physics.swap(this.physics.livingIndex, entityIndex.physics)
      this.physics.liveCount++
    }
  }

  this.deactivate = function (eid) {
    var entityIndex = this.entities[eid]
    var len         = this.tables.length
    var i           = -1

    if (defined(entityIndex, "physics")) {
      this.physics.swap(this.physics.livingIndex, entityIndex.physics)
      this.physics.liveCount++
    }
  }

  this.addEntity = function (ent) {
    var id       = this.entities.length

    this.entities.push({})

    if (defined(ent, "physics"))  this.addPhysics(id, ent.physics)
    if (ent.isActive) this.activate(id)
    return id
  }

}

function Entity () {
  this.isActive = false
}

function Paddle (w, h, x, y) {
  Entity.call(this) 
  this.physics = {
    position:     {x: x, y: y},
    velocity:     {x: 0, y: 0},
    acceleration: {x: 0, y: 0},
    size:         {x: w, y: h}
  }
}

function Ball (w, h, x, y, dx, dy) {
  Entity.call(this)
  this.physics = {
    position:     {x: x, y: y},
    velocity:     {x: x, y: y},
    acceleration: {x: x, y: y},
    size:         {x: w, y: h}
  }
}

function makeRender () {
  return function render () {
    //clearContext(gl) 
    //renderBodies(gl)
    //renderParticles(gl)
    requestAnimationFrame(render)
  }
}

function makeUpdate () {
  return function update () {
    //process inputs
    //run physics
    //run collision
    //kill old
    //run emitters?
    //run timers?
  }
}

function Game () {
  
}

Game.prototype.start = function () {
  window.setInterval(makeUpdate(game, 25)) 
  window.requestAnimationFrame(makerender(gl, game))
}

window.es       = new EntityStore
window.myBuffer = new Float32Array(20)
window.p1       = new Paddle(10, 4, 1, 1)
window.p2       = new Paddle(8, 2, 2, 2)

es.activate(1)
es.addEntity(p1)
es.addEntity(p2)
es.physics.getRange(myBuffer, 0, 16)
document.body.appendChild(canvas)
