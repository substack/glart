var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  theta: Math.PI/4, phi: 0.8, distance: 20
})
var cube = require('cube-mesh')
var normalize = require('gl-vec3/normalize')
var anormals = require('angle-normals')
var smooth = require('smooth-state')
var mat4 = require('gl-mat4')
var feedback = require('regl-feedback')
var drawfb = feedback(regl, `
  vec3 sample (vec2 uv, sampler2D tex) {
    return 0.7*texture2D(tex, (0.99*(2.0*uv-1.0)+1.0)*0.5).rgb;
  }
`)
var fbtex = regl.texture()

var lights = (function () {
  return regl({
    uniforms: {
      light0: normalize([],[0.2,0.8,-0.2]),
      light1: normalize([],[-0.5,-0.2,0.6]),
      light2: normalize([],[0.8,0.2,0.3]),
    }
  })
})()

var draw = {
  box: box(regl)
}
var init = {}, n = 0, props = []
for (var z = -1; z <= 2; z++) {
  for (var y = -1; y <= 2; y++) {
    for (var x = -1; x <= 2; x++) {
      init['location.'+n] = [x,y,z]
      var m = mat4.identity([])
      mat4.rotateX(m,m,xsin(n,8)*Math.PI)
      mat4.rotateY(m,m,xsin(n,8)*Math.PI)
      mat4.rotateZ(m,m,xsin(n,8)*Math.PI)
      init['xmat.'+n] = m
      props[n] = {}
      n++
    }
  }
}
function update () {
  for (var i = 0; i < n; i++) {
    var pt = state.limit('location.'+i).slice()
    pt[0] = xsin(pt[0]+Math.random()*2+time,2)*2
    pt[1] = xsin(pt[1]+Math.random()*2+time,2)*2
    pt[2] = xsin(pt[2]+Math.random()*2+time,2)*2
    state.set('location.'+i, { value: pt, time: 0.5 })
  }
}
var next = 1
var state = smooth(init)

regl.frame(function (context) {
  var t = time = context.time
  regl.clear({ color: [0,0,0,1], depth: true })
  drawfb({ texture: fbtex })
  lights(function () {
    camera(function () {
      for (var i = 0; i < n; i++) {
        props[i].location = state.get('location.'+i,t)
        props[i].xmat = state.get('xmat.'+i,t)
      }
      draw.box(props)
    })
  })
  fbtex({ copy: true, min: 'linear', mag: 'linear' })
  if (t >= next) {
    update()
    next = t + 4
  }
})

function xsin (x,n) {
  return Math.floor(Math.sin(x)*n)/n
}

function box (regl) {
  var mesh = cube(100,[2,2,2])
  return regl({
    frag: `
      precision mediump float;
      uniform vec3 eye, light0, light1, light2;
      varying vec3 vnorm, vpos;
      uniform float time;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vec3 N = normalize(vnorm);
        vec3 d0 = dot(-normalize(light0-vpos),N)
          * vec3(0,1,1)
          * xsin(time*0.2+floor(
            (xsin(vpos.x,4.0)+xsin(vpos.y,8.0)+xsin(vpos.z,2.0))/3.0),8.0);
        vec3 d1 = dot(-normalize(light1-vpos),N)
          * vec3(1,0,1)
          * xsin(time*0.1+xsin(vpos.x,2.0)+xsin(vpos.y,4.0)+xsin(vpos.z,3.0),4.0);
        vec3 d2 = dot(-normalize(light2-vpos),N)
          *vec3(0.5,0,0.2)*xsin(time*0.3,8.0);
        gl_FragColor = vec4(pow(abs((d0+d1+d2)),vec3(2.2)),1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 position, normal;
      uniform mat4 projection, view, xmat;
      uniform vec3 location;
      varying vec3 vnorm, vpos;
      uniform float time;
      float xsin (float x, float n) {
        return floor(sin(x)*n)*(1.0/n);
      }
      void main () {
        vnorm = normal;
        vec3 dpos = (xmat*vec4(position,1)).xyz;
        float xf = xsin(0.0
          + xsin(dpos.x*4.0+time*2.0,4.0)
          + xsin(dpos.y*4.0+time*2.0,4.0)
          + xsin(dpos.z*2.0+time*1.0,2.0),
          2.0);
        vpos = clamp(position,vec3(-1,-1,-1),vec3(1,1,1))
          + abs(0.1*normal*xf)*xsin(time*0.1+xf,4.0)*4.0 + location*vec3(2.5);
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location'),
      xmat: regl.prop('xmat')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells
  })
}
