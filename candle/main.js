var regl = require('regl')()
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var surfaceNets = require('surface-nets')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')
var normals = require('angle-normals')
var sphereMesh = require('sphere-mesh')

var fs = require('fs')
var snoise = fs.readFileSync(require.resolve('glsl-noise/simplex/3d.glsl'),'utf8')
var cnoise = fs.readFileSync(require.resolve('glsl-curl-noise/curl.glsl'),'utf8')

var min = Math.min, max = Math.max, abs = Math.abs, sqrt = Math.sqrt
function dot (ax,ay,az,bx,by,bz) { return ax*bx+ay*by+az*bz }
function length (x,y,z) { return sqrt(x*x+y*y+z*z) }
function sign (x) { return x > 0 ? 1 : -1 }

var camera = require('regl-camera')(regl, {
  center: [0,1,0],
  phi: 0.3,
  distance: 5
})

var draw = {
  candle: candle(regl),
  base: base(regl),
  flame: flame(regl)
}

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.candle()
    draw.base()
    draw.flame()
  })
})

function build (regl, res, f) {
  var data = ndarray(new Float64Array(res*res*res),[res,res,res])
  return surfaceNets(fill(data, function (i,j,k) {
    return f(i/63*2-1,j/63*2-1,k/63*2-1)
  }))
}

function flame (regl) {
  var model = []
  var mesh = sphereMesh(20,0.25)
  return regl({
    frag: `
      precision mediump float;
      ${snoise}
      ${cnoise}
      uniform float time;
      varying vec3 vpos;
      void main () {
        float c = snoise(curlNoise(vpos-vec3(0,time*0.25,0)));
        gl_FragColor = vec4(sqrt(vec3(1,0.8,0.5)*(c+1.0)),0.5);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position;
      varying vec3 vpos;
      ${snoise}
      void main () {
        vec3 offset = vec3(0,-1.6,0);
        float c = (snoise(position*2.0-vec3(0,time*1.0,0))*2.0-1.0)*0.1+0.5;
        vpos = (position - offset) * vec3(0.5,1.0,0.5)
          * vec3(c,1.0,c) + vec3(0,position.y/32.0-sin(time*32.0)*0.003,0);
        gl_Position = projection * view * model * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        mat4.scale(model, model, [
          1,1+(Math.sin(context.time*0.4)+Math.sin(context.time*2.1)*0.4)*0.03,1
        ])
        return model
      },
      time: regl.context('time')
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    },
    depth: {
      mask: false
    }
  })
}
function candle (regl) {
  var model = []
  var mesh = build(regl, 128, function (x,y,z) {
    return cylinder(x,y,z, 0.15,0.7)
  })
  return regl({
    frag: `
      precision mediump float;
      ${snoise}
      varying vec3 vnorm, vpos;
      uniform float time;
      void main () {
        float l = clamp(0.0,1.0,pow(dot(normalize(vec3(-0.8,0.4,0.3)),vnorm),1.5)
          + snoise(vpos*0.1)*0.1
          + abs(snoise(vpos*0.1+vec3(0,time*0.01,0))
            * pow(vpos.y/32.0-1.0+0.2,6.0)+1.0)*0.5*0.2
            * (1.0 + sin(time*32.0)*0.1 + sin(time*4.0)*0.1)
        );
        vec3 c = vec3(l,l,l) * vec3(0.9,0.4,0.4) * 0.8;
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision mediump float;
      ${snoise}
      uniform mat4 projection, view, model;
      uniform vec3 offset;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vnorm = normal;
        float h = pow(abs(position.y/32.0),3.0);
        float dy = snoise(position*0.2+time*0.25)*0.2;
        float dx = snoise(position*0.25+vec3(0,time*0.05,0)*2.0)*0.4 * h;
        float dz = snoise(position*0.22+vec3(0,time*0.05,0)*2.0)*0.4 * h;
        vpos = (position - offset) + vec3(dx,dy,dz);
        gl_Position = projection * view * model * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: function () {
        mat4.identity(model)
        mat4.scale(model, model, [2/64,2/64,2/64])
        mat4.translate(model, model, [-32,-32,-32])
        return model
      },
      offset: [0,-20,0],
      time: regl.context('time')
    },
    elements: mesh.cells
  })
}

function base (regl) {
  var model = []
  var mesh = build(regl, 64, function (x,y,z) {
    return min(
      ccone(x,y+0.5,z,0.15,0.2,0.3),
      cylinder(x,y+0.5,z,0.12,0.3),
      ccone(x,-0.3-y,z,0.15,0.2,0.3),
      sphere(x,y*2+0.3,z,0.25),
      sphere(x,y*2+0.65,z,0.2),
      sphere(x,y*3+1.8,z,0.2)
    )
  })
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main () {
        float l = pow(dot(normalize(vec3(-0.8,0.4,0.3)),vnorm),8.0);
        vec3 c = vec3(l,l,l);
        gl_FragColor = vec4(c*vec3(1,0.6,0),1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        vnorm = normal;
        vpos = position;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: function () {
        mat4.identity(model)
        mat4.scale(model, model, [2/64,2/64,2/64])
        mat4.translate(model, model, [-32,-32,-32])
        return model
      }
    },
    elements: mesh.cells
  })
}

function cylinder (x,y,z,w,h) {
  var dx = abs(length(x,z,0)) - w
  var dy = abs(y) - h
  return min(max(dx,dy),0) + length(max(dx,0),max(dy,0),0)
}
function sphere (x,y,z,r) {
  return x*x + y*y + z*z - r*r
}

function ccone (x,y,z,cx,cy,cz) {
  var qx = length(x,z,0)
  var qy = y
  var vx = cz*cy/cx
  var vy = -cz
  var wx = vx - qx
  var wy = vy - qy
  var vvx = dot(vx,vy,0,vx,vy,0)
  var vvy = vx*vx
  var qvx = dot(vx,vy,0,wx,wy,0)
  var qvy = vx*wx
  var dx = max(qvx,0)*qvx/vvx
  var dy = max(qvy,0)*qvy/vvy
  return sqrt(dot(wx,wy,0,wx,wy,0) - max(dx,dy)) * sign(max(qy*vx-qx*vy,wy))
}
