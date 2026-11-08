/**
 * Uncle Brew - Ambient Café Audio Engine
 * Uses Web Audio API to synthesize realistic, cozy coffee shop sounds:
 * - Gentle coffee steam hiss
 * - Warm ambient café atmosphere
 * - Soft rain on café window
 * - Interactive UI feedback sounds (stamp punch, add to cart pop)
 */

class CafeAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.nodes = {};
    this.masterGain = null;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.audioCtx = new AudioContext();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);
  }

  toggleAmbient() {
    if (!this.audioCtx) {
      this.init();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  startAmbient() {
    if (!this.audioCtx) this.init();
    if (this.isPlaying) return;

    // 1. Rain / Gentle Brown Noise (Rain drops on glass)
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const rainSource = this.audioCtx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Filter to sound like soft indoor café rain
    const rainFilter = this.audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

    const rainGain = this.audioCtx.createGain();
    rainGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);
    rainSource.start();

    // 2. Warm Vinyl/Espresso Machine Low Drone
    const warmOsc = this.audioCtx.createOscillator();
    warmOsc.type = 'sine';
    warmOsc.frequency.setValueAtTime(110, this.audioCtx.currentTime); // Low A

    const oscGain = this.audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);

    warmOsc.connect(oscGain);
    oscGain.connect(this.masterGain);
    warmOsc.start();

    // 3. Steam valve periodic whisper
    const steamFilter = this.audioCtx.createBiquadFilter();
    steamFilter.type = 'bandpass';
    steamFilter.frequency.setValueAtTime(2200, this.audioCtx.currentTime);
    steamFilter.Q.setValueAtTime(3.0, this.audioCtx.currentTime);

    const steamGain = this.audioCtx.createGain();
    steamGain.gain.setValueAtTime(0.015, this.audioCtx.currentTime);

    const steamSource = this.audioCtx.createBufferSource();
    steamSource.buffer = noiseBuffer;
    steamSource.loop = true;

    steamSource.connect(steamFilter);
    steamFilter.connect(steamGain);
    steamGain.connect(this.masterGain);
    steamSource.start();

    this.nodes = { rainSource, rainGain, warmOsc, oscGain, steamSource, steamGain };
    this.isPlaying = true;
  }

  stopAmbient() {
    if (!this.isPlaying) return;
    try {
      if (this.nodes.rainSource) this.nodes.rainSource.stop();
      if (this.nodes.warmOsc) this.nodes.warmOsc.stop();
      if (this.nodes.steamSource) this.nodes.steamSource.stop();
    } catch (e) {
      console.warn("Audio stop error:", e);
    }
    this.isPlaying = false;
  }

  setVolume(volume) {
    if (!this.masterGain || !this.audioCtx) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
  }

  // Quick sound effect: Punch stamp / Add to cart
  playChime(type = 'success') {
    try {
      if (!this.audioCtx) this.init();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain || this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'stamp') {
        // Wooden stamp thud + bell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'grind') {
        // Grinding burrs
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(240, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'tamp') {
        // Heavy metallic portafilter tamp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'extraction') {
        // Espresso high pressure pump hiss
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.4);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'chord') {
        // Gentle pentatonic acoustic chord
        const freqs = [329.63, 440, 554.37, 659.25]; // E4, A4, C#5, E5
        freqs.forEach((f, i) => {
          const chordOsc = this.audioCtx.createOscillator();
          const chordGain = this.audioCtx.createGain();
          chordOsc.type = 'sine';
          chordOsc.frequency.setValueAtTime(f, now + i * 0.04);
          chordGain.gain.setValueAtTime(0.08, now + i * 0.04);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.6);
          chordOsc.connect(chordGain);
          chordGain.connect(this.masterGain || this.audioCtx.destination);
          chordOsc.start(now + i * 0.04);
          chordOsc.stop(now + i * 0.04 + 0.6);
        });
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
}

window.cafeAudio = new CafeAudioEngine();
