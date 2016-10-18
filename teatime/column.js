var glsl = require('glslify')
var column = require('column-mesh')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

module.exports = function (regl) {
  var mesh = column()
  var model = []
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: lambert = require('glsl-diffuse-lambert')
      #pragma glslify: ggx = require('glsl-ggx')
      #pragma glslify: attenuate = require('glsl-light-attenuation')
      uniform mat4 rmat;
      varying vec3 vpos, vnorm;
      uniform vec3 L0, C0, L1, C1, L2, C2;
      uniform float M0, M1, M2;
      void main () {
        vec3 l0 = (rmat * vec4(L0,1)).xyz;
        vec3 l1 = (rmat * vec4(L1,1)).xyz;
        vec3 l2 = (rmat * vec4(L2,1)).xyz;
        vec3 color = vec3(0.9,1,0.8) * (
          lambert(l0,vnorm)*C0*pow(length(l0-vpos),0.25)*0.5
          + lambert(l1,vnorm)*C1*pow(length(l1-vpos),0.25)*0.3
          + lambert(l2,vnorm)*C2*pow(length(l2-vpos),0.25)*0.05
        );
        vec3 spec = vec3(1,0,0.5)
          * ggx(vnorm,vpos,l0,0.3,0.7);
        gl_FragColor = vec4(color+spec,1);
      }
    `,
    vert: glsl`
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform vec3 offset;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vnorm = normal;
        vpos = position;
        gl_Position = projection * view
          * ((model * vec4(position,1)) + vec4(offset,0));
      }
    `,
    uniforms: {
      model: function (context, props) {
        mat4.identity(model)
        mat4.rotateY(model, model, props.rspeed * context.time)
        return model
      },
      rmat: function (context, props) {
        mat4.identity(model)
        mat4.rotateY(model, model, -props.rspeed * context.time)
        return model
      },
      offset: regl.prop('position'),
      L0: regl.prop('lights[0].position'),
      C0: regl.prop('lights[0].color'),
      M0: regl.prop('lights[0].mag'),
      L1: regl.prop('lights[1].position'),
      C1: regl.prop('lights[1].color'),
      M1: regl.prop('lights[1].mag'),
      L2: regl.prop('lights[2].position'),
      C2: regl.prop('lights[2].color'),
      M2: regl.prop('lights[2].mag')
    },
    attributes: {
      normal: anormals(mesh.cells, mesh.positions),
      position: mesh.positions
    },
    elements: mesh.cells
  })
}
