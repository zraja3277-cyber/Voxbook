import { PiperPlus } from 'piper-plus';
import * as ort from 'onnxruntime-web';
ort.env.wasm.wasmPaths = new URL('ort/', import.meta.url).href;
ort.env.wasm.numThreads = 1;
let tts = null, q = Promise.resolve();
window.NeuralEngine = {
  name: 'Piper-plus', mb: 40, ready: false,
  voices: () => [],
  async init(cb) {
    if (tts) return;
    tts = await PiperPlus.initialize({
      model: 'ayousanz/piper-plus-css10-ja-6lang', ort, showModelNotice: false,
      onProgress: p => { if (cb && p) cb((p.progress || 0) * 100); }
    });
  },
  synth(text, speed) {
    const r = q.then(async () => {
      const a = await tts.synthesize(text, { language: 'en', lengthScale: 1 / (speed || 1) });
      return { samples: a.samples, sampleRate: a.sampleRate };
    });
    q = r.catch(() => {});
    return r;
  }
};
