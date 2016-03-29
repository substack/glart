var regl = require('regl')()
var mat4 = require('gl-mat4')
var cubeMesh = require('cube-mesh')

var mesh = cubeMesh(1)
var cube = regl({
  frag: `
    precision mediump float;
    varying vec3 pos;
    void main () {
      gl_FragColor = vec4(pos, 1);
    }
  `,
  vert: `
    uniform mat4 proj;
    uniform mat4 model;
    uniform mat4 view;

    attribute vec3 position;
    varying vec3 pos;

    void main () {
      gl_Position = proj*model*view * vec4(position, 1.0);
      pos = position;
    }
  `,
  attributes: {
    position: regl.buffer(mesh.positions)
  },
  depthTest: true,
  elements: regl.elements(mesh.cells),
  uniforms: {
    proj: regl.prop('proj'),
    model: regl.prop('model'),
    view: regl.prop('view')
  }
})

var view = mat4.identity([])
var model = mat4.identity([])
mat4.translate(model, model, [0,-0.3,-1.7])
mat4.rotateX(model, model, 0.5)
mat4.translate(model, model, [0,0.3,0])

var proj = mat4.identity([])

regl.frame(function (count) {
  regl.clear({
    color: [1,0.5,0,1]
  })
  cube({
    proj: mat4.perspective(proj, Math.PI/2,
      window.innerWidth/window.innerHeight, 0, 1e12),
    model: model,
    view: mat4.rotateY(view, view, 0.01)
  })
})
