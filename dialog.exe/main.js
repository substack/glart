var regl = require('regl')()
var resl = require('resl')
var glsl = require('glslify')

resl({
  manifest: {
    icons: {
      type: 'image',
      src: 'icons.png'
    }
  },
  onDone: ready
})

function ready (assets) {
  draw.icon = icon(regl, regl.texture(assets.icons))
}
var icons = []
for (var i = 0; i < 1226; i++) {
  icons.push({
    icon: i,
    seed: i,
    wander: Math.random()+0.4,
    speed: i/1000+0.2,
    offset: [0,0]
  })
}
var rects = dialog()

function dialog () {
  var rects = []
  var border = 0.006
  var titleheight = 0.04
  rects.push({
    w: -0.3,
    s: -0.15,
    e: 0.3,
    n: 0.15,
    color: [0.75,0.75,0.75]
  })
  rects.push({
    w: -0.3+border/2,
    s: 0.15-titleheight,
    e: 0.3-border/2,
    n: 0.15-border,
    color: [0,0,0.5]
  })
  rects.push({
    w: -0.3,
    s: 0.15-border*2/3,
    e: 0.3,
    n: 0.15,
    color: [1,1,1]
  })
  rects.push({
    w: -0.3,
    s: -0.15,
    e: -0.3+border*2/3,
    n: 0.15,
    color: [1,1,1]
  })
  rects.push({
    w: -0.3,
    s: -0.15,
    e: 0.3,
    n: -0.15+border*2/3,
    color: [0.5,0.5,0.5]
  })
  rects.push({
    w: 0.3+border*2/3,
    s: -0.15,
    e: 0.3,
    n: 0.15,
    color: [0.5,0.5,0.5]
  })
  return rects
}

var draw = {
  rect: rect(regl)
}
regl.frame(function (context) {
  regl.clear({ color: [0,0.5,0.5,1] })
  if (draw.icon) draw.icon(icons)
  draw.rect(rects)
  if (draw.icon) draw.icon({
    icon: 510,
    seed: context.time*4,
    wander: 0.01,
    speed: 200,
    offset: [-0.2,0]
  })
})

function icon (regl, icons) {
  var size = 0.05
  var w = -size
  var s = -size
  var e = size
  var n = size
  return regl({
    frag: `
      precision highp float;
      uniform sampler2D icons;
      uniform float icon;
      varying vec2 vcoord;
      void main () {
        vec2 px = vec2(mod(icon,36.0),floor(icon/35.0));
        vec2 p = ((vcoord*vec2(1,-1)*0.5+0.5)*0.99+0.005+px)/vec2(1152.0/32.0,1120.0/32.0);
        vec4 c = texture2D(icons, p).rgba;
        gl_FragColor = c;
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      attribute vec2 position, coord;
      uniform float time, seed, aspect, wander, speed;
      uniform vec2 offset;
      varying vec2 vcoord;
      void main () {
        vcoord = coord;
        float x = snoise(vec3(vcoord*0.001,time*speed*0.02+seed));
        vec2 p = position*vec2(1,aspect) + vec2(
          sin(x*1.12+seed*31.5)*0.5
            + sin(x*4.2+seed*40.0)*0.5,
          sin(x*0.91-seed*21.2)*0.5
            + sin(x*1.4-seed*17.1)*0.5
        )*wander + offset;
        gl_Position = vec4(p,0,1);
      }
    `,
    uniforms: {
      icons: icons,
      aspect: function (context, props) {
        return context.viewportWidth / context.viewportHeight
      },
      wander: regl.prop('wander'),
      speed: regl.prop('speed'),
      icon: regl.prop('icon'),
      seed: regl.prop('seed'),
      offset: regl.prop('offset'),
      time: regl.context('time')
    },
    attributes: {
      position: [[w,s],[w,n],[e,n],[e,s]],
      coord: [[-1,-1],[-1,1],[1,1],[1,-1]]
    },
    elements: [[0,1,2],[0,2,3]],
    depth: { mask: false, enable: false },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}

function rect (regl) {
  var pos = [[0,0],[0,0],[0,0],[0,0]]
  return regl({
    frag: `
      precision highp float;
      uniform vec3 color;
      void main () {
        gl_FragColor = vec4(color,1);
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
      color: regl.prop('color')
    },
    attributes: {
      position: function (context, props) {
        var aspect = context.viewportWidth / context.viewportHeight
        pos[0][0] = props.w
        pos[0][1] = props.s * aspect
        pos[1][0] = props.w
        pos[1][1] = props.n * aspect
        pos[2][0] = props.e
        pos[2][1] = props.n * aspect
        pos[3][0] = props.e
        pos[3][1] = props.s * aspect
        return pos
      }
    },
    elements: [[0,1,2],[0,2,3]],
    depth: {
      mask: false,
      enable: false
    }
  })
}
