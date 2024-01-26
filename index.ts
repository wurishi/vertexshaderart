import { GUI } from 'dat.gui';
import * as Stats from 'stats.js';
import { fragment, iSub, vertex } from './lib';
import * as webglUtils from './webgl-utils';

import dst1 from './dst1';

const context = (require as any).context('./art', false, /.ts$/);
const keys = context.keys();

const gui = new GUI();
gui.domElement.style.marginTop = '50px';
const stats = new Stats();
stats.dom.style.left = '';
stats.dom.style.right = '0';
document.body.appendChild(stats.dom);

const div = document.createElement('div');
document.body.appendChild(div);
const link = document.createElement('a');
link.href = '';
link.textContent = 'link';
div.appendChild(link);
const soundT = document.createElement('canvas');
soundT.width = 32;
soundT.height = 32;
div.appendChild(soundT);
const soundC = soundT.getContext('2d');

window.AudioContext = (function () {
  return (
    (window as any).webkitAudioContext ||
    window.AudioContext ||
    (window as any).mozAudioContext
  );
})();

const artFolder = gui.addFolder('ART');
const api = {
  menu: '',
  count: 10000,
  bg: 0,
  type: WebGLRenderingContext.POINTS,
  playSound: false,
};
const menuList: { name: string; sort: number }[] = [];
const menuMap: any = {};
let arr: number[] = [];
for (let i = 1; i <= api.count; i++) {
  arr.push(i);
}

keys.forEach((key: string) => {
  const Cls = context(key).default;
  const sub: iSub = new Cls();
  if (sub.name()) {
    const sort = sub.sort ? sub.sort() : Number.MIN_SAFE_INTEGER;
    const name = `(${sub.sort()}) ${sub.name()}`;
    menuList.push({ name, sort });
    menuMap[name] = sub;
  }
});
menuList.sort((a, b) => a.sort - b.sort);
api.menu = menuList[0].name;
activeSub(menuList[0].name);

artFolder
  .add(
    api,
    'menu',
    menuList.map((v) => v.name)
  )
  .onChange((name) => {
    destoryPrev();
    activeSub(name);
  });
const countList: number[] = [];
for (let i = 1000; i <= 100000; i += 1000) {
  countList.push(i);
}
artFolder.add(api, 'count', countList);
artFolder.addColor(api, 'bg').onChange((color) => {
  updateCanvasBG(color);
});
const guiType = artFolder.add(api, 'type', {
  POINTS: WebGLRenderingContext.POINTS,
  LINE_STRIP: WebGLRenderingContext.LINE_STRIP,
  LINE_LOOP: WebGLRenderingContext.LINE_LOOP,
  LINES: WebGLRenderingContext.LINES,
  TRI_STRIP: WebGLRenderingContext.TRIANGLE_STRIP,
  TRI_FAN: WebGLRenderingContext.TRIANGLE_FAN,
  TRIANGLE: WebGLRenderingContext.TRIANGLES,
});
let audioContext: AudioContext;
let sourceNode: AudioBufferSourceNode;
let analyserNode: AnalyserNode;
let javascriptNode: ScriptProcessorNode;
let amplitudeArray: Uint8Array;

artFolder.add(api, 'playSound').onChange((play) => {
  if (!audioContext) {
    audioContext = new AudioContext();
    sourceNode = audioContext.createBufferSource();
    analyserNode = audioContext.createAnalyser();
    javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);
    amplitudeArray = new Uint8Array(analyserNode.frequencyBinCount);
    sourceNode.connect(audioContext.destination);
    sourceNode.connect(analyserNode);
    analyserNode.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    javascriptNode.onaudioprocess = (evt) => {
      analyserNode.getByteTimeDomainData(amplitudeArray);

      if (api.playSound) {
        dst1(soundC, amplitudeArray);
        // drawSoundTexture(amplitudeArray);
        // drawSoundTexture(evt.inputBuffer.getChannelData(0));
      }
    };

    const playSound = (buffer: AudioBuffer) => {
      sourceNode.buffer = buffer;
      sourceNode.start(0);
      sourceNode.loop = true;
    };

    const request = new XMLHttpRequest();
    request.open('GET', './media/sound.mp3', true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        playSound(buffer);
      });
    };
    request.send();
  }

  if (api.playSound) {
    audioContext.resume();
  } else {
    audioContext.suspend();
  }
});

artFolder.open();

let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let _sub: iSub;

let mouseX: number;
let mouseY: number;
function mouseHandler(evt: MouseEvent) {
  mouseX = evt.clientX;
  mouseY = evt.clientY;
}

function destoryPrev() {
  if (canvas) {
    canvas.removeEventListener('mousemove', mouseHandler);
    document.body.removeChild(canvas);
    canvas = null;
  }
  if (_sub) {
    _sub = null;
  }
  gl = null;
}

// let ci = 0;
// let tmp: number[] = [];
// function drawSoundTexture(arr: Uint8Array) {
//   const len = arr.length;
//   if (ci >= len) {
//     ci = 0;
//     for (let i = 0; i < len; i++) {
//       tmp[i] = arr[i] * 2;
//     }
//   }
//   soundC.clearRect(0, 0, 32, 32);
//   const c = tmp[ci];
//   soundC.fillStyle = '#' + webglUtils.rgbToNumber([c, c, c]);
//   soundC.globalAlpha = c / 256;
//   soundC.fillRect(0, 0, 32, 32);

//   ci++;
// }

let di = 0;
let alpha = 0;
let alphaStep = 10;
let tmp: number[] = [];
function drawSoundTexture(arr: Uint8Array) {
  const len = arr.length;
  soundC.clearRect(0, 0, 32, 32);
  if (alpha <= 0) {
    alphaStep = 10;
    for (let i = 0; i < len; i++) {
      tmp[i] = arr[i] * 2;
      tmp[i] = Math.min(255, tmp[i]);
      tmp[i] = Math.max(0, tmp[i]);
    }
  } else if (alpha >= 256) {
    alphaStep = -10;
  }
  for (let i = 0; i < len; i++) {
    const x = i % 32;
    const y = Math.ceil(i / 32);
    const c = tmp[i];
    const color = webglUtils.rgbToNumber([c, c, c]);
    soundC.fillStyle = '#' + color;
    soundC.globalAlpha = alpha / 255;
    soundC.fillRect(x, y, 1, 1);
  }
  alpha += alphaStep;
}

async function activeSub(name: string) {
  const sub = menuMap[name] as iSub;
  _sub = sub;

  link.href = 'https://www.vertexshaderart.com/art/' + sub.key();
  link.textContent = sub.key();

  canvas = sub.main();
  document.body.appendChild(canvas);
  canvas.addEventListener('mousemove', mouseHandler);
  updateCanvasBG(api.bg);

  gl = canvas.getContext('webgl') as WebGLRenderingContext;

  let v = vertex;
  v = v.replace('{USER_VERTEX}', sub.userVertex());
  const f = fragment;
  const program = webglUtils.createProgram2(gl, v, f);

  const a_pos = webglUtils.getAttribLocation(gl, program, 'a_pos');
  a_pos.setFloat32(new Float32Array(arr));

  const time = webglUtils.getUniformLocation(gl, program, 'time');
  const resolution = webglUtils.getUniformLocation(gl, program, 'resolution');
  const mouse = webglUtils.getUniformLocation(gl, program, 'mouse');
  const vertexCount = webglUtils.getUniformLocation(gl, program, 'vertexCount');
  const sound = webglUtils.getTexture(gl, program, 'sound', soundT, 0);
  const background = webglUtils.getUniformLocation(gl, program, 'background');

  const dType = sub.defaultType ? sub.defaultType() : gl.POINTS;
  guiType && guiType.setValue(dType);

  requestAnimationFrame(render);

  function render(now: number) {
    if (canvas && gl) {
      webglUtils.resizeCanvasToDisplaySize(canvas);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      let update = false;
      if (arr.length > api.count) {
        arr.length = api.count;
        update = true;
      } else if (arr.length < api.count) {
        for (let i = api.count - arr.length; i <= api.count; i++) {
          arr.push(i);
        }
        update = true;
      }
      if (update) {
        a_pos.updateBuffer(new Float32Array(arr));
      }
      a_pos.bindBuffer();

      // sound.updateSource(soundC.getImageData(0, 0, 1024, 1024));
      sound.bindTexture();

      time.uniform1f(now * 0.001);
      resolution.uniform2f(canvas.width, canvas.height);
      mouse.uniform2f(mouseX / canvas.width, mouseY / canvas.height);
      vertexCount.uniform1f(api.count);
      const bg = webglUtils.numberToRGBA(api.bg);
      background.uniform4fv(new Float32Array([...bg, 255]));

      let count = api.count;
      if (
        api.type == gl.LINES ||
        api.type == gl.LINE_LOOP ||
        api.type == gl.LINE_STRIP
      ) {
        if (count % 2 == 1) {
          count--;
        }
      }
      if (
        api.type == gl.TRIANGLE_STRIP ||
        api.type == gl.TRIANGLE_FAN ||
        api.type == gl.TRIANGLES
      ) {
        let tmp = count % 3;
        count -= tmp;
      }
      gl.drawArrays(api.type, 0, count);
    }
    stats.update();
    requestAnimationFrame(render);
  }
}

function updateCanvasBG(c: number) {
  if (canvas) {
    const [r, g, b] = webglUtils.numberToRGBA(c);
    canvas.style.backgroundColor = `rgb(${r},${g},${b})`;
  }
}
