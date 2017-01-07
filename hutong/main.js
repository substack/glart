var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  theta: 0.4, phi: -0.2, distance: 10
})
var anormals = require('angle-normals')
var cubemesh = require('cube-mesh')

var draw = {
  sign: sign(regl),
  building: building(regl)
}
var buildings = [
  { location: [7,3,-16], scale: [20,10,20] },
  { location: [-12,3,10], scale: [20,10,20] }
]
for (var x = -150; x < 0; x += (2+nsin(x,4))*20) {
  for (var z = -100; z < 100; z += (2+nsin(z,4))*20.5) {
    if (Math.sqrt(x*x+z*z)<50) continue
    var h = (2+nsin(x*0.23+z*0.31,8))*Math.sqrt(x*x+z*z)*0.4
    buildings.push({
      location: [x,h*0.5-2,z],
      scale: [
        (2+nsin(x*0.3+z*0.2,3))*10,
        h,
        (2+nsin(x*0.17+z*0.31,3))*10
      ]
    })
  }
}

function nsin (x,n) { return Math.floor(Math.sin(x)*n)/n }

regl.frame(function () {
  camera(function () {
    regl.clear({ color: [0,0,0,1], depth: true })
    draw.sign([
      { location: [0,0,3], scale: [0.02,1,1], color: [1,0.1,0.5] },
      { location: [1.2,2,2], scale: [0.02,2,1], color: [0.8,1,0.2] },
      { location: [-2.2,3,-6], scale: [1,1.5,0.02], color: [1,0.5,0] }
    ])
    draw.building(buildings)
  })
})

function building (regl) {
  var mesh = cubemesh(100,[1,1,1])
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos;
      uniform float time;
      uniform vec3 eye, location;
      float nsin (float x, float n) {
        return floor(sin(x)*n)/n;
      }
      void main () {
        vec3 color = vec3(min(1.0,length(location)/70.0-0.5));
        gl_FragColor = vec4(color,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      uniform vec3 eye, location, scale;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      float nsin (float x, float n) {
        return floor(sin(x)*n)/n;
      }
      void main () {
        vpos = clamp(vec3(-0.5),vec3(0.5),position)*scale+location
          + normal*nsin(position.x*3.0+position.y*4.0+position.z*3.2,2.0);
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    uniforms: {
      location: regl.prop('location'),
      scale: regl.prop('scale')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}

function sign (regl) {
  var mesh = cubemesh(10,[1,1,1])
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos;
      uniform float time;
      uniform vec3 location, color;
      float nsin (float x, float n) {
        return floor(sin(x)*n)/n;
      }
      void main () {
        vec3 c0 = color*nsin(0.0
          + nsin(time*0.1+vpos.x*20.0,16.0)*4.0
          + nsin(vpos.x*vpos.x*0.2+vpos.y*vpos.y*0.5+vpos.z*vpos.z*0.2,8.0)
            * (vpos.x*2.0+vpos.y*1.2+vpos.x*2.0+vpos.z*2.7)
          + nsin(time*0.2+vpos.x*vpos.x*0.2+vpos.y*vpos.y*0.3,8.0)*4.0,
          4.0)*0.5+0.5;
        vec3 c1 = color*vec3(
          nsin(time*0.3+nsin(time*sin(vpos.y+vpos.z*1.2+vpos.x*3.0),4.0)*2.0,3.0),
          nsin(time*0.4+nsin(time+nsin(vpos.x+vpos.y*1.1,4.0)*2.0,3.0)*0.2,5.0),
          nsin(time*0.2+nsin(time*(
            (vpos.z*0.2+vpos.y*0.3)*0.2*nsin(vpos.y*vpos.y+vpos.x*vpos.x*3.0,5.0)*5.0)
            +vpos.x*vpos.z*0.7,4.0)*2.0,3.0)
        )*0.5+0.5;
        gl_FragColor = vec4(max(c0,c1),1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      uniform vec3 eye, location, scale;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vpos = clamp(vec3(-0.5),vec3(0.5),position)*scale+location;
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    uniforms: {
      location: regl.prop('location'),
      scale: regl.prop('scale'),
      color: regl.prop('color'),
      time: regl.context('time')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}
