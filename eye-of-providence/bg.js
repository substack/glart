var fs = require('fs')
var noise = fs.readFileSync(require.resolve('glsl-noise/simplex/3d.glsl'))
var mat4 = require('gl-mat4')

module.exports = function (regl) {
  var iview = [], iproj = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 e;
      ${noise}
      void main () {
        float m = 0.0
          + pow(snoise(e*64.0),16.0)
          + pow(snoise(e*48.0),20.0)
          + pow(snoise(e*32.0),24.0)
          + pow(snoise(e*24.0),16.0)
        ;
        float y = (0.0
          + pow(abs(sin(snoise(e*0.3))),5.0)
          + pow(snoise(e*0.5+3.0),6.0)
          + pow(snoise(e*1.0+8.0),8.0)
          + pow(snoise(e*2.0+8.0),12.0)
        );
        float c = (0.0
          + pow(abs(sin(snoise(e*0.4))),4.0)
          + pow(snoise(e*0.4+17.0),12.0)
          + pow(snoise(e*1.4+20.0),14.0)
        );
        gl_FragColor = vec4(vec3(m,m,m)+vec3(1,0,1)*y+vec3(0,1,1)*c, 1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 position;
      varying vec3 e;
      uniform float aspect, time;
      void main () {
        vec2 uv = position.xy * 2.0 - 1.0;
        e = (vec4(uv.x*aspect,uv.y,time,1)).xyz * 1.0;
        gl_Position = vec4(position,1);
      }
    `,
    attributes: {
      position: [-4,-4,0,-4,4,0,4,0,0]
    },
    uniforms: {
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      },
      time: function (context) { return context.time }
    },
    elements: [[0,1,2]],
    depth: {
      enable: false,
      mask: false
    }
  })
}
