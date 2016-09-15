var vec3 = require('gl-vec3')
var m2mul = require('gl-mat2/multiply.js')

var length = vec3.length, sub = vec3.subtract
var abs = elwise(Math.abs), sqrt = elwise(Math.sqrt)
var vmin = vec3.min, vmax = vec3.max
var min = Math.min, max = Math.max, sin = Math.sin, cos = Math.cos
var tau = Math.PI * 2

function set (v, a, b, c) {
  v[0] = a, v[1] = b, v[2] = c
  return v
}
function m2set (m, a, b, c, d) {
  m[0] = a, m[1] = b, m[2] = c, m[3] = d
  return m
}

var tmpx = [], tmpy = [], tmpz = []
var tmpm = []
var z3 = [0,0,0]

var tmpa = [], tmpb = [], tmpc = []
module.exports = geom

function geom (x,y,z) {
  return min(
    rbox(tmpx,
      twist(tmpm,tmpc,tau,set(tmpa,x,y,z)),
      set(tmpb,0.2,0.6,0.2), 0.01)
    //rbox(tmpx, twist(tmpc,20,set(tmpa,x,y,z)), set(tmpb,0.2,0.6,0.2), 0.01)
  )
}

function twist (tmpm, tmp, a, p) {
  var c = cos(a*p[1])
  var s = sin(a*p[1])
  m2set(tmpm,c,-s,s,c)
  set(tmp, p[0], p[2], 0)
  var q = m2mul(tmp,tmpm,tmp)
  return set(tmp, q[0], q[1], p[1])
}

function rbox (tmp, p, b, r) {
  return length(vmax(tmp,sub(tmp,abs(tmp,p),b),z3))-r;
}

function elwise (f) {
  return function (out, v) {
    out[0] = f(v[0])
    out[1] = f(v[1])
    out[2] = f(v[2])
    return out
  }
}
