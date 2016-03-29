var regl = require('regl')()
var mat4 = require('gl-mat4')
var cubeMesh = require('cube-mesh')
var webaudio = require('webaudio')
var mesh = cubeMesh(1)

var song = require('./song.js')
var time = 0
var b = webaudio(function (t) {
  time = t
  return song(t)
})
b.play()

var cubes0 = []
for (var i = 0; i < 80; i++) cubes0.push(createCube())

var cubes1 = []
for (var i = 0; i < 80; i++) cubes1.push(createCube())

var proj = mat4.identity([])

function camera (model) {
  return mat4.translate(model, model, [0,0,0])
}

var bpm = 60/60
regl.frame(function (count) {
  regl.clear({
    color: [0.1,0.05,0,1],
    depth: 1
  })
  var opts = {
    proj: mat4.perspective(proj, Math.PI/2,
      window.innerWidth/window.innerHeight, 0, 1e12)
  }
  var cubes = time * bpm % 2 < 1 ? cubes0 : cubes1
  for (var i = 0; i < cubes.length; i++) cubes[i](count, opts)
})

function createCube () {
  var pos = [
    1/(2*Math.random()-1),
    1/(2*Math.random()-1),
    1/(2*Math.random()-1)
  ]
  var rotx = Math.random() * 0.04
  var roty = Math.random() * 0.04

  var orbitx = Math.random() * 0.01
  var orbity = Math.random() * 0.01

  var model = mat4.identity([])
  var view = mat4.identity([])

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
    //depthTest: true
  })
  return function (count, opts) {
    camera(mat4.identity(model))
    // orbit:
    mat4.rotateX(model, model, orbitx*count)
    mat4.rotateY(model, model, orbity*count)

    mat4.translate(model, model, pos)

    mat4.identity(view)
    mat4.rotateX(view, view, rotx*count)
    mat4.rotateY(view, view, roty*count)

    opts.model = model
    opts.view = view
    return draw(opts)
  }
}
