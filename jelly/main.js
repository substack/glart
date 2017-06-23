var regl = require('regl')()
var camera = require('regl-camera')(regl,
  { distance: 10, phi: 0.7 })
var icosphere = require('icosphere')
var anormals = require('angle-normals')
var glsl = require('glslify')
var sphere = icosphere(5)

function jelly (regl) {
  var mesh = sphere
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vpos, vnorm;
      uniform float time;
      void main () {
        float h = (0.5+0.5*snoise(vec4(vpos,time*0.1)))*0.2
          + 0.6 - vpos.y*0.1;
        float s = snoise(vec4(vpos*0.7,time))*0.2+0.5;
        float l = snoise(vec4(vpos*1.1,time*0.1))*0.2+0.5;
        vec3 c = hsl2rgb(h,s,l);
        gl_FragColor = vec4(c,0.4);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      attribute vec3 position, normal;
      uniform mat4 projection, view;
      uniform float time, iobj;
      uniform vec3 offset;
      varying vec3 vpos, vnorm;
      void main () {
        float tt = time + iobj*13.0;
        float x = (snoise(vec4(0,0,0,tt*0.1))*0.5+0.5)*0.4+0.1;
        float t = tt*2.5 + sin(tt*x*${Math.PI*2})*0.5;
        float ty = pow(1.0-position.y*0.5+0.5,4.0);
        float q = 8.0;
        float y = max(sin(position.x*q),cos(position.z*q)) * ty;
        vpos = position
          + normal * ty * snoise(vec4(position*0.5,tt)) * 0.05
          + vec3(0,y*0.1,0)
          + vec3(sin(t*0.5+y),0,cos(t*0.5+y))*ty/q*0.2;
        vnorm = normal;
        vec3 p = offset+vpos + vec3(
          sin(tt*0.2)*2.0,
          sin(tt*0.1+40.0)*20.0,
          cos(tt*0.13)*1.7
        );
        gl_Position = projection * view * vec4(p,1);
      }
    `,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    uniforms: {
      iobj: regl.prop('iobj'),
      offset: regl.prop('offset'),
      time: regl.context('time')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}
function bg (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      uniform float time;
      void main () {
        vec2 uv = gl_FragCoord.xy;
        float n0 = snoise(vec3(uv*0.01,time*0.04))*0.5+0.5;
        float n1 = snoise(vec3(uv*0.001,time*0.2))*0.5+0.5;
        float n2 = snoise(vec3(uv*0.05,time*1.0))*0.5+0.5;
        float h = n0*0.3+0.4;
        float l = pow(n1*0.2+n2*0.5+0.6,0.5);
        float s = n0*0.2+n2*0.5+0.2;
        vec3 c = hsl2rgb(h,s,l);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      void main () {
        gl_Position = vec4(position,0,1);
      }
    `,
    uniforms: {
      time: regl.context('time')
    },
    attributes: {
      position: [-4,-4,-4,4,4,0]
    },
    elements: [0,1,2],
    count: 3,
    depth: { enable: false, mask: false }
  })
}

var jellies = []
for (var i = 0; i < 20; i++) {
  var x = (Math.random()*2-1)*20
  var y = (Math.random()*2-1)*20
  var z = (Math.random()*2-1)*20
  jellies.push({ offset: [x,y,z], iobj: i })
}
var draw = {
  jelly: jelly(regl),
  bg: bg(regl)
}
regl.frame(function () {
  regl.clear({ color: [1,1,1,1], depth: true })
  draw.bg()
  camera(function () {
    draw.jelly(jellies)
  })
})
