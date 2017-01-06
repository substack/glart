var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  theta: -0.82, phi: 0.02, distance: 20
})
var cube = require('cube-mesh')
var normalize = require('gl-vec3/normalize')
var anormals = require('angle-normals')
var smooth = require('smooth-state')
var mat4 = require('gl-mat4')

var lights = (function () {
  return regl({
    uniforms: {
      light0: normalize([],[0,1,0]),
    }
  })
})()

var draw = {
  box: box(regl),
  train: train(regl),
  cloud: cloud(regl)
}
var boxes = []
for (var z = -16; z <= 16; z++) {
  for (var x = -16; x <= 16; x++) {
    if (Math.sqrt(x*x+z*z)>50) continue
    var n = (4+xsin(xsin(x,4)*3+xsin(z,3)*4,8))*4
    var h = (2+xsin(xsin(n+x,4)*n+xsin(n+z,3)*n,8))
      * Math.pow(9-Math.sqrt(x*x+z*z),2) * 0.01
      + xsin(x*2+z*3,8)*0.5
    boxes.push({
      location: [x,h*0.25,z],
      scale: [n/16,h,n/16]
    })
  }
}

var clouds = []
for (var i = 0; i < 400; i++) {
  var theta = Math.random()*2*Math.PI
  var r = Math.random()*100
  clouds.push({
    location: [
      Math.cos(theta)*r,
      5+Math.random()*2,
      Math.sin(theta)*r,
    ],
    scale: [
      1+Math.random()*8,
      1+Math.random()*4,
      1+Math.random()*8
    ]
  })
}

regl.frame(function (context) {
  var t = time = context.time
  regl.clear({ color: [0,0,0,1], depth: true })
  lights(function () {
    camera(function () {
      draw.box(boxes)
      draw.train({
        location: [(t*2+16)%32-16,0.05,-10],
        scale: [0.05,0.05,0.05]
      })
      draw.cloud(clouds)
    })
  })
})

function xsin (x,n) {
  return Math.floor(Math.sin(x)*n)/n
}

function train (regl) {
  var mesh = cube(1,[5,0.08,0.04])
  var rmat = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos, vnorm;
      uniform vec3 location;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vec3 v = location-vpos;
        vec3 d0 = vec3(0.8,1,1) * xsin(0.0
          + xsin(v.x*16.0,2.0)*4.0
            * xsin((0.2-v.y*2.0)*2.0,8.0)*(0.5-v.y*4.0),
          4.0)*2.0;
        gl_FragColor = vec4(d0,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      uniform vec3 location;
      void main () {
        vpos = position + location;
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1.0);
      }
    `,
    uniforms: {
      location: regl.prop('location')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}
5
function cloud (regl) {
  var mesh = cube(1,[1,1,1])
  var rmat = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos, vnorm;
      uniform vec3 location;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vec3 v = location-vpos;
        gl_FragColor = vec4(1,0.95,0.4,0.004);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      uniform vec3 location, scale;
      uniform float time;
      void main () {
        vpos = position*scale + location
          + vec3(mod(time*0.2+location.x,180.0)-64.0,0,0);
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1.0);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location'),
      scale: regl.prop('scale')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: { mask: false }
  })
}

function box (regl) {
  var mesh = cube(1,[1,1,1])
  return regl({
    frag: `
      precision mediump float;
      uniform vec3 eye, light0;
      uniform vec3 location, scale;
      varying vec3 vnorm, vpos;
      uniform float time;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vec3 N = normalize(vnorm-eye);
        vec3 d0 = max(0.0,dot(-normalize(light0-vpos),N))*vec3(1,0.9,0.7)*0.3;
        float lights = max(0.0,xsin(xsin(vpos.y*32.0,4.0)
          * xsin(xsin(vpos.x*4.0+vpos.z*3.0,2.0)*19.0
            + vpos.x*11.0+vpos.z*17.0,2.0)
          * xsin(vpos.x*64.0+vpos.z*16.0,2.0)
          * xsin(vpos.y*8.0+vpos.x+vpos.z,4.0),
          4.0)*2.0) * clamp((vpos.y*6.0-scale.y)/scale.y,0.0,1.0);
        vec3 d1 = lights*vec3(
          (1.0+xsin(time*0.2+vpos.x*32.0+vpos.z*31.0,8.0))*0.3+0.5,
          1,1)*1.5*(1.0+xsin(time*2.0+vpos.x*vpos.x+vpos.y*vpos.y+vpos.z*vpos.z,4.0)*0.2);
        vec3 a = vec3(0.0,0.1,0.1)*0.5;
        gl_FragColor = vec4(pow(max(d0+d1,a),vec3(2.2)),1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 position, normal;
      uniform mat4 projection, view;
      uniform vec3 location, scale;
      varying vec3 vnorm, vpos;
      uniform float time;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vnorm = normal;
        vpos = clamp(position,vec3(-1,-1,-1),vec3(1,1,1))*scale
          + location*vec3(1.8);
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location'),
      scale: regl.prop('scale')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}
