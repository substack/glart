module.exports = function (regl, opts) {
  return regl({
    frag: `
      precision mediump float;
      uniform sampler2D tex;
      uniform float time, spread;
      varying vec2 uv;
      void main () {
        float d = 0.001;
        vec3 c = texture2D(tex,uv).rgb;
        const int steps = ${opts.steps};
        for (int i = 0; i < steps; i++) {
          c += texture2D(tex,uv+vec2(d,d)).rgb;
          c += texture2D(tex,uv+vec2(-d,d)).rgb;
          c += texture2D(tex,uv+vec2(d,-d)).rgb;
          c += texture2D(tex,uv+vec2(-d,-d)).rgb;
          d *= spread;
        }
        gl_FragColor = vec4(c*0.95/(1.0+float(steps)*4.0),1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = (1.0+position)*0.5;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: {
      position: [-4,4,-4,-4,4,0]
    },
    uniforms: {
      tex: regl.prop('texture'),
      time: regl.context('time'),
      spread: regl.prop('spread')
    },
    count: 3,
    depth: { enable: false },
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    }
  })
}
