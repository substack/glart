var glsl = require('glslify')
var mesh = require('teapot')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

module.exports = function (regl, opts) {
  var tmp = []
  var model = [], rmat = []
  var envmap = regl.cube(
    opts.right, opts.left,
    opts.top, opts.bottom,
    opts.front, opts.back
  )
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: lambert = require('glsl-diffuse-lambert')
      #pragma glslify: ggx = require('glsl-ggx')
      uniform mat4 rmat;
      varying vec3 vpos, vnorm, vdir;
      uniform vec3 L0, C0, L1, C1, L2, C2;
      uniform float M0, M1, M2;
      uniform samplerCube envmap;
      void main () {
        vec3 l0 = (rmat * vec4(L0,1)).xyz;
        vec3 l1 = (rmat * vec4(L1,1)).xyz;
        vec3 l2 = (rmat * vec4(L2,1)).xyz;
        vec3 scolor = ggx(vnorm,vpos,l0,0.3,0.7)*C0
          + ggx(vnorm,vpos,l1,0.3,0.7)*C1
          + ggx(vnorm,vpos,l2,0.3,0.7)*C2;
        vec3 dcolor = vec3(1,0,0.5) * (
          lambert(l0,vnorm)*C0*0.8
          + lambert(l1,vnorm)*C1*0.4
          + lambert(l2,vnorm)*C2*0.1
        )*0.5;
        vec3 color = dcolor * scolor
          + textureCube(envmap, normalize(vdir)).rgb * vec3(1,0.5,0.7) * 0.8;
        gl_FragColor = vec4(color,1);
      }
    `,
    vert: glsl`
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm, vdir;
      void main () {
        vnorm = normal;
        vpos = position;
        vdir = (view * model * vec4(position*4.0,1)).xyz;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    uniforms: {
      model: function (context, props) {
        mat4.identity(model)
        mat4.identity(tmp)
        mat4.rotateY(tmp, tmp, context.time*props.rspeed)
        mat4.multiply(model, tmp, model)
        var y = props.scale * (props.yscale || 1)
        mat4.scale(model, model, [props.scale,y,props.scale])
        mat4.identity(tmp)
        mat4.translate(tmp, tmp, props.position)
        mat4.multiply(model, tmp, model)
        return model
      },
      rmat: function (context, props) {
        mat4.identity(rmat)
        mat4.rotateY(rmat, rmat, -context.time*props.rspeed)
        return rmat
      },
      L0: regl.prop('lights[0].position'),
      C0: regl.prop('lights[0].color'),
      M0: regl.prop('lights[0].mag'),
      L1: regl.prop('lights[1].position'),
      C1: regl.prop('lights[1].color'),
      M1: regl.prop('lights[1].mag'),
      L2: regl.prop('lights[2].position'),
      C2: regl.prop('lights[2].color'),
      M2: regl.prop('lights[2].mag'),
      envmap: envmap
    },
    attributes: {
      normal: anormals(mesh.cells, mesh.positions),
      position: mesh.positions
    },
    elements: mesh.cells
  })
}
