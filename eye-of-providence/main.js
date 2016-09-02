var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,0,0],
  eye: [0,0,-1],
  distance: 300
})
var mat4 = require('gl-mat4')
var normals = require('angle-normals')

var draw = {
  base: base(),
  top: top()
}
regl.frame(function () {
  camera(function () {
    draw.base()
    draw.top()
  })
})

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
        gl_FragColor = vec4(0,1,0,1);
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
      model: function () {
        mat4.identity(model)
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
    frag: `
      precision mediump float;
      varying vec3 norm, pos;
      void main () {
        float dy = step(0.5,mod(pos.y/32.0,1.0)) * 3.0;
        vec3 v = vec3(1,1,1) - (vec3(0.1,0.4,0.5) * (0.0
          + pow(abs(sin((abs(pos.x*0.5)+dy)*0.25)),1600.0)
          + pow(abs(sin((abs(pos.z*0.5)+dy)*0.25)),1600.0)
          + pow(abs(sin((abs(pos.x*1.0))*0.5)),400.0)
          + pow(abs(sin((abs(pos.z*1.0))*0.5)),400.0)
        ));
        gl_FragColor = vec4(v,1);
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
      model: function (context) {
        mat4.identity(model)
        return model
      }
    }
  })
}
