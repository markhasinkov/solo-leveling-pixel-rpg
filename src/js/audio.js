// audio.js — синтезированные звуки на WebAudio, без внешних файлов.
(function () {
  'use strict';

  let ctx = null;
  let master = null;

  const AudioFX = {
    muted: false,
    ready: false,

    init(muted) {
      this.muted = !!muted;
      const unlock = () => {
        this.ensure();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
    },

    ensure() {
      if (this.ready) {
        if (ctx && ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.16;
        master.connect(ctx.destination);
        this.ready = true;
        return ctx;
      } catch (e) {
        return null;
      }
    },

    setMuted(value) {
      this.muted = !!value;
    },

    toggle() {
      this.muted = !this.muted;
      return this.muted;
    },

    tone(opts) {
      if (this.muted) return;
      const ac = this.ensure();
      if (!ac) return;
      const now = ac.currentTime + (opts.delay || 0);
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq, now);
      if (opts.end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.end), now + opts.dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, opts.vol || 0.15), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);
      osc.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + opts.dur + 0.02);
    },

    noise(opts) {
      if (this.muted) return;
      const ac = this.ensure();
      if (!ac) return;
      const dur = opts.dur || 0.12;
      const frames = Math.max(1, Math.floor(ac.sampleRate * dur));
      const buffer = ac.createBuffer(1, frames, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = opts.filterType || 'bandpass';
      filter.frequency.value = opts.freq || 800;
      filter.Q.value = opts.q || 0.8;
      const gain = ac.createGain();
      gain.gain.value = opts.vol || 0.2;
      src.connect(filter); filter.connect(gain); gain.connect(master);
      src.start(ac.currentTime + (opts.delay || 0));
    },

    play(name) {
      switch (name) {
        case 'hit':
          this.noise({ dur: 0.09, vol: 0.22, freq: 700 });
          this.tone({ freq: 160, end: 80, dur: 0.1, type: 'square', vol: 0.1 });
          break;
        case 'crit':
          this.noise({ dur: 0.14, vol: 0.3, freq: 1200 });
          this.tone({ freq: 420, end: 120, dur: 0.16, type: 'sawtooth', vol: 0.14 });
          break;
        case 'slash':
          this.noise({ dur: 0.1, vol: 0.16, freq: 1800, filterType: 'highpass' });
          break;
        case 'skill':
          this.tone({ freq: 300, end: 720, dur: 0.18, type: 'triangle', vol: 0.14 });
          break;
        case 'dash':
          this.noise({ dur: 0.16, vol: 0.14, freq: 500, filterType: 'lowpass' });
          this.tone({ freq: 200, end: 500, dur: 0.12, type: 'sine', vol: 0.08 });
          break;
        case 'hurt':
          this.tone({ freq: 220, end: 90, dur: 0.2, type: 'sawtooth', vol: 0.15 });
          break;
        case 'death':
          this.tone({ freq: 240, end: 50, dur: 0.7, type: 'sawtooth', vol: 0.16 });
          break;
        case 'pickup':
          this.tone({ freq: 660, dur: 0.06, type: 'square', vol: 0.08 });
          this.tone({ freq: 880, dur: 0.08, type: 'square', vol: 0.08, delay: 0.06 });
          break;
        case 'coin':
          this.tone({ freq: 1200, dur: 0.05, type: 'triangle', vol: 0.07 });
          this.tone({ freq: 1600, dur: 0.07, type: 'triangle', vol: 0.06, delay: 0.05 });
          break;
        case 'levelup':
          [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.11, delay: i * 0.09 }));
          break;
        case 'quest':
          [392, 523, 659].forEach((f, i) => this.tone({ freq: f, dur: 0.15, type: 'sine', vol: 0.1, delay: i * 0.08 }));
          break;
        case 'secret':
          [880, 1174, 1568, 2093].forEach((f, i) => this.tone({ freq: f, dur: 0.12, type: 'sine', vol: 0.07, delay: i * 0.06 }));
          break;
        case 'chest':
          this.tone({ freq: 180, end: 120, dur: 0.1, type: 'square', vol: 0.1 });
          this.tone({ freq: 880, dur: 0.1, type: 'triangle', vol: 0.08, delay: 0.1 });
          break;
        case 'boss':
          this.tone({ freq: 70, end: 45, dur: 1.0, type: 'sawtooth', vol: 0.2 });
          this.noise({ dur: 0.8, vol: 0.12, freq: 180, filterType: 'lowpass' });
          break;
        case 'heal':
          this.tone({ freq: 440, end: 880, dur: 0.25, type: 'sine', vol: 0.1 });
          break;
        case 'ui':
          this.tone({ freq: 720, dur: 0.035, type: 'square', vol: 0.05 });
          break;
        case 'error':
          this.tone({ freq: 120, end: 90, dur: 0.16, type: 'square', vol: 0.1 });
          break;
        case 'puzzle':
          this.tone({ freq: 523, dur: 0.1, type: 'sine', vol: 0.09 });
          this.tone({ freq: 784, dur: 0.14, type: 'sine', vol: 0.09, delay: 0.1 });
          break;
        default:
          break;
      }
    }
  };

  window.AudioFX = AudioFX;
})();
