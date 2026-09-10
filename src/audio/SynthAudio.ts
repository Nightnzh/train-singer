import { midiToFreq } from './notes';

/**
 * High-quality procedural synthesizer for piano guide notes, metronome, and chords
 */
export class SynthAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Play a pleasant warm electric piano / bell guide tone
   */
  public playNote(midi: number, duration: number = 0.8, startTime?: number, velocity: number = 0.7): void {
    const ctx = this.ensureContext();
    const freq = midiToFreq(midi);
    const start = startTime !== undefined ? startTime : ctx.currentTime;

    // Multi-harmonic oscillator for rich warm tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    // Fundamental (Sine)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, start);

    // Second harmonic (Triangle, octave above)
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, start);

    // Third harmonic (Soft bell presence)
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, start);

    // Envelope: Fast attack, exponential natural decay
    const baseAmp = velocity * 0.4;
    gain1.gain.setValueAtTime(0.0001, start);
    gain1.gain.linearRampToValueAtTime(baseAmp, start + 0.015);
    gain1.gain.exponentialRampToValueAtTime(baseAmp * 0.5, start + duration * 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    gain2.gain.setValueAtTime(0.0001, start);
    gain2.gain.linearRampToValueAtTime(baseAmp * 0.35, start + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.6);

    gain3.gain.setValueAtTime(0.0001, start);
    gain3.gain.linearRampToValueAtTime(baseAmp * 0.15, start + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.3);

    // Connect
    if (this.masterGain) {
      osc1.connect(gain1).connect(this.masterGain);
      osc2.connect(gain2).connect(this.masterGain);
      osc3.connect(gain3).connect(this.masterGain);
    }

    osc1.start(start);
    osc2.start(start);
    osc3.start(start);

    osc1.stop(start + duration + 0.05);
    osc2.stop(start + duration + 0.05);
    osc3.stop(start + duration + 0.05);
  }

  /**
   * Play a short metronome click
   */
  public playClick(isHigh: boolean = false, startTime?: number): void {
    const ctx = this.ensureContext();
    const start = startTime !== undefined ? startTime : ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, start);
    osc.frequency.exponentialRampToValueAtTime(100, start + 0.04);

    gain.gain.setValueAtTime(isHigh ? 0.6 : 0.4, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);

    if (this.masterGain) {
      osc.connect(gain).connect(this.masterGain);
    }

    osc.start(start);
    osc.stop(start + 0.05);
  }

  /**
   * Play chord accompaniment
   */
  public playChord(midiNotes: number[], duration: number = 1.2, startTime?: number): void {
    midiNotes.forEach((midi, idx) => {
      // Arpeggiate slightly by 25ms for natural strum
      const offset = idx * 0.025;
      this.playNote(midi, duration, (startTime ?? this.ensureContext().currentTime) + offset, 0.4);
    });
  }

  public getCurrentTime(): number {
    return this.ensureContext().currentTime;
  }
}

export const synth = new SynthAudio();
