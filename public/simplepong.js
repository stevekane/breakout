(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var canvas = document.createElement("canvas")
var gl     = canvas.getContext("webgl")

document.body.appendChild(canvas)

var MAX_ENTITY_COUNT = 10
var MAX_SWAP_SIZE    = 30

function SortedBuffer (elementSize, count) {
  var swapBuffer = new Float32Array(MAX_SWAP_SIZE)
  var buffer     = new Float32Array(elementSize * count)

  this.count     = 0
  this.liveCount = 0

  Object.defineProperty(this, "maxIndex", {
    get: function () {
      return this.count * elementSize
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

  this.swap = function (length, index1, index2) {
    var i = -1

    while (++i < length) {
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
     
  }

  this.addEntity = function (ent) {
    var id       = this.entities.length

    this.entities.push({})

    if (ent.physics)  this.addPhysics(id, ent.physics)
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2ltcGxlcG9uZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbnZhciBnbCAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKVxuXG52YXIgTUFYX0VOVElUWV9DT1VOVCA9IDEwXG52YXIgTUFYX1NXQVBfU0laRSAgICA9IDMwXG5cbmZ1bmN0aW9uIFNvcnRlZEJ1ZmZlciAoZWxlbWVudFNpemUsIGNvdW50KSB7XG4gIHZhciBzd2FwQnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShNQVhfU1dBUF9TSVpFKVxuICB2YXIgYnVmZmVyICAgICA9IG5ldyBGbG9hdDMyQXJyYXkoZWxlbWVudFNpemUgKiBjb3VudClcblxuICB0aGlzLmNvdW50ICAgICA9IDBcbiAgdGhpcy5saXZlQ291bnQgPSAwXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibWF4SW5kZXhcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY291bnQgKiBlbGVtZW50U2l6ZVxuICAgIH0gXG4gIH0pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiYnVmZmVyXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBidWZmZXJcbiAgICB9IFxuICB9KVxuXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICByZXR1cm4gYnVmZmVyW2ldIFxuICB9XG5cbiAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoaSwgdmFsKSB7XG4gICAgYnVmZmVyW2ldID0gdmFsIFxuICB9XG5cbiAgdGhpcy5nZXRSYW5nZSA9IGZ1bmN0aW9uIChvdXRwdXQsIHN0YXJ0LCBlbmQpIHtcbiAgICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgaSAgID0gLTFcblxuICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgIG91dHB1dFtpXSA9IGJ1ZmZlcltzdGFydCArIGldICBcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dFxuICB9XG5cbiAgdGhpcy5zZXRSYW5nZSA9IGZ1bmN0aW9uIChpbnB1dCwgc3RhcnQsIGVuZCkge1xuICAgIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBpICAgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgYnVmZmVyW3N0YXJ0ICsgaV0gPSBpbnB1dFtpXVxuICAgIH1cbiAgfVxuXG4gIHRoaXMuc3dhcCA9IGZ1bmN0aW9uIChsZW5ndGgsIGluZGV4MSwgaW5kZXgyKSB7XG4gICAgdmFyIGkgPSAtMVxuXG4gICAgd2hpbGUgKCsraSA8IGxlbmd0aCkge1xuICAgICAgc3dhcEJ1ZmZlcltpXSAgICAgID0gYnVmZmVyW2luZGV4MSArIGldIFxuICAgICAgYnVmZmVyW2luZGV4MSArIGldID0gYnVmZmVyW2luZGV4MiArIGldICBcbiAgICAgIGJ1ZmZlcltpbmRleDIgKyBpXSA9IHN3YXBCdWZmZXJbaV1cbiAgICB9XG4gIH1cbn1cblxuLypcbiAqIHBoeXNpY3M6IFtwb3NYLCBwb3NZLCB2ZWxYLCB2ZWxZLCBhY2NYLCBhY2NZLCB3aWR0aCwgaGVpZ2h0XVxuICovXG5mdW5jdGlvbiBFbnRpdHlTdG9yZSAoKSB7XG4gIHRoaXMuZW50aXRpZXMgPSBbXVxuICB0aGlzLnBoeXNpY3MgID0gbmV3IFNvcnRlZEJ1ZmZlcig4LCBNQVhfRU5USVRZX0NPVU5UKVxuXG4gIHRoaXMuYWRkUGh5c2ljcyA9IGZ1bmN0aW9uIChpZCwgcGh5c2ljcykge1xuICAgIHZhciBwaHlzSW5kZXggPSB0aGlzLnBoeXNpY3MubWF4SW5kZXhcbiAgICB2YXIgZW50SW5kZXggID0gdGhpcy5lbnRpdGllc1tpZF1cblxuICAgIGVudEluZGV4LnBoeXNpY3MgPSBwaHlzSW5kZXhcbiAgICB0aGlzLnBoeXNpY3Muc2V0KHBoeXNJbmRleCswLCBwaHlzaWNzLnBvc2l0aW9uLngpXG4gICAgdGhpcy5waHlzaWNzLnNldChwaHlzSW5kZXgrMSwgcGh5c2ljcy5wb3NpdGlvbi55KVxuICAgIHRoaXMucGh5c2ljcy5zZXQocGh5c0luZGV4KzIsIHBoeXNpY3MudmVsb2NpdHkueClcbiAgICB0aGlzLnBoeXNpY3Muc2V0KHBoeXNJbmRleCszLCBwaHlzaWNzLnZlbG9jaXR5LnkpXG4gICAgdGhpcy5waHlzaWNzLnNldChwaHlzSW5kZXgrNCwgcGh5c2ljcy5hY2NlbGVyYXRpb24ueClcbiAgICB0aGlzLnBoeXNpY3Muc2V0KHBoeXNJbmRleCs1LCBwaHlzaWNzLmFjY2VsZXJhdGlvbi55KVxuICAgIHRoaXMucGh5c2ljcy5zZXQocGh5c0luZGV4KzYsIHBoeXNpY3Muc2l6ZS54KVxuICAgIHRoaXMucGh5c2ljcy5zZXQocGh5c0luZGV4KzcsIHBoeXNpY3Muc2l6ZS55KVxuICAgIHRoaXMucGh5c2ljcy5jb3VudCsrXG4gIH1cblxuICB0aGlzLmFjdGl2YXRlID0gZnVuY3Rpb24gKGVpZCkge1xuICAgICBcbiAgfVxuXG4gIHRoaXMuYWRkRW50aXR5ID0gZnVuY3Rpb24gKGVudCkge1xuICAgIHZhciBpZCAgICAgICA9IHRoaXMuZW50aXRpZXMubGVuZ3RoXG5cbiAgICB0aGlzLmVudGl0aWVzLnB1c2goe30pXG5cbiAgICBpZiAoZW50LnBoeXNpY3MpICB0aGlzLmFkZFBoeXNpY3MoaWQsIGVudC5waHlzaWNzKVxuICAgIGlmIChlbnQuaXNBY3RpdmUpIHRoaXMuYWN0aXZhdGUoaWQpXG4gICAgcmV0dXJuIGlkXG4gIH1cblxufVxuXG5mdW5jdGlvbiBFbnRpdHkgKCkge1xuICB0aGlzLmlzQWN0aXZlID0gZmFsc2Vcbn1cblxuZnVuY3Rpb24gUGFkZGxlICh3LCBoLCB4LCB5KSB7XG4gIEVudGl0eS5jYWxsKHRoaXMpIFxuICB0aGlzLnBoeXNpY3MgPSB7XG4gICAgcG9zaXRpb246ICAgICB7eDogeCwgeTogeX0sXG4gICAgdmVsb2NpdHk6ICAgICB7eDogMCwgeTogMH0sXG4gICAgYWNjZWxlcmF0aW9uOiB7eDogMCwgeTogMH0sXG4gICAgc2l6ZTogICAgICAgICB7eDogdywgeTogaH1cbiAgfVxufVxuXG5mdW5jdGlvbiBCYWxsICh3LCBoLCB4LCB5LCBkeCwgZHkpIHtcbiAgRW50aXR5LmNhbGwodGhpcylcbiAgdGhpcy5waHlzaWNzID0ge1xuICAgIHBvc2l0aW9uOiAgICAge3g6IHgsIHk6IHl9LFxuICAgIHZlbG9jaXR5OiAgICAge3g6IHgsIHk6IHl9LFxuICAgIGFjY2VsZXJhdGlvbjoge3g6IHgsIHk6IHl9LFxuICAgIHNpemU6ICAgICAgICAge3g6IHcsIHk6IGh9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVJlbmRlciAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiByZW5kZXIgKCkge1xuICAgIC8vY2xlYXJDb250ZXh0KGdsKSBcbiAgICAvL3JlbmRlckJvZGllcyhnbClcbiAgICAvL3JlbmRlclBhcnRpY2xlcyhnbClcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKCkge1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICAvL3Byb2Nlc3MgaW5wdXRzXG4gICAgLy9ydW4gcGh5c2ljc1xuICAgIC8vcnVuIGNvbGxpc2lvblxuICAgIC8va2lsbCBvbGRcbiAgICAvL3J1biBlbWl0dGVycz9cbiAgICAvL3J1biB0aW1lcnM/XG4gIH1cbn1cblxuZnVuY3Rpb24gR2FtZSAoKSB7XG4gIFxufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgd2luZG93LnNldEludGVydmFsKG1ha2VVcGRhdGUoZ2FtZSwgMjUpKSBcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlcmVuZGVyKGdsLCBnYW1lKSlcbn1cblxud2luZG93LmVzICAgICAgID0gbmV3IEVudGl0eVN0b3JlXG53aW5kb3cubXlCdWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KDIwKVxud2luZG93LnAxICAgICAgID0gbmV3IFBhZGRsZSgxMCwgNCwgMSwgMSlcbndpbmRvdy5wMiAgICAgICA9IG5ldyBQYWRkbGUoOCwgMiwgMiwgMilcblxuZXMuYWN0aXZhdGUoMSlcbmVzLmFkZEVudGl0eShwMSlcbmVzLmFkZEVudGl0eShwMilcbmVzLnBoeXNpY3MuZ2V0UmFuZ2UobXlCdWZmZXIsIDAsIDE2KVxuIl19
