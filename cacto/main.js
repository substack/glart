var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var normals = require('angle-normals')
var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  minDistance: 2, maxDistance: 20, distance: 10
})
var build = require('implicit-mesh/shader')
var glx = require('glslify')
var tau = Math.PI * 2

var draw = {
  spiralstick: spiralstick(regl),
  sky: sky(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.sky()
    spirals([0,0,0],0)
    spirals([-2,0,3],1)
    spirals([3,0,0],2)
    spirals([3,0,-2],3)
  })
  function spirals (pos, ix) {
    draw.spiralstick([
      { h: 8, pos: [0,0,0], theta: 0, phi: 0 },
      { h: 4, pos: [0,0.2,0], theta: 1.2, phi: 0.5 },
      { h: 4, pos: [0,0.2,0], theta: -1.2, phi: -0.5 },
      { h: 6, pos: [0.3,0.8,0], theta: -0.5, phi: 0.2 },
      { h: 6, pos: [-0.3,0.9,-0.4], theta: 0.5, phi: 0.3 },
      { h: 6, pos: [-0.3,0.9,0.2], theta: 0.5, phi: 0.3 },
      { h: 8, pos: [-0.5,1.2,0.6], theta: -0.3, phi: -0.1 },
      { h: 8, pos: [-0.7,1.3,-0.3], theta: 0.3, phi: 0.6 },
    ].map(function (r) {
      vec3.add(r.pos,r.pos,pos)
      r.offset = ix
      return r
    }))
  }
})

function sky (regl) {
  return regl({
    frag: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec2 uv;
      uniform float time;
      void main () {
        float x = pow(abs(snoise(vec3(uv*12.0,time*0.5))),0.25);
        vec3 c = vec3(x,x*0.2,x);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = (1.0+position)*0.5;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: {
      position: [4,4,4,-4,-4,0]
    },
    count: 3,
    uniforms: {
      time: regl.context('time')
    },
    depth: {
      enable: false
    }
  })
}

function spiralstick (regl) {
  var model = [], vview = [], tmpa = [], tmpb = []
  var params = [
    [0.1,0.8,0.2,2],
    [0.2,0.7,0.3,4],
    [0.6,0.4,0.1,1],
    [0.3,0.1,0.4,1],
  ]
  var draws = params.map(create)
  function create (p) {
    var mesh = build(128, glx`
      #pragma glslify: cylinder = require('implicit-geometry/cylinder')
      #pragma glslify: rbox = require('implicit-geometry/rbox')
      #pragma glslify: twist = require('implicit-geometry/twist')
      float surface (vec3 p) {
        return rbox(
          twist(p*${sf(p[3])},${tau*4}),
          vec3(${p.slice(0,3).map(sf).join(',')}),
          0.01
        );
      }
    `)
    function sf (x) { return x.toPrecision(8) }
    return regl({
      frag: glx`
        precision mediump float;
        #pragma glslify: snoise = require('glsl-noise/simplex/3d')
        varying vec3 vnorm, vpos;
        uniform float time;
        void main () {
          float l = max(dot(vec3(0.2,1,-0.3),vnorm)*0.8,
            dot(vec3(-0.3,-1,-0.2),vnorm)*0.05)
            + 0.5*pow(abs(snoise(vpos*8.0+vec3(0,time*1.0,0))),0.2)-0.25;
          gl_FragColor = vec4(l*0.5,l,l*0.25,1);
        }
      `,
      vert: `
        precision mediump float;
        uniform mat4 projection, view, vview, model;
        attribute vec3 position, normal;
        varying vec3 vnorm, vpos;
        void main () {
          vnorm = normal;
          vpos = position;
          gl_Position = projection * view * vview * model * vec4(position,1);
        }
      `,
      attributes: {
        position: mesh.positions,
        normal: normals(mesh.cells, mesh.positions)
      },
      uniforms: {
        model: function (context, props) {
          var v = [1,props.h,1]
          mat4.identity(model)
          mat4.scale(model,model,v)
          vec3.divide(v, props.pos, v)
          mat4.translate(model,model,v)
          mat4.identity(tmpa)
          mat4.rotateZ(tmpa, tmpa, props.theta)
          mat4.rotateX(tmpa, tmpa, props.phi)
          mat4.multiply(model, tmpa, model)
          return model
        },
        vview: function (context) {
          mat4.identity(vview)
          mat4.rotateY(vview, vview, context.time*0.5)
          return vview
        },
        time: regl.context('time')
      },
      elements: mesh.cells
    })
  }
  return function (props) {
    return regl.draw(function (context) {
      var i = (props[0].offset + Math.floor(context.time*4))%draws.length
      draws[i](props)
    })
  }
}
