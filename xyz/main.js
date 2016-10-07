var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 4, minDistance: 2, maxDistance: 5
})
var icosphere = require('icosphere')
var mat4 = require('gl-mat4')
var wireframe = require('screen-projected-lines')
var glx = require('glslify')

var draw = { cool: cool(regl) }
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.cool()
  })
})

function cool (regl) {
  var model = []
  var mesh = wireframe(icosphere(4))
  return regl({
    frag: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      #pragma glslify: hsl = require('glsl-hsl2rgb')
      varying vec3 vpos;
      uniform float time;
      void main () {
        vec3 vnorm = normalize(vpos);
        float l = pow(abs(snoise(vec4(vpos,time*0.2))),0.25)
          *0.35+0.6;
        vec3 c = hsl(l,1.0,l*0.8);
        gl_FragColor = vec4(pow(c,vec3(2.2)),1);
      }
    `,
    vert: glx`
      precision mediump float;
      #pragma glslify: linevoffset = require('screen-projected-lines')
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      uniform mat4 projection, view, model;
      attribute vec3 position, nextpos;
      attribute float direction;
      uniform float aspect, time;
      varying vec3 vpos;
      vec3 xpos (vec3 p) {
        return (1.0 + snoise(vec4(p,time*0.2))*0.4) * p;
      }
      void main () {
        mat4 proj = projection * view * model;
        vec4 p = proj*vec4(xpos(position),1);
        vec4 n = proj*vec4(xpos(nextpos),1);
        vec4 offset = linevoffset(p, n, direction, aspect);
        vpos = position;
        gl_Position = p + offset*0.005;
      }
    `,
    attributes: {
      position: mesh.positions,
      nextpos: mesh.nextPositions,
      direction: mesh.directions
    },
    elements: mesh.cells,
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        mat4.rotateY(model,model,context.time*0.2)
        return model
      },
      time: regl.context('time'),
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      }
    }
  })
}
