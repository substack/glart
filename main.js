var regl = require('regl')()
var mat4 = require('gl-mat4')
var cubeMesh = require('cube-mesh')
var mesh = cubeMesh(1)

var cubes = []
for (var i = 0; i < 20; i++) {
  cubes.push(createCube())
}

var proj = mat4.identity([])
var view = mat4.identity([])
mat4.translate(view, view, [0,0,-5])

regl.frame(function (count) {
  regl.clear({
    color: [0.1,0.05,0,1],
    depth: 1
  })
  var opts = {
    proj: mat4.perspective(proj, Math.PI/2,
      window.innerWidth/window.innerHeight, 0, 1e12),
    view: view
  }
  for (var i = 0; i < cubes.length; i++) cubes[i](opts)
})

function createCube () {
  var pos = [
    1/(2*Math.random()-1),
    1/(2*Math.random()-1),
    1/(2*Math.random()-1)
  ]
  var rotY = 0.01/Math.random() * 0.01
  var rotX = 0.01/Math.random() * 0.01

  var model = mat4.identity([])
  mat4.translate(model, model, pos)

  var draw = regl({
    frag: `
      precision mediump float;
      varying vec3 pos;
      void main () {
        gl_FragColor = vec4(
          sin(pos.z+cos(pos.y)),
          sin(pos.x),
          cos(pos.y),
          1
        );
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
    elements: regl.elements(mesh.cells),
    uniforms: {
      proj: regl.prop('proj'),
      model: regl.prop('model'),
      view: regl.prop('view')
    },
    depthTest: true
  })
  return function (opts) {
    mat4.rotateX(model, model, rotX)
    mat4.rotateY(model, model, rotY)
    opts.model = model
    return draw(opts)
  }
}
