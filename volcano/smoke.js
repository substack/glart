var mat4 = require('gl-mat4')
var fs = require('fs')
var snoise = fs.readFileSync(require.resolve('glsl-noise/simplex/3d.glsl'),'utf8')
var cnoise = fs.readFileSync(require.resolve('glsl-curl-noise/curl.glsl'),'utf8')
var sphere = require('sphere-mesh')

module.exports = function (regl) {
  var model = []
  var mesh = sphere(20, 1)
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos;
      uniform float time;
      ${snoise}
      ${cnoise}
      void main () {
        float l = snoise(curlNoise(vpos*1.0+vec3(0,-time*0.05,0)));
        gl_FragColor = vec4(l,l,l,(l-(1.0+vpos.y*1.0))*0.2);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position;
      varying vec3 vpos;
      void main () {
        vpos = position;
        vec3 vdis = vec3(
          sin(vpos.y*20.0+time*0.2),
          0,
          sin(vpos.y*19.0+time*0.2)
        )*0.1 + vec3(0,0,pow((vpos.y+1.0)*2.0,2.0));
        gl_Position = projection * view * model
          * vec4(position + vdis,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    uniforms: {
      model: function (context, params) {
        mat4.identity(model)
        mat4.scale(model, model, [0.5,3,0.5])
        mat4.translate(model, model, [-1.1,0.75,0])
        mat4.translate(model, model, params.offset)
        mat4.rotateY(model, model, params.angleY)
        return model
      },
      time: regl.context('time')
    },
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    }
  })
}
