var column = require('column-mesh')
var regl = require('regl')()
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, { center: [25,0,0] })
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var mat0 = [], v0 = []

var mesh = column({ radius: 2, height: 20 })
var col = fromMesh(mesh)

var batch = []
for (var i = 0; i < 10; i++) {
  batch.push(
    { location: [-i*20,0,20] },
    { location: [-i*20,0,-20] }
  )
}
for (var i = 0; i < 10; i++) {
  batch.push(
    { location: [-400,0,i*30+60] },
    { location: [-400,0,-i*30-60] }
  )
}

var pyramid = fromPyramid({
  positions: [[100,0,-100],[100,0,100],[-100,0,100],[-100,0,-100],[0,100,0]],
  cells: [[0,1,4],[1,2,4],[2,3,4],[0,3,4],[0,1,2],[2,3,0]]
})

regl.frame(() => {
  regl.clear({ color: [0,0,0,1] })
  camera(() => {
    col(batch)
    pyramid({ location: [-500,0,0] })
  })
})

function fromMesh (mesh) {
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal, vpos;
      varying float vtime;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = abs(vnormal) * 0.3
          + vec3(0.2 + sin(vtime + vpos.x/200.0 + vpos.z/300.0),1,1) * 0.3
        ;
        c.y = 1.0;
        gl_FragColor = vec4(hsl2rgb(c), 1.0);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vtime = time;
        gl_Position = projection * view * model * vec4(position, 1.0);
        vpos = vec3(gl_Position);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: (context, props) => {
        var theta = context.time*0.25
        mat4.identity(mat0)
        mat4.translate(mat0, mat0, props.location)
        mat4.rotateY(mat0, mat0, theta)
        return mat0
      },
      time: (context) => context.time,
      location: regl.prop('location')
    },
    elements: mesh.cells
  })
}

function fromPyramid (mesh) {
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal, vpos;
      varying float vtime;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = vec3(abs(
          sin(vtime/20.0 + sin(vnormal * 6.2))
          + sin(vtime + vpos.x/200.0 + vpos.z/300.0)
        ) + vec3(0,0,2));
        c.y = 1.0;
        c.z = sin(length(vpos)/4.0) * 0.5;
        gl_FragColor = vec4(hsl2rgb(c), 1.0);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vtime = time;
        gl_Position = projection * view * model * vec4(position, 1.0);
        vpos = vec3(gl_Position);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: (context, props) => {
        var speed = (1+Math.sin(context.time/8 + 16))/2
        var elev = Math.pow(speed, 4) * 200
        var theta = context.time * speed * 10
        mat4.identity(mat0)
        mat4.translate(mat0, mat0, props.location)
        vec3.set(v0,0,elev,0)
        mat4.translate(mat0, mat0, v0)
        mat4.rotateY(mat0, mat0, theta)
        return mat0
      },
      time: (context) => context.time,
      location: regl.prop('location')
    },
    elements: mesh.cells
  })
}
