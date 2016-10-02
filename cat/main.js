var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 10, minDistance: 1, maxDistance: 50,
  theta: -0.8, phi: 0.6
})
var glx = require('glslify')
var build = require('implicit-mesh/shader')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var lerp = require('lerp')

var mesh = build(128, glx`
  #pragma glslify: sphere = require('implicit-geometry/sphere')
  #pragma glslify: rbox = require('implicit-geometry/rbox')
  #pragma glslify: cylinder = require('implicit-geometry/cylinder')
  #pragma glslify: twist = require('implicit-geometry/twist')
  float surface (vec3 p) {
    return min(
      min(
        sphere(p, 0.4),
        min(
          min(
            cylinder(p.yzx-vec3(-0.1,-0.25,0), vec2(0.15,0.2)),
            cylinder(p.yzx-vec3(0,-0.5,0), vec2(0.05,0.2))
          ),
          min(
            min(
              cylinder(p-vec3(0.1,-0.3,0), vec2(0.05,0.2)),
              cylinder(p-vec3(-0.1,-0.3,0), vec2(0.05,0.2))
            ),
            min(
              cylinder(p-vec3(0.1,-0.3,-0.4), vec2(0.05,0.2)),
              cylinder(p-vec3(-0.1,-0.3,-0.4), vec2(0.05,0.2))
            )
          )
        )
      ),
      min(
        rbox(p-vec3(0.1,0.15,0), vec3(0.03), 0.01),
        rbox(p-vec3(-0.1,0.15,0), vec3(0.03), 0.01)
      )
    );
  }
`)
var draw = { cats: [] }
for (var i = 0; i < 50; i++) draw.cats.push(cat(regl))

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    for (var i = 0; i < draw.cats.length; i++) {
      draw.cats[i]({ ix: i })
    }
  })
})

function cat (regl) {
  var model = [], pos = [(Math.random()*2-1)*5,0,(Math.random()*2-1)*5]
  var pdir = vec3.random([])
  pdir[1] = 0
  var ndir = vec3.random([])
  ndir[1] = 0
  var ptheta = 0, ntheta = 0
  var updated = 0
  return regl({
    frag: glx`
      precision mediump float;
      varying vec3 vpos, vnorm;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform float time, ix;
      void main () {
        gl_FragColor = vec4(abs(vnorm)*0.5
          + vec3(0.2+snoise(vnorm*0.2+vec3(0,0,time*4.0+ix))), 1)
        ;
      }
    `,
    vert: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      uniform float time, ix;
      void main () {
        vnorm = normal;
        vpos = position
          + normal*0.02*(1.0+sin(time*4.0)*0.25)
          + normal*snoise(position*8.0+vec3(0,0,time))*0.03
            * pow(1.0-position.y*0.25,8.0)
          + vec3(0,sin(time*12.0+ix)*0.25,0)
        ;
        gl_Position = projection * view * model * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      time: regl.context('time'),
      ix: regl.prop('ix'),
      model: function (context, props) {
        var freq = 0.5
        if (context.time > updated + freq) {
          vec3.copy(pdir, ndir)
          ptheta = ntheta
          ntheta = (Math.random()*2-1) * Math.PI * 2
          ndir = [Math.cos(ntheta),0,Math.sin(ntheta)]
          updated = context.time
        }
        var t = (context.time - updated) / freq
        var v = []
        var rmat = []
        mat4.identity(rmat)
        mat4.rotateY(rmat, rmat, spow(lerp(-ptheta,-ntheta,t),0.2))
        vec3.lerp(v, pdir, ndir, t)
        vec3.scale(v, v, 0.5)
        vec3.add(v, pos, v)
        if (vec3.length(pos) > 10) {
          pos[0] = (Math.random()*2-1)*5
          pos[2] = (Math.random()*2-1)*5
          ntheta = -ntheta
          ndir = [Math.cos(ntheta),0,Math.sin(ntheta)]
          updated = context.time
        }
        mat4.identity(model)
        mat4.translate(model, model, v)
        mat4.multiply(model, model, rmat)
        return model
      }
    }
  })
}
function spow (x, n) { return (x>0?1:-1)*Math.pow(Math.abs(x),n) }
