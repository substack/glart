var fs = require('fs')
var noise = fs.readFileSync(require.resolve('glsl-noise/simplex/3d.glsl'),'utf8')
var mat4 = require('gl-mat4')
var surfaceNets = require('surface-nets')
var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = function (regl) {
  var model = []
  var size = 200, hsize = 12
  var data = ndarray(size*hsize*size,[size,hsize,size])
  fill(data, function (i,j,k) {
    var x = (i/size)*2-1
    var y = (j/hsize)*2-1
    var z = (k/size)*2-1
    var r = 0.3
    return x*x + y*y + z*z - r*r
  })
  var mesh = surfaceNets(data)
  return regl({
    frag: `
      precision mediump float;
      ${noise}
      varying vec3 pos;
      void main () {
        float n = (0.0
          + snoise(pos*150.0)*0.8
          + snoise(pos*64.0)*0.5
          + snoise(pos*16.0)*0.3
          + snoise(pos*2.0)
        )*0.1;
        gl_FragColor = vec4(vec3(n,n,n*0.8),1);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 projection, view, model;
      varying vec3 pos;
      ${noise}
      void main () {
        vec3 p = ((position*vec3(${2/size},${2/hsize},${2/size}))-1.0)
          * vec3(8.0,1.0,8.0) - vec3(0,1.2,0);
        p += snoise(p)*0.1 + snoise(p*16.0)*0.05;
        pos = p;
        gl_Position = projection * view * model * vec4(p,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    uniforms: {
      model: function (context, params) {
        mat4.identity(model)
        mat4.translate(model, model, params.offset)
        mat4.rotateY(model, model, params.angleY)
        return model
      }
    },
    elements: mesh.cells
    //elements: simcom.unique(simcom.skeleton(mesh.cells,1))
  })
}

function sphere (x,y,z,r, px,py,pz) {
  return (x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz) - r*r
}

function cone (x,y,z, rx,ry,rz, px,py,pz) {
  return (length([(x-px)*rx,(y-py)*ry,(z-pz)*rz])-1)
    * min(min(rx,ry),rz)
}
