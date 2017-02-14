var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  distance: 20, theta: 0.1, phi: 0.2
})
var glsl = require('glslify')
var anormals = require('angle-normals')
var icosphere = require('icosphere')
var grid = require('grid-mesh')
var draw = {
  lava: lava(regl),
  water: water(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.lava()
    draw.water()
  })
})

function water (regl) {
  var size = 30
  var mesh = grid(size,size,[-1,-1],[2/size,0],[0,2/size])
  return regl({
    frag: `
      precision highp float;
      varying vec3 vpos;
      void main () {
        float d = max(0.0,8.0-length(vpos.xz+vec2(0,-2)));
        vec3 c = vec3(1,0.5,0)*pow(d*0.1,4.0)*0.5;
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      uniform mat4 projection, view;
      uniform float time;
      attribute vec2 position;
      varying vec3 vpos;
      void main () {
        vpos = vec3(position.x*20.0,-2.0,position.y*20.0)
          + vec3(0,snoise(vec4(position.x,0,position.y,time*0.5)),0);
        gl_Position = projection * view * vec4(vpos,1);
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

function lava (regl) {
  var mesh = icosphere(3)
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnorm, vpos;
      uniform float time;
      void main () {
        float d = pow((1.0
          + snoise(vec4(vpos*2.0+vec3(0,time*3.0,-time*0.5),time*0.8)))*0.5
          * (1.0+snoise(vec4(vpos*4.0+vec3(0,time*3.0,-time*0.5),time*2.0)))*0.5,
          1.8);
        gl_FragColor = vec4(vec3(1,0.5,0)*(1.0-d),1);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      uniform mat4 projection, view;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vnorm = normal;
        vec3 pos = position;
        vec3 p = vec3(
          pos.x*0.8,
          pos.y*3.0+sin(pos.z*2.0+0.5)*0.5-0.5,
          pos.z*0.4+cos(pos.y*pos.y*0.5+pos.y*0.5+0.5)*4.0-2.0
            + pow(pos.y+0.5,2.0)
        );
        vpos = p + vnorm * snoise(vec4(p*1.0,time*2.0))*0.05;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells,mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      time: regl.context('time')
    }
  })
}
