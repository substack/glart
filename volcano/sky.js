var fs = require('fs')
var lookat = fs.readFileSync(require.resolve('glsl-look-at/index.glsl'), 'utf8')

module.exports = function (regl) {
  return regl({
    frag: `
      precision mediump float;
      varying vec2 uv;
      void main () {
        gl_FragColor = vec4((uv.x+1.0)*0.5,0.1,(uv.y+1.0)*0.5,1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
        gl_Position = vec4(position,1,1);
      }
    `,
    attributes: {
      position: [[-5,5],[-5,-5],[5,0]]
    },
    elements: [0,1,2],
    depth: {
      enable: false,
      mask: false
    }
  })
}
