var regl = require('regl')({
  extensions: ['OES_texture_float', 'OES_element_index_uint'],
  optionalExtensions: 'OES_texture_float_linear',
  pixelRatio: 1
})
var d = 2
var camera = require('regl-camera')(regl, {
  minDistance: d, distance: d, maxDistance: d,
  mouse: false
})
var icosphere = require('icosphere')
var mat4 = require('gl-mat4')
var fs = require('fs')
var atmo = fs.readFileSync(require.resolve('glsl-atmosphere/index.glsl'),'utf8')

require('./sfx.js')(regl)

var draw = { planet: planet(regl) }
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.planet()
  })
})

function planet (regl) {
  var model = []
  var mesh = icosphere(5)
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos, vscatter;
      void main () {
        vec3 vnorm = normalize(vpos);
        vec3 c = 1.0 - exp(-1.0 * vscatter);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 position;
      varying vec3 vpos, vscatter;
      uniform vec3 sunpos, eye;
      uniform mat4 projection, view, model;
      uniform float time;
      ${atmo}
      void main () {
        vpos = position;
        vscatter = atmosphere(
          normalize(vpos-eye*(1.0+sin(time)*0.1)),
          eye*(0.7+sin(time*4.0)*0.05)*6371e3,
          sunpos,
          100.0 * exp(1.0 + sin(time)),
          6371e3-5e6,
          6471e3 + sin(time)*1e5,
          (sin(time*4.0)+1.0)*100.0*vec3(5.5e-6,13.0e-6,22.4e-6),
          21e-6,
          8e3*5.0,
          1e2,
          0.758
        );
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    uniforms: {
      model: function (context) {
        return mat4.identity(model)
      },
      time: regl.context('time'),
      sunpos: function (context) {
        return [1,0,0]
      }
    },
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells
  })
}
