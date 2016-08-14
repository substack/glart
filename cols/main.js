var mesh = require('./data/0.json')

var regl = require('regl')()
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, { center: [25,0,0] })
var mat4 = require('gl-mat4')
var mat0 = []

var draw = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main () {
      gl_FragColor = vec4(abs(vnormal), 1.0);
    }
  `,
  vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    void main () {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  attributes: {
    position: mesh.positions,
    normal: normals(mesh.cells, mesh.positions)
  },
  uniforms: {
    model: (context, props) => {
      var theta = context.time*0.25
      mat4.identity(mat0)
      mat4.translate(mat0, mat0, props.location)
      mat4.rotateY(mat0, mat0, theta)
      return mat0
    },
    location: regl.prop('location')
  },
  elements: mesh.cells
})
var batch = []
for (var i = 0; i < 10; i++) {
  batch.push(
    { location: [-i*20,0,20] },
    { location: [-i*20,0,-20] }
  )
}
regl.frame(() => {
  regl.clear({ color: [0,0,0,1] })
  camera(() => { draw(batch) })
})
