var side = [0,20,0,30,0,30,20,0]
var alt = [300,200,100,400,200,300,200,600,200,100,200]

module.exports = function (t) {
  t = t % (60*4)
  var s = side[Math.floor(t/2)%side.length]
  var a = alt[Math.floor(t/2)%alt.length]
  var b = alt[Math.floor(t/4)%alt.length]
  var x0 = clamp(tri_(tri_(tri(100),1+sin(2)/8/2),0.5+(1+sin(50))/8/4)
    * (1-saw(4)*0.5+saw(1)*0.5)/2
    * (1-saw(8)*0.5+saw(1)*0.5)/2
    * 8
  ) * 0.1
  var x1 = clamp(saw_(tri(b+s)+(1-saw(8))/2,t*8%1+1.5+(1-saw(1/4)))
    * (1-saw(8))/2 * (1-saw(1))/2 * 4)
    * 0.1
  var x2 = clamp(saw_(tri(b+s)+(1-saw(8))/2,t*8%1+1.5+(1-saw(1/4)))
    * (1-saw(8))/2 * (1-saw(1))/2 * 4)
    * 0.1
  var x3 = clamp(tri_(tri(300+s)*(1-saw(4))/2
    + tri(a+s)*(1-sin(2))/2,t%1+1)*4)*0.1
  var x4 = clamp(tri_(tri(a+b+s)*(1-sin(1/4))/2
    + tri(b+s)*(1-sin(4))/2,t/4%1*2))*0.1
  var x5 = clamp(tri_(tri_(tri((b/2%100+50)+s)*(1-saw(8))/8,.75+(1+sin(2))/8/8),
    1+(1-sin(1)))*(1-saw(1)*0.5+saw(8)*0.5)/2*8)*0.2

  if (t % 64 > 48) return x0*1.5 + x5*1.5
  return x0 + x1*(t>16) + x2*(t>32) + x3*(t>48) + x4*(t>60) + x5*(t>8)

  function tri_ (x,t) { return Math.abs(1 - t % (1/x) * x * 2) * 2 - 1 }
  function tri (x) { return tri_(x,t) }
  function saw_ (x,t) { return t%(1/x)*x*2-1 }
  function saw (x) { return saw_(x,t) }
  function sin_ (x,t) { return Math.sin(2 * Math.PI * t * x) }
  function sin (x) { return sin_(x,t) }
  function sq_ (x,t) { return t*x % 1 < 0.5 ? -1 : 1 }
  function sq (x) { return sq_(x,t) }
  function clamp (x) { return Math.max(-1,Math.min(1,x)) }
}
