var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,-1,0],
  distance: 3
})
var fs = require('fs')
var noise = fs.readFileSync(require.resolve('glsl-noise/simplex/3d.glsl'),'utf8')
var ndarray = require('ndarray')
var normals = require('angle-normals')
var fill = require('ndarray-fill')
var surfaceNets = require('surface-nets')
var simcom = require('simplicial-complex')
var mat4 = require('gl-mat4')
var dot = require('gl-vec3/dot')
var length = require('gl-vec3/length')

var min = Math.min, max = Math.max

var model = []
var size = 64
var data = ndarray(new Float32Array(size*size*size),[size,size,size])
fill(data, function (i,j,k) {
  var x = (i/size)*2-1
  var y = (j/size)*2-1
  var z = (k/size)*2-1
  //return x*x + y*y + z*z - 0.4
  //return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
  return min(
    cone(x,y,z, 1+2/size,4,1+2/size, 0,-1,0),
    max(
      sphere(x,y,z,0.7, 0,-1.2,0),
      -sphere(x,y,z,0.25, 0,-0.6,0)
    )
  )
})
var mesh = surfaceNets(data)

function sphere (x,y,z,r, px,py,pz) {
  return (x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz) - r*r
}

function cone (x,y,z, rx,ry,rz, px,py,pz) {
  return (length([(x-px)*rx,(y-py)*ry,(z-pz)*rz])-1)
    * min(min(rx,ry),rz)
}

var volcano = regl({
  frag: `
    precision mediump float;
    varying vec3 vnorm;
    void main () {
      gl_FragColor = vec4(abs(vnorm) * vec3(0.5,0.5,1),1);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec3 position, normal;
    uniform mat4 projection, view, model;
    varying vec3 vnorm;
    void main () {
      vnorm = normal;
      vec3 pos = (position * ${2/size.toFixed(1)})-1.0;
      gl_Position = projection * view * model * vec4(pos,1);
    }
  `,
  attributes: {
    position: mesh.positions,
    normal: normals(mesh.cells, mesh.positions)
  },
  uniforms: {
    model: function () {
      return mat4.identity(model)
    }
  },
  elements: mesh.cells
  //elements: simcom.unique(simcom.skeleton(mesh.cells,1))
})
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    volcano()
  })
})
