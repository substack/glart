var regl = require('regl')()
var resl = require('resl')
var glsl = require('glslify')
var vtext = require('vectorize-text')

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
var d0 = callDialog()
var d1 = problemDialog()
var d2 = musicDialog()

function musicDialog () {
  var rects = []
  var texts = {}
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
  texts.playerName = {
    color: [1,1,1,1],
    offset: [-0.28,0.095],
    size: 0.25
  }
  texts.songName = {
    color: [0,0,0,1],
    offset: [-0.28,0.095-0.05],
    size: 0.25
  }
  raised(-0.3,-0.15,0.3,0.15)
  var names = ['play','pause','stop']
  for (var i = 0; i < 3; i++) {
    var y0 = 0.05 - i*0.06
    var y1 = y0 + 0.05
    raised(0.12,y0,0.28,y1)
    texts[names[i]] = {
      color: [0,0,0,1],
      offset: [0.14,y0-0.01],
      size: 0.25
    }
  }
  return { rects: rects, texts: texts }
  function raised (w,s,e,n) {
    rects.push({
      w: w,
      s: n,
      e: e,
      n: n-border*2/3,
      color: [1,1,1]
    })
    rects.push({
      w: w,
      s: s,
      e: e,
      n: s+border*2/3,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: e,
      s: s,
      e: e+border*2/3,
      n: n,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: w+border*2/3,
      s: s,
      e: w,
      n: n,
      color: [1,1,1]
    })
  }
}

function problemDialog () {
  var rects = []
  var texts = {}
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
  texts.problem = {
    color: [1,1,1,1],
    offset: [-0.28,0.095],
    size: 0.25
  }
  texts.longProblem = {
    color: [0,0,0,1],
    offset: [-0.28,0.095-0.05],
    size: 0.25
  }
  raised(-0.3,-0.15,0.3,0.15)
  var names = ['ok','cancel']
  for (var i = 0; i < 2; i++) {
    var y0 = 0.05 - i*0.06
    var y1 = y0 + 0.05
    raised(0.12,y0,0.28,y1)
    texts[names[i]] = {
      color: [0,0,0,1],
      offset: [0.14,y0-0.01],
      size: 0.25
    }
  }
  return { rects: rects, texts: texts }
  function raised (w,s,e,n) {
    rects.push({
      w: w,
      s: n,
      e: e,
      n: n-border*2/3,
      color: [1,1,1]
    })
    rects.push({
      w: w,
      s: s,
      e: e,
      n: s+border*2/3,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: e,
      s: s,
      e: e+border*2/3,
      n: n,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: w+border*2/3,
      s: s,
      e: w,
      n: n,
      color: [1,1,1]
    })
  }
}

function callDialog () {
  var rects = []
  var texts = {}
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
  texts.incoming = {
    color: [1,1,1,1],
    offset: [-0.28,0.095],
    size: 0.25
  }
  texts.call = {
    color: [0,0,0,1],
    offset: [-0.28,0.095-0.05],
    size: 0.25
  }
  raised(-0.3,-0.15,0.3,0.15)
  var names = ['ok','cancel','exit','exist']
  for (var i = 0; i < 4; i++) {
    var y0 = 0.05 - i*0.06
    var y1 = y0 + 0.05
    raised(0.12,y0,0.28,y1)
    texts[names[i]] = {
      color: [0,0,0,1],
      offset: [0.14,y0-0.01],
      size: 0.25
    }
  }
  return { rects: rects, texts: texts }
  function raised (w,s,e,n) {
    rects.push({
      w: w,
      s: n,
      e: e,
      n: n-border*2/3,
      color: [1,1,1]
    })
    rects.push({
      w: w,
      s: s,
      e: e,
      n: s+border*2/3,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: e,
      s: s,
      e: e+border*2/3,
      n: n,
      color: [0.5,0.5,0.5]
    })
    rects.push({
      w: w+border*2/3,
      s: s,
      e: w,
      n: n,
      color: [1,1,1]
    })
  }
}

function text (regl, msg) {
  var mesh = vtext(msg, { font: 'arial', triangles: true })
  return regl({
    frag: `
      precision highp float;
      uniform vec4 color;
      void main () {
        gl_FragColor = color;
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      uniform float aspect, size;
      uniform vec2 offset, dpos;
      void main () {
        vec2 p = offset * vec2(1,aspect) + dpos;
        gl_Position = vec4(position*vec2(1,-aspect)*size*0.1+p,0,1);
      }
    `,
    uniforms: {
      color: regl.prop('color'),
      offset: regl.prop('offset'),
      size: regl.prop('size'),
      aspect: function (context, props) {
        return context.viewportWidth / context.viewportHeight
      }
    },
    depth: { enable: false, mask: false },
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells
  })
}

var draw = {
  rect: rect(regl),
  text: {
    incoming: text(regl, 'INCOMING'),
    problem: text(regl, 'PROBLEM'),
    playerName: text(regl, 'MUSIC PLAYER'),
    songName: text(regl, 'DEEPER~1.WAV'),
    longProblem: text(regl, 'There was a problem.'),
    ok: text(regl, 'OKAY'),
    cancel: text(regl, 'CANCEL'),
    redial: text(regl, 'REDIAL'),
    exit: text(regl, 'REDIAL'),
    exist: text(regl, 'HANG UP'),
    call: text(regl, 'Computer telephone.'),
    play: text(regl, 'play'),
    pause: text(regl, 'pause'),
    stop: text(regl, 'stop')
  }
}
var dpos = [0,0]
var setDpos0 = regl({
  uniforms: {
    dpos: function (context) {
      var q = 10
      dpos[0] = Math.floor((
        Math.sin(context.time*0.1+4)
        + Math.sin(context.time*0.2+17)
      )*q)/q/2+0.25
      dpos[1] = Math.floor((
        Math.sin(context.time*0.1+31)
        + Math.sin(context.time*0.15-17)
      )*q)/q/2+0.25
      return dpos
    }
  }
})
var setDpos1 = regl({
  uniforms: {
    dpos: function (context) {
      var q = 10
      dpos[0] = Math.floor((
        Math.sin(context.time*0.2+15)
        + Math.sin(context.time*0.3-4)
      )*q)/q/3+0.25
      dpos[1] = Math.floor((
        Math.sin(context.time*0.2-15)
        + Math.sin(context.time*0.25+20)
      )*q)/q/3+0.25
      return dpos
    }
  }
})
var setDpos2 = regl({
  uniforms: {
    dpos: function (context) {
      var q = 5
      dpos[0] = Math.floor((
        Math.sin(context.time*0.2+25)
        + Math.sin(context.time*0.3-15)
      )*q)/q/3+0.25
      dpos[1] = Math.floor((
        Math.sin(context.time*0.2-5)
        + Math.sin(context.time*0.25+2)
      )*q)/q/3+0.25
      return dpos
    }
  }
})
var iconNum = 0
var soundIcons = [187,650,417,605,610,620,187,621,623,650,625,627,650,652,664]
// 269 my computer
// 349 iexplore.exe
window.addEventListener('keydown', function (ev) {
  if (ev.code === 'ArrowLeft') {
    iconNum = (iconNum - 1 + 1220) % 1220
  } else if (ev.code === 'ArrowRight') {
    iconNum = (iconNum + 1) % 1220
  }
  console.log(iconNum)
})

var setZeroDpos = regl({ uniforms: { dpos: [0,0] } })
regl.frame(function (context) {
  regl.clear({ color: [0,0.5,0.5,1] })
  setZeroDpos(function () {
    if (draw.icon) draw.icon(icons)
  })
  setDpos0(function () {
    draw.rect(d0.rects)
    Object.keys(d0.texts).forEach(function (key) {
      draw.text[key](d0.texts[key])
    })
    if (draw.icon) draw.icon({
      icon: 510,
      seed: context.time*4,
      wander: 0.01,
      speed: 200,
      offset: [-0.2,-0.05]
    })
  })
  setDpos1(function () {
    draw.rect(d1.rects)
    Object.keys(d1.texts).forEach(function (key) {
      draw.text[key](d1.texts[key])
    })
    var t = Math.floor(context.time*4)
    if (draw.icon) draw.icon({
      icon: (t*139+t*137)%1200,
      seed: context.time*4,
      wander: 0.01,
      speed: 200,
      offset: [-0.2,-0.05]
    })
  })
  setDpos2(function () {
    draw.rect(d2.rects)
    Object.keys(d2.texts).forEach(function (key) {
      draw.text[key](d2.texts[key])
    })
    var t = Math.floor(context.time)
    if (draw.icon) draw.icon({
      icon: soundIcons[Math.floor(context.time)%soundIcons.length],
      seed: context.time*4,
      wander: 0.01,
      speed: 200,
      offset: [-0.2,-0.05]
    })
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
      uniform vec2 offset, dpos;
      varying vec2 vcoord;
      void main () {
        vcoord = coord;
        float x = snoise(vec3(vcoord*0.001,time*speed*0.02+seed));
        vec2 p = position*vec2(1,aspect) + vec2(
          sin(x*1.12+seed*31.5)*0.5
            + sin(x*4.2+seed*40.0)*0.5,
          sin(x*0.91-seed*21.2)*0.5
            + sin(x*1.4-seed*17.1)*0.5
        )*wander + offset + dpos;
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
      uniform vec2 dpos;
      void main () {
        gl_Position = vec4(position+dpos,0,1);
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
