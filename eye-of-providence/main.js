var surfaceNets = require('surface-nets')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var sphere = require('sphere-mesh')
var glx = require('glslify')

var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  phi: 0.25,
  theta: 0.5,
  distance: 400
})
var mat4 = require('gl-mat4')
var normals = require('angle-normals')
var bg = require('./bg.js')

var state = { distance: 0, offset: 0 }
var time = 0
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 0x20) { // space bar
    state.distance = Math.max(1000, state.distance + 200)
    state.offset = time
  }
})

var draw = {
  base: base(),
  top: top(),
  eye: eye(),
  bg: bg(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    regl.draw(function (context) {
      var n = Math.sin(context.time - state.offset)
      var d = Math.pow(n,3)*state.distance
      state.distance *= 0.95
      time = context.time
      draw.bg()
      draw.base({ distance: d })
      draw.top({ distance: d })
      draw.eye({ distance: d })
    })
  })
})

function eye () {
  var mesh = sphere(10,10)
  var model = [], iview = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 pos;
      varying float ftime;
      void main () {
        float x = pos.x/100.0;
        float y = pos.y/100.0;
        float z = pos.z/100.0;
        float v = sin(pow(x*x + y*y + z*z,2.0))
          * step(0.25,1.0-abs(y)*100.0*pow(sin(sin(ftime*0.1)*5.0),5.0))
        ;
        float r = v / sin(x*x+y*y+z*z);
        gl_FragColor = vec4(r,v,v,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model, iview;
      uniform float time;
      varying float ftime;
      attribute vec3 position;
      varying vec3 pos;
      void main () {
        pos = (iview * vec4(position,1)).xyz;
        ftime = time;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        mat4.translate(model, model, [0,57,0])
        return model
      },
      iview: function (context) {
        mat4.invert(iview, context.view)
        return context.view
      },
      time: function (context) {
        return context.time
      }
    },
    elements: mesh.cells
  })
}

function top () {
  var positions = [
    [-25,45,-25],
    [-25,45,25],
    [25,45,25],
    [25,45,-25],
    [0,75,0]
  ]
  var cells = [
    [0,1],[1,2],[2,3],[3,0],
    [0,1],[1,4],[1,2],[2,4],
    [2,3],[3,4],[3,0],[0,4]
  ]
  var model = []
  return regl({
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(0,1,1,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position;
      void main () {
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: positions
    },
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        mat4.rotateY(model, model, context.time)
        return model
      }
    },
    elements: cells
  })
}

function base () {
  var positions = [
    [-100,-50,-100],
    [100,-50,-100],
    [100,-50,100],
    [-100,-50,100],
    [-30,40,-30],
    [30,40,-30],
    [30,40,30],
    [-30,40,30]
  ]
  var cells = [
    [0,1,2],[2,3,0],
    [0,1,4],[1,4,5],
    [1,2,5],[2,5,6],
    [2,3,6],[3,6,7],
    [3,0,7],[0,7,4],
    [4,5,6],[6,7,4]
  ]
  var model = []
  return regl({
    frag: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec3 norm, pos;
      uniform float time;
      void main () {
        float dy = step(0.5,mod(pos.y/32.0,1.0)) * 3.0;
        vec3 v = (vec3(0,0.5,1) * (0.0
          + pow(abs(sin((abs(pos.x*0.5)+dy)*0.25)),1600.0)
          + pow(abs(sin((abs(pos.z*0.5)+dy)*0.25)),1600.0)
          + pow(abs(sin((abs(pos.x*1.0))*0.5)),400.0)
          + pow(abs(sin((abs(pos.z*1.0))*0.5)),400.0)
        ));
        vec3 r = abs(sin(snoise(vec3(
          pos.x/32.0, pos.y/32.0-time*0.2, pos.z/32.0
        ))))*vec3(0.4,0.1,0.4);
        r += vec3(1,0,1) * (1.0-length(v)) * 0.1;
        gl_FragColor = vec4(v+r,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 norm, pos;
      void main () {
        norm = normal;
        pos = position;
        gl_Position = projection * view * model * vec4(position, 1);
      }
    `,
    attributes: {
      position: positions,
      normal: normals(cells, positions)
    },
    elements: cells,
    uniforms: {
      model: function (context, props) {
        mat4.identity(model)
        mat4.rotateY(model, model, -context.time)
        mat4.translate(model, model, [0,0,props.distance])
        return model
      },
      time: function (context) { return context.time }
    }
  })
}
