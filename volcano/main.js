var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,-1,0],
  phi: 0.3,
  distance: 3
})
var draw = {
  volcano: require('./volcano.js')(regl),
  forest: require('./forest.js')(regl),
  sky: require('./sky.js')(regl),
  smoke: require('./smoke.js')(regl)
}

regl.frame(function (context) {
  regl.clear({ color: [0.72,0.75,0.78,1], depth: true })
  camera(function () {
    draw.sky(context)
    draw.volcano(context)
    draw.forest(context)
    draw.smoke(context)
  })
})
