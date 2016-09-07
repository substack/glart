var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,-1,0],
  distance: 3
})
var draw = {
  volcano: require('./volcano.js')(regl)
}

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.volcano()
  })
})
