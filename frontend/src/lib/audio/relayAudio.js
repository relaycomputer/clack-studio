// ==========================================
// 🔊 CLACK-STUDIO Mechanical Relay Audio Engine
// ==========================================

export class RelayAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.unlocked = false;
    this.attachUnlockListeners();
  }

  attachUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'running') {
        this.unlocked = true;
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev => {
          window.removeEventListener(ev, unlock);
        });
      }
    };
    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev => {
      window.addEventListener(ev, unlock, { once: false, passive: true });
    });
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.unlocked = true;
        }).catch(() => {});
      }
    } catch (e) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.init();
    return this.enabled;
  }

  playClick(pitchVariance = 1.0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;

      // 1. Sharp mechanical impulse noise (the armature hitting the contact)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.012); // 12ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800 * pitchVariance, now);
      bandpass.Q.setValueAtTime(3.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Metallic ping resonance (spring / casing oscillation)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((850 + Math.random() * 150) * pitchVariance, now);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchVariance, now + 0.015);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.015);
      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {}
  }
}

export const audio = new RelayAudioEngine();
