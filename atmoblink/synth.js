module.exports = function createSynth (options) {
  const regl = options.regl
  const context = options.audioContext

  const shaderCode = options.shader
  const filterCode = options.filter
  const contextVars = options.context || {}

  const bufferSize = options.size || 1024
  const inputChannels = 0
  const outputChannels = 1
  const sampleRate = context.sampleRate

  const scriptNode = context.createScriptProcessor(
    bufferSize,
    inputChannels,
    outputChannels)

  const stateBuffer = Array(2).fill().map(() =>
    regl.framebuffer({
      color: regl.texture({
        shape: [bufferSize, 1, 4],
        format: 'rgba',
        type: 'float',
        wrap: 'repeat',
        mag: regl.hasExtension('OES_texture_float_linear')
          ? 'linear'
          : 'nearest'
      }),
      depthStencil: false
    }))

  const outputBuffer = regl.framebuffer({
    shape: [bufferSize, 1, 4],
    depthStencil: false
  })

  const baseUniforms = {
    timeOffsetBase: regl.prop('timeOffsetBase'),
    timeOffsetScale: regl.prop('timeOffsetScale')
  }

  const generateSound = regl({
    framebuffer: regl.prop('activeBuffer'),

    vert: `
    precision highp float;
    attribute vec2 position;
    uniform float timeOffsetBase, timeOffsetScale;
    varying float offsetTime_;

    void main () {
      offsetTime_ = timeOffsetBase + timeOffsetScale * 0.5 * (position.x + 1.0);
      gl_Position = vec4(position, 0, 1);
    }
    `,

    frag: `
    precision highp float;
    varying float offsetTime_;

    ${shaderCode}

    void main () {
      gl_FragColor = vec4(pcm(offsetTime_), 0, 0, 1);
    }`,

    context: contextVars,
    depth: {
      enable: false,
      mask: false
    },
    attributes: {
      position: [
        -4, 0,
        4, 4,
        4, -4
      ]
    },
    uniforms: Object.assign(baseUniforms, options.uniforms || {}),
    count: 3,
    primitive: 'triangles',
    elements: null
  })

  const filterSound = regl({
    vert: `
    precision highp float;
    attribute vec2 position;
    varying float shift;

    void main () {
      shift = 0.5 * (position.x + 1.0);
      gl_Position = vec4(position, 0, 1);
    }
    `,

    frag: `
    precision highp float;
    varying float offsetTime_;

    #define SAMPLE_COUNT ${bufferSize}
    uniform sampler2D buffer[2];
    varying float shift;

    float sample (float delay) {
      float t = shift - delay / float(SAMPLE_COUNT);
      return mix(
        texture2D(buffer[1], vec2(t, 0.0)).r,
        texture2D(buffer[0], vec2(t + 1.0, 0.0)).r,
        step(t, 0.0));
    }

    ${filterCode}

    #define FLOAT_MAX  1.70141184e38
    #define FLOAT_MIN  1.17549435e-38

    lowp vec4 encode_float(highp float v) {
      highp float av = abs(v);

      //Handle special cases
      if(av < FLOAT_MIN) {
        return vec4(0.0, 0.0, 0.0, 0.0);
      } else if(v > FLOAT_MAX) {
        return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;
      } else if(v < -FLOAT_MAX) {
        return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;
      }

      highp vec4 c = vec4(0,0,0,0);

      //Compute exponent and mantissa
      highp float e = floor(log2(av));
      highp float m = av * pow(2.0, -e) - 1.0;

      //Unpack mantissa
      c[1] = floor(128.0 * m);
      m -= c[1] / 128.0;
      c[2] = floor(32768.0 * m);
      m -= c[2] / 32768.0;
      c[3] = floor(8388608.0 * m);

      //Unpack exponent
      highp float ebias = e + 127.0;
      c[0] = floor(ebias / 2.0);
      ebias -= c[0] * 2.0;
      c[1] += floor(ebias) * 128.0;

      //Unpack sign bit
      c[0] += 128.0 * step(0.0, -v);

      //Scale back to range
      return c.abgr / 255.0;
    }

    void main () {
      gl_FragColor = encode_float(filter());
    }
    `,

    context: contextVars,
    depth: {
      enable: false,
      mask: false
    },
    attributes: {
      position: [
        -4, 0,
        4, 4,
        4, -4
      ]
    },
    uniforms: Object.assign(
      baseUniforms,
      options.uniforms || {}, {
        'buffer[0]': regl.prop('prevBuffer'),
        'buffer[1]': regl.prop('curBuffer')
      }),
    count: 3,
    primitive: 'triangles',
    elements: null
  })

  const setFBO = regl({
    framebuffer: outputBuffer
  })

  let clockTime = 0
  let audioTick = 0
  scriptNode.onaudioprocess = function (event) {
    const outputBuffer = event.outputBuffer.getChannelData(0)

    generateSound({
      timeOffsetBase: clockTime,
      timeOffsetScale: outputBuffer.length / sampleRate,
      activeBuffer: stateBuffer[audioTick % 2]
    })

    setFBO(() => {
      filterSound({
        prevBuffer: stateBuffer[(audioTick + 1) % 2],
        curBuffer: stateBuffer[audioTick % 2]
      })
      regl.read({
        data: new Uint8Array(outputBuffer.buffer)
      })
    })

    clockTime += outputBuffer.length / sampleRate
    audioTick = audioTick + 1
  }

  return scriptNode
}
