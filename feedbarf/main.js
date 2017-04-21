var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 2, center: [0,0.5,0]
})
var resl = require('resl')

resl({
  manifest: {
    bliss: { type: 'image', src: 'bliss.jpg' }
  },
  onDone: ready
})

function ready (assets) {
  var draw = {
    feedback: require('regl-feedback')(regl, `
      vec3 sample (vec2 uv, sampler2D tex) {
        vec2 tpos = ((2.0*uv-1.0)+1.0)*0.5;
        vec2 p = vec2(
          cos(tpos.x*${2*Math.PI}*16.0)
            + cos(tpos.x*${2*Math.PI}*4.0)
            + cos(tpos.x*${2*Math.PI}*8.0)
            + sin(tpos.x*${2*Math.PI}*64.0),
          sin(tpos.y*${2*Math.PI}*16.0)
            + sin(tpos.y*${2*Math.PI}*4.0)
            + sin(tpos.y*${2*Math.PI}*8.0)
            + cos(tpos.y*${2*Math.PI}*64.0)
        ) * 0.004;
        return 0.999*texture2D(tex,tpos+p).rgb;
      }
    `),
    bunny: require('./bunny.js')(regl),
    bg: require('./bg.js')(regl, assets)
  }
  var fbtex = regl.texture()
  regl.frame(function () {
    camera(function () {
      draw.feedback({ texture: fbtex })
      draw.bg()
      draw.bunny()
      fbtex({ copy: true, min: 'linear', mag: 'linear' })
      draw.feedback({ texture: fbtex })
    })
  })
}
