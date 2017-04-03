var mat4 = require('gl-mat4')
var glsl = require('glslify')
var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 100, theta: Math.PI/2, phi: 0.1 })
var feedback = require('regl-feedback')

var birds = []
for (var i = 0; i < 100; i++) {
  birds.push({ shift: i, a: 1, b: 1, c: 1, d: 1, e: 0})
}
for (var i = 0; i < 100; i++) {
  birds.push({ shift: i, a: 2, b: 1, c: 1.2, d: 1, e: 0.1})
}
for (var i = 0; i < 100; i++) {
  birds.push({ shift: i, a: -1.2, b: -0.5, c: 1.2, d: 1, e: -0.5})
}
for (var i = 0; i < 100; i++) {
  birds.push({ shift: i, a: 2.2, b: 1.5, c: 1.2, d: 1, e: -1.2})
}
for (var i = 0; i < 100; i++) {
  birds.push({ shift: i, a: 1.1, b: 0.8, c: 1.2, d: 1.1, e: 0.3})
}

var draw = {
  bird: bird(regl),
  fb: feedback(regl, glsl`
    #pragma glslify: snoise = require('glsl-noise/simplex/3d')
    uniform float time;
    vec3 sample (vec2 uv, sampler2D tex) {
      vec3 rgb = texture2D(tex,uv).rgb * 0.9
        + (0.1+(1.0+snoise(vec3(uv,time*0.02)))*0.5)*vec3(0,1,0.8)*0.1;
      return rgb*0.99;
    }
  `)
}
var fbtex = regl.texture()
var timeu = regl({
  uniforms: {
    time: regl.context('time')
  }
})

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  timeu(function () {
    draw.fb({ texture: fbtex })
  })
  camera(function () {
    draw.bird(birds)
    fbtex({ copy: true, min: 'linear', mag: 'linear' })
  })
})

function bird (regl) {
  var model = []
  var mesh = {
    positions: [
      [-1,0,0],
      [0,0,-1],
      [1,0,0],
      [0,0,1],
    ],
    cells: [[0,1,2],[0,3,2]],
    flap: [0,1,0,1]
  }
  return regl({
    frag: `
      precision highp float;
      void main () {
        gl_FragColor = vec4(0,0,0,1);
      }
    `,
    vert: `
      precision highp float;
      attribute vec3 position;
      attribute float flap;
      uniform mat4 projection, view, model;
      uniform float time;
      void main () {
        vec3 vpos = vec3(
          position.x*0.2,
          sin(time*4.0)*flap*0.5,
          position.z
        );
        gl_Position = projection * view * model * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      flap: mesh.flap
    },
    elements: mesh.cells,
    uniforms: {
      time: time,
      model: function (context, props) {
        var t = time(context,props)
        var tt = t * (Math.sin(t*0.01)+1.0)*0.5
        mat4.identity(model)
        mat4.rotateY(model,model,t*0.1)
        var tx = [
          5*props.d-tt*0.5 + props.a,
          Math.cos(t*4.0)*0.15*props.b+tt-50*props.c,
          0 + tt*props.e
        ]
        mat4.translate(model,model,tx)
        mat4.rotateY(model,model,Math.atan2(tx[0],tx[1]))
        return model
      }
    }
  })
  function time (context, props) {
    return context.time + props.shift*2
  }
}
