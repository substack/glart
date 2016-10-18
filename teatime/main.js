var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 30, theta: 1.2, phi: 0.05
})
var normalize = require('gl-vec3/normalize')
var resl = require('resl')

var lights = [
  { position: [-0.5,0.4,0.7], color: [0.9,1,0.8], mag: 0.8 },
  { position: [0.5,-0.1,0.7], color: [1,1,0.8], mag: 0.4 },
  { position: [0.3,0.4,-0.7], color: [0.8,1,1], mag: 0.1 }
]
lights.forEach(function (x) { normalize(x.position,x.position) })

resl({
  manifest: {
    front: { type: 'image', src: 'data/bliss_front.jpg' },
    back: { type: 'image', src: 'data/bliss_back.jpg' },
    left: { type: 'image', src: 'data/bliss_left.jpg' },
    right: { type: 'image', src: 'data/bliss_right.jpg' },
    top: { type: 'image', src: 'data/bliss_top.jpg' },
    bottom: { type: 'image', src: 'data/bliss_bottom.jpg' }
  },
  onDone: render
})

function render (assets) {
  var draw = {
    column: require('./column.js')(regl),
    teapot: require('./teapot.js')(regl, assets),
    bg: require('./bg.js')(regl, assets)
  }
  regl.frame(function () {
    regl.clear({ color: [0.8,0.9,0.6,1], depth: true })
    camera(frame)
  })
  function frame () {
    draw.bg()
    draw.column([
      { position: [0.5,-8,15], lights: lights, rspeed: -0.1 },
      { position: [4,0,-50], lights: lights, rspeed: -0.4 }
    ])
    draw.teapot([
      { position: [0.5,4,15], lights: lights, scale: 0.2, rspeed: 1 },
      { position: [4,-15,-50], lights: lights, scale: 0.3, rspeed: 3, yscale: -1 },
      { position: [2,9,5], lights: lights, scale: 0.1, rspeed: -0.2 },
      { position: [-1,5,5], lights: lights, scale: 0.1, rspeed: -0.2 },
      { position: [-15,3,10], lights: lights, scale: 0.1, rspeed: 0.4 },
      { position: [3,-2,-10], lights: lights, scale: 0.05, rspeed: 0.2 },
      { position: [15,0,-20], lights: lights, scale: 0.1, rspeed: -0.05 }
    ])
  }
}
