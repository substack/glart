var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  theta: 0.4, phi: -0.2, distance: 10, mouse: false
})
var anormals = require('angle-normals')
var cubemesh = require('cube-mesh')

var draw = {
  sign: sign(regl),
  building: building(regl)
}
var buildings = [
  { location: [7,2,-16], scale: [20,12,20] },
  { location: [-12,2,10], scale: [20,12,20] }
]
for (var x = -150; x < 0; x += (2+nsin(x,4))*20) {
  for (var z = -100; z < 100; z += (2+nsin(z,4))*20.5) {
    if (Math.sqrt(x*x+z*z)<50) continue
    var h = (2+nsin(x*0.23+z*0.31,8))*Math.sqrt(x*x+z*z)*0.4
    buildings.push({
      location: [x,h*0.5-10,z],
      scale: [
        (2+nsin(x*0.3+z*0.2,3))*10,
        h,
        (2+nsin(x*0.17+z*0.31,3))*10
      ]
    })
  }
}
var signs = [
  { location: [0,-0.5,3], scale: [0.02,1,1], color: [1,0.1,0.5] },
  { location: [1.2,2,2], scale: [0.02,2,1], color: [0.8,1,0.2] },
  { location: [2,0.5,3.1], scale: [0.02,1,1.5], color: [0,1,1] },
  { location: [-1,-0.5,1], scale: [0.02,2,0.8], color: [1,1,1] },
  { location: [-2.2,2,-6], scale: [1,1.5,0.02], color: [0.2,0.7,1] },
  { location: [-3,-1,-6], scale: [0.7,2.5,0.02], color: [2,0,0] },
]

function nsin (x,n) { return Math.floor(Math.sin(x)*n)/n }

regl.frame(function () {
  camera(function () {
    regl.clear({ color: [0,0,0,1], depth: true })
    draw.sign(signs)
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
        float mask = clamp(0.0,1.0,length(location)/70.0-0.5);
        vec3 v = vpos+location;
        float light = nsin(v.y*4.0,4.0)
          * (1.0+nsin(nsin(v.x*1.0,2.0)*7.0+nsin(v.z*8.0,3.0)*6.0,2.0))
          * (1.0+nsin(nsin(v.x*v.x*0.01+v.z*4.2,2.0)*2.0
            + nsin(v.x*1.7+v.z*2.0,2.0)*2.0,4.0))
          * (1.0+nsin(v.y*2.0+nsin(v.y*4.0,2.0)*0.7,3.0))
          * (1.0+nsin(v.y*2.0+v.y*0.7*sin(v.y*0.3+location.x)*0.2,8.0))
        ;
        float r = 1.0+nsin(time*1.0+nsin(v.x,2.0)+nsin(v.y,2.1)+nsin(v.z,1.9),4.0);
        vec3 c0 = vec3(0.5+r*0.5,1,1)*light;
        vec3 c1 = pow(length(location)/400.0,2.4)*vec3(1,0.8,0);
        gl_FragColor = vec4(pow(c0*mask+c1,vec3(2.2)),1);
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
        float d = step(0.1,1.0-length(location)/50.0);
        vpos = clamp(vec3(-0.5),vec3(0.5),position)*scale+location
          + d*normal*nsin(position.x*3.0+position.y*4.0+position.z*3.2,2.0);
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    uniforms: {
      location: regl.prop('location'),
      scale: regl.prop('scale'),
      time: regl.context('time')
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
          + nsin(time*0.1+vpos.x*10.0,16.0)*4.0
          + nsin(vpos.x*0.2+vpos.y*vpos.y*0.5+vpos.z*vpos.z*0.2,8.0)
            * (vpos.x*2.0+vpos.y*1.2+vpos.x*2.0+vpos.z*2.7)
          + nsin(time*0.2+vpos.x*0.2+vpos.y*vpos.y*0.3,8.0)*4.0,
          4.0)*0.5+0.5;
        vec3 c1 = color*vec3(
          nsin(time*0.3+nsin(time*sin(vpos.y+vpos.z*0.1+vpos.x*0.4),4.0)*2.0,3.0)
            * nsin(time+vpos.x*4.0,4.0),
          nsin(time*0.4+nsin(time+nsin(vpos.x+vpos.y*0.4,4.0)*2.0,3.0)*0.2,5.0)
            * nsin(time+vpos.z*3.0,4.0),
          nsin(time*0.2+nsin(time*(
            (vpos.z*0.2+vpos.y*0.3)*0.2*nsin(vpos.y*vpos.y+vpos.x*0.5,5.0)*5.0)
            +vpos.x*0.7,4.0)*2.0,3.0)
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
