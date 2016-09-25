var createSynth = require('./synth.js')

module.exports = function (regl) {
  var audioContext = new AudioContext
  createSynth({
    regl,
    audioContext,
    size: 4096,
    shader: `
      float sin_ (float x, float t) {
        return sin(t*${2*Math.PI}*x);
      }
      float saw (float x, float t) {
        return mod(t,1.0/x)*x*2.0-1.0;
      }
      float pcm (float t) {
        float s12 = (1.0-saw(1.0/2.0,t))*0.5;
        float s14 = (1.0-saw(1.0/4.0,t))*0.5;
        float s18 = (1.0-saw(1.0/8.0,t))*0.5;
        float s1 = (1.0-saw(1.0,t))*0.5;
        float s2 = (1.0-saw(2.0,t))*0.5;
        float s4 = (1.0-saw(4.0,t))*0.5;
        float s8 = (1.0-saw(8.0,t))*0.5;
        return 0.0
          + clamp(sin_(sin_(100.0,t)+sin_(50.0,t),mod(t,1.0))
            * pow(s1,8.0)*4.0,-1.0,1.0) * 1.0
            * step(mod(t,8.0),4.0)
          + clamp(sin_(sin_(200.0,t)+sin_(50.0,t),mod(t,1.0)+s4)
            * pow(s8,8.0)*1.0,-1.0,1.0) * 0.1
          + clamp(sin_(sin_(200.0,t)+sin_(50.0+sin_(10.0,t),mod(t,1.0)/4.0),s1)
            * pow(s4,4.0)*1.0,-1.0,1.0) * 0.1
          + clamp(sin_(sin_(20.0,t)+sin_(4.0*sin_(10.0,mod(t,1.0)+sin_(2.0,t)*4.0)
            + sin_(80.0,t),mod(t,1.0)/8.0),s1)
            * pow(max(s12,s1),8.0)*1.0,-1.0,1.0) * 0.2
          + clamp(sin_(sin_(200.0,t)+sin_(100.0,t),mod(t,1.0))
            * pow(s14,4.0)*1.0,-1.0,1.0) * 0.2
          + clamp(sin_(sin_(400.0+sin_(10.0,t),mod(t,1.0))+sin_(100.0,t),mod(t,1.0))
            * pow(s18,8.0)*1.0,-1.0,1.0) * 0.2
            * step(mod(t,16.0),12.0)
          + clamp(sin_(sin_(400.0,t)+sin_(200.0,t)+sin_(50.0,t),
            mod(t,1.0)*0.5+sin_(0.25,t)*0.1)
            * pow(max(s2,s8),8.0)*4.0,-1.0,1.0) * 0.05
            * step(mod(t,16.0),12.0)
        ;
      }
    `,
    filter: `
      float filter () {
        return sample(0.0);
      }
    `
  }).connect(audioContext.destination)
}
