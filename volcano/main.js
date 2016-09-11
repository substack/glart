var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,-1,0],
  phi: 0.2,
  theta: 0.5,
  distance: 1.5
})
var draw = {
  volcano: require('./volcano.js')(regl),
  forest: require('./forest.js')(regl),
  smoke: require('./smoke.js')(regl),
  sky: require('./sky.js')(regl)
}

regl.frame(function (context) {
  regl.clear({ color: [0.72,0.75,0.78,1], depth: true })
  camera(function () {
    var pos = [-1.2,0,0]
    var ay = context.time*0.005
    draw.sky()
    draw.volcano({ offset: pos, angleY: ay})
    draw.forest({ offset: pos, angleY: ay })
    draw.smoke({ offset: pos, angleY: ay })
  })
})
