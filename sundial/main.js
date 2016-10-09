var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var glx = require('glslify')
var feedback = require('./fb.js')

var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 3, phi: -Math.PI/2
})
var tex = regl.texture()
var draw = {
  shapes: [5,9,4,16,3,8,32].map(function (steps) {
    return shape(regl,steps)
  }),
  feedback: feedback(regl, { steps: 8 })
}
var colors = [[0,1,1],[1,0,0.5],[0,1,0.5],[0,0.5,1],[1,0.5,0],[1,0,1]]
regl.frame(function (context) {
  regl.clear({ color: [0,0,0,1], depth: true })
  draw.feedback({ texture: tex, spread: 1.4 })
  camera(function () {
    var si = Math.floor(context.time*0.5%draw.shapes.length)
    var ci = Math.floor(context.time%colors.length)
    draw.shapes[si]({ color: colors[ci] })
    tex({ copy: true, mag: 'linear', min: 'linear' })
  })
})

function shape (regl, steps) {
  var mesh = { positions: [], cells: [] }
  var path = [[-1.0,0.0],[-0.8,0.3],[-0.5,0.7],[-0.3,0.9],[-0.1,0.2]]
  var mrot = [], len = path.length
  for (var i = 0; i < steps; i++) {
    var theta = 2*Math.PI*i/steps
    mat4.identity(mrot)
    mat4.rotateY(mrot,mrot,theta)
    for (var j = 0; j < len; j++) {
      var pt = [path[j][0],path[j][1],0]
      vec3.transformMat4(pt, pt, mrot)
      mesh.positions.push(pt)
      mesh.cells.push([i*len+j,i*len+(j+1)%len,(i+1)%steps*len+j])
    }
  }
  var model = []
  return regl({
    frag: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying vec3 vpos;
      uniform vec3 color;
      uniform float time;
      void main () {
        float c = snoise(vec3(vpos.xz,time));
        gl_FragColor = vec4(color*pow(1.0-length(vpos),c*0.2),1);
      }
    `,
    vert: glx`
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float aspect;
      attribute vec3 position;
      varying vec3 vpos;
      void main () {
        mat4 m = projection * view * model;
        vpos = position;
        gl_Position = m*vec4(position,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    uniforms: {
      model: function (context) {
        var t = context.time*0.25
        mat4.identity(model)
        mat4.rotateY(model,model,-(t-Math.pow(Math.sin(t)/2,2)*4)*2)
        return model
      },
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      },
      color: regl.prop('color'),
      time: regl.context('time')
    },
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    },
    elements: mesh.cells
  })
}
