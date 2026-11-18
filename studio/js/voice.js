// Sprachaufnahme (Web Speech API) + animierte Siri-artige Wellenform.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const speechSupported = !!SR;

export class Recorder {
  constructor({ onText, onEnd, onError }) {
    this.onText = onText; this.onEnd = onEnd; this.onError = onError;
    this.finalText = ''; this.level = 0; this.active = false;
    this.analyser = null; this.stream = null;
  }

  async start(seed = '') {
    this.finalText = seed ? seed.trim() + ' ' : '';
    this.active = true;
    if (SR) {
      const rec = new SR();
      rec.lang = 'de-DE'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) this.finalText += r[0].transcript.trim() + ' ';
          else interim += r[0].transcript;
        }
        this.bump(0.9);
        this.onText?.(this.finalText, interim);
      };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        this.onError?.(e.error === 'not-allowed' ? 'Mikrofon-Zugriff verweigert.' : 'Spracherkennung nicht verfügbar.');
      };
      // Safari & Chrome beenden gelegentlich selbst – solange aktiv, neu starten
      rec.onend = () => { if (this.active) { try { rec.start(); } catch {} } else this.onEnd?.(this.finalText.trim()); };
      this.rec = rec;
      try { rec.start(); } catch (err) { this.onError?.('Spracherkennung konnte nicht starten.'); }
    }
    // Echter Pegel nur auf Desktop – mobil blockiert ein paralleler Mic-Stream oft die Erkennung
    const isTouch = matchMedia('(pointer: coarse)').matches;
    if (!isTouch && navigator.mediaDevices?.getUserMedia) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(this.stream);
        this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512;
        src.connect(this.analyser); this.ctx = ctx;
        this.buf = new Uint8Array(this.analyser.fftSize);
      } catch {}
    }
  }

  bump(v) { this.level = Math.max(this.level, v); }

  sample() {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.buf);
      let sum = 0;
      for (const v of this.buf) { const x = (v - 128) / 128; sum += x * x; }
      const rms = Math.sqrt(sum / this.buf.length);
      this.level = Math.max(this.level * 0.9, Math.min(1, rms * 5));
    } else {
      this.level *= 0.94;
      if (this.active) this.level = Math.max(this.level, 0.18 + Math.random() * 0.12);
    }
    return this.level;
  }

  stop() {
    this.active = false;
    try { this.rec?.stop(); } catch {}
    this.stream?.getTracks().forEach((t) => t.stop());
    try { this.ctx?.close(); } catch {}
    if (!SR) this.onEnd?.(this.finalText.trim());
  }
}

/** Mehrfarbige, additive Wellenform (Canvas). */
export function startWave(canvas, getLevel) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let raf, t = 0, smooth = 0.1;
  const layers = [
    { color: [255, 70, 90], speed: 1.1, freq: 1.6, phase: 0, amp: 1 },
    { color: [60, 220, 140], speed: 0.8, freq: 2.1, phase: 2, amp: 0.8 },
    { color: [40, 110, 255], speed: 1.4, freq: 1.3, phase: 4, amp: 1.1 },
    { color: [180, 120, 255], speed: 0.6, freq: 2.6, phase: 1, amp: 0.6 },
  ];
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const draw = () => {
    const w = canvas.width, h = canvas.height, mid = h / 2;
    smooth += (getLevel() - smooth) * 0.12;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const L of layers) {
      const amp = (h * 0.42) * (0.08 + smooth * 0.92) * L.amp;
      const grad = ctx.createLinearGradient(0, mid - amp, 0, mid + amp);
      const [r, g, b] = L.color;
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},0.55)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      for (let x = 0; x <= w; x += 4 * dpr) {
        const nx = x / w;
        const env = Math.pow(Math.sin(Math.PI * nx), 2.2); // zu den Rändern auslaufen
        const y = Math.sin(nx * Math.PI * 2 * L.freq + t * L.speed + L.phase) * amp * env;
        ctx.lineTo(x, mid - Math.abs(y));
      }
      for (let x = w; x >= 0; x -= 4 * dpr) {
        const nx = x / w;
        const env = Math.pow(Math.sin(Math.PI * nx), 2.2);
        const y = Math.sin(nx * Math.PI * 2 * L.freq + t * L.speed + L.phase) * amp * env;
        ctx.lineTo(x, mid + Math.abs(y) * 0.85);
      }
      ctx.closePath(); ctx.fill();
    }
    // Weiße Kernlinie
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3 * dpr) {
      const nx = x / w;
      const env = Math.pow(Math.sin(Math.PI * nx), 3);
      const y = Math.sin(nx * Math.PI * 3 + t * 1.7) * (h * 0.12) * smooth * env;
      x === 0 ? ctx.moveTo(x, mid + y) : ctx.lineTo(x, mid + y);
    }
    ctx.stroke();
    t += 0.045;
    raf = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}
