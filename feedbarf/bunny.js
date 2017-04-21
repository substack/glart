var mesh = require('bunny')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var glsl = require('glslify')

module.exports = function (regl) {
  var model = []
  return regl({
    frag: glsl`
      precision mediump float;
      varying vec3 vpos, vnorm;
      void main () {
        gl_FragColor = vec4(abs(vnorm),0.99);
      }
    `,
    vert: glsl`
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vnorm = normal;
        vpos = position;
        gl_Position = projection * view * model * vec4(position*0.1,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      model: function (context) {
        var t = context.time*8
        mat4.identity(model)
        mat4.rotateY(model, model, t/5-Math.sin(t/3))
        return model
      }
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: {
      enable: true
    }
  })
}
