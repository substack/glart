var createSynth = require('./synth.js')

module.exports = function (regl) {
  var audioContext = new AudioContext
  createSynth({
    regl,
    audioContext,
    shader: `
      float pcm (float t) {
        return sin(t*${2*Math.PI*400});
      }
    `,
    filter: `
      float filter () {
        return sample(0.0);
      }
    `
  }).connect(audioContext.destination)
}
