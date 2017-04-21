var glsl = require('glslify')

module.exports = function (regl, assets) {
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: hsl = require('glsl-hsl2rgb')
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform float time;
      uniform sampler2D tex;
      varying vec2 uv;
      void main () {
        float s0 = snoise(vec3(uv,time*0.04));
        float s1 = snoise(vec3(uv*2.0,time*0.1+sin(time*0.05)));
        float h = 0.3+sin(uv.x+sin(uv.y*2.0+s0)*2.0 + s1)*0.2;
        vec3 t0 = texture2D(tex,uv+vec2(s0*0.1,s1*0.1-0.1)).rgb;
        vec3 t1 = texture2D(tex,uv+vec2(s0*0.5,s1*0.5)).rgb;
        vec2 p = uv*2.0-1.0;
        gl_FragColor = vec4((hsl(h,0.2,0.5)*t0
          + t1*pow(length(p),3.0))*0.5, 0.04);
      }
    `,
    vert: glsl`
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = (position+1.0)*0.5;
        gl_Position = vec4(position,0,1);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      tex: regl.texture(assets.bliss)
    },
    attributes: {
      position: [-4,4,-4,-4,4,0]
    },
    count: 3,
    depth: { enable: false },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
  })
}
