var glsl = require('glslify')
var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 3, theta: -1.35, far: 5000
})
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var icosphere = require('icosphere')
var feedback = require('regl-feedback')

var resl = require('resl')
resl({
  manifest: {
    suit: {
      type: 'text',
      src: 'MKIII.obj.json',
      parser: JSON.parse
    },
    /*
    robot: {
      type: 'text',
      src: 'R2_withLegs.json',
      parser: JSON.parse
    }
    */
  },
  onDone: ready
})

function ready (assets) {
  var draw = {
    suit: mmodel(regl, assets.suit),
    //robot: mmodel(regl, assets.robot)
    earth: earth(regl),
    bg: bg(regl)
  }
  var suits = { single: [], many: [] }
  for (var i = 0; i < 40; i++) {
    var theta = Math.random() * 2 * Math.PI
    var phi = Math.random() * 2 * Math.PI
    var r = Math.random() * 10 + 3
    suits.many.push({
      init: [ Math.cos(theta)*r, Math.sin(phi)*r, Math.sin(theta)*r ],
      rspeed: Math.exp(Math.random()*3-2),
      speed: Math.exp(Math.random()-4),
      vector: vec3.random([]),
      axis: vec3.random([])
    })
  }
  suits.single.push({
    init: [4.6,-1,-2],
    rspeed: 2,
    speed: 0,
    vector: [0,0,-1],
    axis: [1,0.1,0]
  })
  var tex = regl.texture()
  var drawfb = feedback(regl, `
    vec3 sample (vec2 uv, sampler2D tex) {
      return 0.9*texture2D(tex,(0.99*(2.0*uv-1.0)+1.0)*0.5).rgb;
    }
  `)
  regl.frame(function (context) {
    regl.clear({ color: [0,0,0,1], depth: true })
    drawfb({ texture: tex })
    camera(function () {
      draw.bg()
      if (context.time % 16 > 8) {
        draw.suit(suits.many)
      } else draw.suit(suits.single)
      draw.earth()
      //draw.robot({ offset: [0,0,0] })
      tex({ copy: true, min: 'linear', mag: 'linear' })
    })
  })
}

function mmodel (regl, mesh) {
  var model = [], vtmp = [], mtmp = []
  return regl({
    frag: glsl`
      precision mediump float;
      varying vec2 vuv;
      void main () {
        gl_FragColor = vec4(vuv,1,1);
      }
    `,
    vert: glsl`
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform vec3 offset;
      attribute vec3 position, normal;
      attribute vec2 uv;
      varying vec2 vuv;
      void main () {
        vuv = uv;
        gl_Position = projection * view * model * vec4(position+offset,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: mesh.vertexNormals,
      uv: mesh.vertexUVs
    },
    elements: mesh.cells,
    uniforms: {
      offset: function (context, props) {
        vec3.copy(vtmp, props.vector)
        vec3.scale(vtmp, vtmp, props.speed*context.time)
        vec3.add(vtmp, props.init, vtmp)
        return vtmp
      },
      model: function (context, props) {
        mat4.identity(model)
        mat4.rotate(model, model, props.rspeed * context.time * 0.1, props.axis)
        return model
      }
    }
  })
}

function earth (regl) {
  var mesh = icosphere(4)
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: atmosphere = require('glsl-atmosphere')
      uniform vec3 eye;
      varying vec3 vpos;
      void main () {
        vec3 pos = normalize(vpos);
        vec3 vscatter = atmosphere(
          eye-pos+vec3(-1,0,0),
          pos*6372e3,
          vec3(-0.5,0,0.4),
          22.0,
          6372e3,
          6472e3,
          vec3(5.5e-6,13.0e-6,22.4e-6), // rayleigh scattering
          21e-6, // mie scattering
          8e3, // rayleight scale height
          1.2e3, // mie scale height
          0.758 //  mie scattering direction
        );
        gl_FragColor = vec4(vscatter,length(vscatter)*0.5);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 position;
      varying vec3 vpos;
      void main () {
        vpos = position;
        gl_Position = projection * view
          * vec4((position + vec3(0.9,0.5,2))*100.0,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}

function bg (regl) {
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec2 uv;
      uniform vec3 eye;
      uniform float time;
      void main () {
        vec3 p = normalize(eye);
        vec2 spos = vec2(asin(p.x), atan(p.z,-p.y)) + uv;
        float x = snoise(vec3(spos,time*0.4))
          + snoise(vec3(spos*8.0,time*0.2))
        ;
        float y = snoise(vec3(spos*128.0,time*4.0));
        gl_FragColor = vec4(vec3(0.5,0.3,1)*x
          + vec3(0,0.4,1)*y,0.03);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = (position+1.0)*0.5;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: {
      position: [-4,4,-4,-4,4,0]
    },
    count: 3,
    uniforms: {
      time: regl.context('time')
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: { mask: false }
  })
}
