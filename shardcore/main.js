var regl = require('regl')()
var camera = require('regl-camera')(regl,
  { distance: 75 })
var cubemesh = require('./lib/cube.json')
var anormals = require('angle-normals')
var glsl = require('glslify')
var feedback = require('regl-feedback')

var draw = {
  cube: cube(regl),
  fx: feedback(regl, `
    vec3 sample (vec2 uv, sampler2D tex) {
      vec3 a = 0.995*texture2D(tex,(0.98*(2.0*uv-1.0)+1.0)*0.5).rgb;
      vec3 b = 0.99*texture2D(tex,(1.01*(2.0*uv-1.0)+1.0)*0.5).rgb;
      return a*0.5+b*0.5;
    }
  `)
}
var fbtex = regl.texture()
var locations = []
for (var z = -20; z < 20; z++) {
  for (var y = -20; y < 20; y++) {
    for (var x = -20; x < 20; x++) {
      if (x*x*z*0.2+y*x*0.5+z*y*x*0.2 < 4*4
      && Math.random() < 0.01) {
        locations.push({ location: [x,y,z] })
      }
    }
  }
}

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  draw.fx({ texture: fbtex })
  camera(function () {
    draw.cube(locations)
    fbtex({ copy: true, min: 'linear', mag: 'linear' })
  })
})

function cube (regl) {
  var mesh = cubemesh
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying vec3 vpos, vnorm;
      uniform vec3 eye;
      uniform float time;
      void main () {
        vec3 N = normalize(vnorm);
        float d = 0.0
          + max(0.0,dot(normalize(vec3(0,0,1)),N))*0.5
          + max(0.0,dot(normalize(vec3(-0.2,-0.8,0.4)),N))*0.2
        ;
        vec3 c = hsl2rgb(snoise(vec4(vpos*0.03,time*0.5))*0.2+0.7,1.0,0.5);
        gl_FragColor = vec4(c*d,0.1);
      }
    `,
    vert: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      uniform vec3 location;
      uniform float time;
      void main () {
        vnorm = normal;
        float t = time*0.1;
        vpos = ((position*snoise(vec4(location+position,t))+location)
          * snoise(vec4(location,t))*5.0
          + vec3(
            snoise(vec4(position+location.x,t))*10.0,
            snoise(vec4(position+location.y,t))*10.0,
            snoise(vec4(position+location.z,t))*10.0
          )) * 0.2;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells,mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      location: regl.prop('location'),
      time: regl.context('time')
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}
