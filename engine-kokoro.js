import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = new URL('ort/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;
let tts = null, q = Promise.resolve();
window.NeuralEngine = {
  name: 'Kokoro', mb: 90, ready: false,
  voices: () => (tts ? Object.keys(tts.voices || {}).filter(v => /^(af|am|bf|bm)_/.test(v)) : []),
  async init(cb) {
    if (tts) return;
    const files = {};
    tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8', device: 'wasm',
      progress_callback: p => {
        if (p.status === 'progress' && p.total) {
          files[p.file] = [p.loaded, p.total];
          let l = 0, t = 0;
          for (const k in files) { l += files[k][0]; t += files[k][1]; }
          if (cb) cb(l / t * 100);
        }
      }
    });
  },
  synth(text, speed, voice) {
    const r = q.then(async () => {
      const a = await tts.generate(text, { voice: voice || 'af_heart', speed: speed || 1 });
      return { samples: a.audio, sampleRate: a.sampling_rate };
    });
    q = r.catch(() => {});
    return r;
  }
};
