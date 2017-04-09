var regl = require('regl')()
var camera = require('regl-camera')(regl, { distance: 5 })
var icosphere = require('icosphere')
var glsl = require('glslify')
var fbfx = require('regl-feedback')
var fbtex = regl.texture()

var fbctx = regl({
  uniforms: {
    time: regl.context('time')
  }
})
var draw = {
  sphere: sphere(regl),
  fb: fbfx(regl, glsl`
    #pragma glslify: snoise = require('glsl-noise/simplex/3d')
    #pragma glslify: dither = require('glsl-dither/8x8')
    uniform float time;
    vec3 sample (vec2 uv, sampler2D tex) {
      float t = floor(time*16.0)/16.0 * 0.1;
      vec2 p = uv*2.0-1.0;
      p = p*sin(mod(t*0.1*2.0,1.0)*4.0+1.0) + p*snoise(vec3(p*8.0,t*2.0))*0.005
        + floor(p*snoise(vec3(p,t*4.0))*8.0)/8.0*0.05;
      return dither(uv,pow(floor(texture2D(tex,(0.98*p)*0.5+0.5).rgb
        * vec3(0.999,0.94,0.96)*4.0)/4.0,vec3(0.5))*0.8);
    }
  `)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  fbctx(function () {
    draw.fb({ texture: fbtex })
  })
  camera(function () {
    draw.sphere()
    fbtex({ copy: true, mag: 'linear', min: 'linear' })
  })
})

function sphere (regl) {
  var mesh = icosphere(3)
  return regl({
    frag: glsl`
      precision highp float;
      uniform float time;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: dither = require('glsl-dither/8x8')
      void main () {
        vec2 uv = gl_FragCoord.xy;
        vec2 p = uv*2.0-1.0;
        vec2 p0 = floor(p*0.05)/0.05;
        vec2 p1 = floor(p*0.2)/0.2;
        vec2 p2 = floor(p*0.1)/0.1;
        float t0 = floor(time*8.0)/8.0 + sin(floor(time*2.0));
        float t1 = floor(time*8.0)/8.0 + sin(time*8.0);
        float t2 = floor(time*16.0)/16.0;
        float x = pow((1.0+snoise(vec3(p0*0.5,t0*8.0)))*0.5,4.0)
          + pow((1.0+snoise(vec3(p1*0.02,t1*0.3)))*0.5,4.0)
          + pow((1.0+snoise(vec3(p2*0.005,t2*0.4)))*0.5,2.0)*1.5
          + 0.5;
        float z = 4.0;
        gl_FragColor = vec4(floor(dither(uv,vec3(1,0.9,0.5)*x*0.9)*z)/z,1);
      }
    `,
    vert: glsl`
      precision highp float;
      uniform mat4 projection, view;
      attribute vec3 position;
      void main () {
        gl_Position = projection * view * vec4(position,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    uniforms: {
      time: regl.context('time')
    }
  })
}
