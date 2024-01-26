function init() {
  // http下无法获取
  // localhost可以获取

  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia =
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser')
        );
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  const audioCtx = new window.AudioContext();

  let source;
  let stream;
  let drawVisual;

  const analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  const distortion = audioCtx.createWaveShaper();
  const gainNode = audioCtx.createGain();
  const biquadFilter = audioCtx.createBiquadFilter();
  const convolver = audioCtx.createConvolver();

  let soundSource;

  const ajaxRequest = new XMLHttpRequest();
  ajaxRequest.open('GET', './concert-crowd.ogg', true);
  ajaxRequest.responseType = 'arraybuffer';

  ajaxRequest.onload = function ajaxOnLoad() {
    const audioData = ajaxRequest.response;

    audioCtx.decodeAudioData(
      audioData,
      function decodeAudio(buffer) {
        soundSource = audioCtx.createBufferSource();
        convolver.buffer = buffer;
      },
      function decodeAudioErr(e) {
        console.log('Error with decoding audio data' + e.err);
      }
    );
  };

  ajaxRequest.send();

  const canvas = document.querySelector('#canvas');
  const canvasCtx = canvas.getContext('2d');

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function getUserMedia(stream) {
        source = audioCtx.createMediaStreamSource(stream);

        source.connect(distortion);
        distortion.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        convolver.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        visualize();
        voiceChange();
      })
      .catch(function getUserMediaErr(err) {
        console.log('The following gUM error occured:' + err);
      });
  } else {
    console.log('getUserMedia not supported on your browser!');
  }

  const visualSelect = document.createElement('select');

  function visualize() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const visualSetting = visualSelect.value;
    if (visualSetting === 'sinewave') {
      analyser.fftSize = 2048;
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const draw = function draw() {
        drawVisual = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200,200,200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0,0,0)';

        canvasCtx.beginPath();

        const sliceWidth = (WIDTH * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * HEIGHT) / 2;
          if (i == 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };
      draw();
    } else if (visualSetting === 'frequencybars') {
      analyser.fftSize = 256;
      const bufferLengthAlt = analyser.frequencyBinCount;
      const dataArrayAlt = new Uint8Array(bufferLengthAlt);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const drawAlt = function drawAlt() {
        drawVisual = requestAnimationFrame(drawAlt);

        analyser.getByteFrequencyData(dataArrayAlt);

        canvasCtx.fillStyle = 'rgb(0,0,0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLengthAlt; i++) {
          barHeight = dataArrayAlt[i];

          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(
            x,
            HEIGHT - barHeight / 2,
            barWidth,
            barHeight / 2
          );

          x += barWidth + 1;
        }
      };
      drawAlt();
    } else {
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.fillStyle = 'red';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  const voiceSelect = document.createElement('select');

  function voiceChange() {
    distortion.oversample = '4x';
    biquadFilter.gain.setTargetAtTime(0, audioCtx.currentTime, 0);

    const voiceSetting = voiceSelect.value;
    if (voiceSetting === 'convolver') {
      biquadFilter.disconnect(0);
      biquadFilter.connect(convolver);
    } else {
      biquadFilter.disconnect(0);
      biquadFilter.connect(gainNode);

      if (voiceSetting === 'distortion') {
        distortion.curve = makeDistortionCurve(400);
      } else if (voiceSetting === 'biquad') {
        biquadFilter.type = 'lowshelf';
        biquadFilter.frequency.setTargetAtTime(1000, audioCtx.currentTime, 0);
        biquadFilter.gain.setTargetAtTime(25, audioCtx.currentTime, 0);
      } else if (voiceSetting === 'off') {
        console.log('Voice settings turned off');
      }
    }
  }

  function makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; i++) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  !(function initUI() {
    const voiceMute = document.createElement('button');
    voiceMute.innerHTML = 'Mute';
    voiceMute.onclick = () => {
      if (voiceMute.id === '') {
        gainNode.gain.value = 0;
        voiceMute.id = 'activated';
        voiceMute.innerHTML = 'Unmute';
      } else {
        gainNode.gain.value = 1;
        voiceMute.id = '';
        voiceMute.innerHTML = 'Mute';
      }
    };

    visualSelect.onchange = () => {
      cancelAnimationFrame(drawVisual);
      visualize();
    };
    ['sinewave', 'frequencybars', 'off'].forEach((visual) => {
      const option = document.createElement('option');
      option.value = visual;
      option.label = visual;
      visualSelect.appendChild(option);
    });

    voiceSelect.onchange = () => {
      voiceChange();
    };
    ['convolver', 'distortion', 'biquad', 'off'].forEach((voice) => {
      const option = document.createElement('option');
      option.value = voice;
      option.label = voice;
      voiceSelect.appendChild(option);
    });

    document.body.appendChild(visualSelect);
    document.body.appendChild(voiceSelect);
    document.body.appendChild(voiceMute);
  })();
}

function main() {
  const clickFn = () => {
    document.body.removeEventListener('click', clickFn);
    init();
  };
  document.body.addEventListener('click', clickFn);
}
