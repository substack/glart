var regl = require('regl')()
var feedback = require('regl-feedback')
var glsl = require('glslify')
var mat4 = require('gl-mat4')
var camera = (function () {
  var projection = [], view = []
  var eye = [0,5,0], center = [0,0,0], up = [0,0,1]
  return regl({
    uniforms: {
      projection: function (context) {
        var aspect = context.viewportWidth / context.viewportHeight
        return mat4.perspective(projection, Math.PI/4, aspect, 0.1, 1000)
      },
      view: function (context) {
        var t = context.time*0.2
        if (t % 3 < 1) {
          eye[0] = Math.sin(t)*5
          eye[1] = Math.cos(t)*5
          eye[2] = 0
        } else if (t % 3 < 2) {
          eye[0] = Math.sin(t)*5
          eye[1] = 2.5
          eye[2] = Math.cos(t)*5
        } else {
          eye[0] = 0
          eye[1] = 5
          eye[2] = 0
        }
        return mat4.lookAt(view, eye, center, up)
      },
      time: regl.context('time')
    }
  })
})()

var draw = {
  grid: grid(regl),
  feedback: feedback(regl, `
    uniform float time;
    vec3 sample (vec2 uv, sampler2D tex) {
      float t = (1.0+sin(mod(time*0.1,4.0) + sin(time*0.05)*0.1))
        * (mod(time*0.1,1.0)*0.5+0.5);
      return 0.99*texture2D(tex, (t*(2.0*uv-1.0)+1.0)*0.5).rgb;
    }
  `)
}
var grids = [
  { location: [0,0,0], toffset: 0 },
  { location: [0,-5,0], toffset: 2 },
  { location: [0,-10,0], toffset: 4 },
  { location: [0,-15,0], toffset: 6 },
  { location: [0,-20,0], toffset: 8 },
  { location: [0,-25,0], toffset: 10 },
  { location: [0,-30,0], toffset: 12 },
  { location: [0,-35,0], toffset: 14 },
]

var fbtex = regl.texture()
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.feedback({ texture: fbtex })
    draw.grid(grids)
    fbtex({ copy: true, min: 'linear', mag: 'linear' })
  })
})

function grid (regl) {
  var mesh = { positions: [], cells: [], indexes: [] }
  var dx = 0.01, dy = 0.01
  for (var x = -8; x <= 8; x++) {
    var i = mesh.positions.length
    mesh.cells.push([i+0,i+1,i+2])
    mesh.cells.push([i+3,i+1,i+2])
    mesh.positions.push([x+dx,0,8])
    mesh.positions.push([x-dx,0,8])
    mesh.positions.push([x+dx,0,-8])
    mesh.positions.push([x-dx,0,-8])
    mesh.indexes.push(i,i+1,i+2,i+3)
  }
  for (var y = -8; y <= 8; y++) {
    var i = mesh.positions.length
    mesh.cells.push([i+0,i+1,i+2])
    mesh.cells.push([i+3,i+1,i+2])
    mesh.positions.push([8,0,y+dy])
    mesh.positions.push([8,0,y-dy])
    mesh.positions.push([-8,0,y+dy])
    mesh.positions.push([-8,0,y-dy])
    mesh.indexes.push(i,i+1,i+2,i+3)
  }
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying float vindex;
      uniform float time, toffset;
      void main () {
        vec3 color = vec3(step(vindex,8.0+mod(time*8.0+toffset,16.0)))
          * hsl2rgb(mod(time*0.05+toffset/16.0,1.0)*0.3+0.5,0.5,0.5);
        gl_FragColor = vec4(color,1);
      }
    `,
    vert: glsl`
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 position;
      attribute float index;
      varying float vindex;
      uniform vec3 location;
      void main () {
        vindex = index;
        gl_Position = projection * view * vec4(position+location,1);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      toffset: regl.prop('toffset'),
      location: regl.prop('location')
    },
    attributes: {
      position: mesh.positions,
      index: mesh.indexes
    },
    elements: mesh.cells
  })
}
