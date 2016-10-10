var extrude = require('extrude-by-path')
var mat4 = require('gl-mat4')
var anormals = require('angle-normals')
var glx = require('glslify')
var regl = require('regl')()
var wireframe = require('screen-projected-lines')

var camera = require('regl-camera')(regl, {
  distance: 2, minDistance: 1, maxDistance: 10, theta: 0, phi: Math.PI/2
})
var draw = {
  plume: plume(regl),
  blur: require('./blur.js')(regl, { steps: 4 })
}
var tex = regl.texture()
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  draw.blur({ texture: tex, spread: 1.1 })
  camera(function () {
    draw.plume()
    tex({ copy: true, min: 'linear', mag: 'linear' })
  })
})

function plume (regl) {
  var model = []
  var circle = [], cells = [], positions = [], edges = []
  for (var i = 0; i <= 24; i++) {
    var theta = i/24*2*Math.PI
    circle.push([Math.cos(theta),0,Math.sin(theta),theta*8])
  }
  for (var i = 1; i < 24; i++) cells.push([0,i,i+1])
  for (var i = 0; i < 400; i++) {
    positions.push([1-i/400/2,i/400*2])
    if (i > 0) edges.push([i-1,i])
  }
  var mesh = extrude({
    positions: positions,
    edges: edges,
    cells: cells,
    path: circle,
    closed: true
  })
  return regl({
    frag: glx`
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1,0,1,0.01);
      }
    `,
    vert: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: curl = require('glsl-curl-noise')
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, normal;
      void main () {
        vec3 p = position + normal*sin(position.y*10.0-time)*0.2;
        gl_Position = vec4(projection*view*model*vec4(p,1));
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: function (context) {
        return mat4.identity(model)
      },
      time: regl.context('time')
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    },
    depth: {
      enable: true,
      mask: false
    },
    cull: {
      enable: true
    }
  })
}
