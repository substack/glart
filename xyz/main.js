var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 4, minDistance: 2, maxDistance: 5
})
var icosphere = require('icosphere')
var mat4 = require('gl-mat4')
var wireframe = require('screen-projected-lines')
var glx = require('glslify')
var xtend = require('xtend')

var ftex = regl.texture()
var fb = regl.framebuffer({ color: ftex })
var draw = {
  blob: regl(blob(regl)),
  blur: regl(blob(regl), { framebuffer: fb }),
  feedback: feedback(regl)
}
regl.frame(function () {
  draw.feedback()
  camera(function () {
    draw.blob()
    ftex({ copy: true, mag: 'linear', min: 'linear' })
  })
})

function feedback (regl) {
  return regl({
    frag: `
      precision mediump float;
      uniform sampler2D texture;
      uniform float time;
      varying vec2 uv;
      void main () {
        float d = 0.001;
        vec3 c = texture2D(texture,uv).rgb;
        const int n = 4;
        for (int i = 0; i < n; i++) {
          c += texture2D(texture,uv+vec2(d,d)).rgb;
          c += texture2D(texture,uv+vec2(-d,d)).rgb;
          c += texture2D(texture,uv+vec2(d,-d)).rgb;
          c += texture2D(texture,uv+vec2(-d,-d)).rgb;
          d *= 2.0;
        }
        gl_FragColor = vec4(c*0.9/(1.0+float(n)*4.0),1);
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
      texture: ftex,
      time: regl.context('time')
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

function blob (regl) {
  var model = []
  var mesh = wireframe(icosphere(3))
  return {
    frag: glx`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      #pragma glslify: hsl = require('glsl-hsl2rgb')
      varying vec3 vpos;
      uniform float time;
      void main () {
        vec3 vnorm = normalize(vpos);
        float l = pow(abs(snoise(vec4(vpos,time*0.2))),0.25)
          *0.35+0.6;
        vec3 c = hsl(l,1.0,l*0.8);
        gl_FragColor = vec4(pow(c,vec3(2.2)),1);
      }
    `,
    vert: glx`
      precision mediump float;
      #pragma glslify: linevoffset = require('screen-projected-lines')
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      uniform mat4 projection, view, model;
      attribute vec3 position, nextpos;
      attribute float direction;
      uniform float aspect, time;
      varying vec3 vpos;
      vec3 xpos (vec3 p) {
        return (1.0 + snoise(vec4(p,time*0.2))*0.4) * p;
      }
      void main () {
        mat4 proj = projection * view * model;
        vec4 p = proj*vec4(xpos(position),1);
        vec4 n = proj*vec4(xpos(nextpos),1);
        vec4 offset = linevoffset(p, n, direction, aspect);
        vpos = position;
        gl_Position = p + offset*0.005;
      }
    `,
    attributes: {
      position: mesh.positions,
      nextpos: mesh.nextPositions,
      direction: mesh.directions
    },
    elements: mesh.cells,
    uniforms: {
      model: function (context) {
        var t = context.time*0.5
        var r = t/2-Math.sin(2*t)/4
        mat4.identity(model)
        mat4.rotateY(model,model,r)
        return model
      },
      time: regl.context('time'),
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      }
    }
  }
}
