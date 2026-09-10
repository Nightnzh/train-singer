import { PitchDetector } from './PitchDetector';
import { freqToMidi, midiToNoteInfo } from './notes';
import type { PitchData } from '../types/audio';

export type PitchCallback = (data: PitchData) => void;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;

  private detector: PitchDetector;
  private buffer: Float32Array;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private listeners: Set<PitchCallback> = new Set();

  private inputGainValue: number = 1.0;
  private noiseGateThreshold: number = 0.012;

  constructor() {
    this.buffer = new Float32Array(2048);
    this.detector = new PitchDetector(44100, 2048, 0.15, 65, 1100);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.detector.setSampleRate(this.audioContext.sampleRate);

      // Request microphone stream with voice-optimized constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Software Input Gain
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.inputGainValue;

      // Filter rumble (< 60Hz)
      this.highpassFilter = this.audioContext.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 60;

      // Filter harsh high harmonics (> 1400Hz) to aid pitch detection
      this.lowpassFilter = this.audioContext.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.value = 1400;

      // Fast time-domain analyser
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;

      // Chain: Mic -> Gain -> Highpass -> Lowpass -> Analyser
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.highpassFilter);
      this.highpassFilter.connect(this.lowpassFilter);
      this.lowpassFilter.connect(this.analyserNode);

      this.isRunning = true;
      this.processLoop();
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  public stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public setInputGain(gain: number): void {
    this.inputGainValue = gain;
    if (this.gainNode) {
      this.gainNode.gain.value = gain;
    }
  }

  public setNoiseGate(threshold: number): void {
    this.noiseGateThreshold = threshold;
  }

  public subscribe(cb: PitchCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getContext(): AudioContext | null {
    return this.audioContext;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private processLoop = (): void => {
    if (!this.isRunning || !this.analyserNode) return;

    this.analyserNode.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);

    const result = this.detector.detect(this.buffer);
    const now = performance.now();

    let pitchData: PitchData;

    if (result.frequency > 0 && result.clarity > 0.65 && result.volume >= this.noiseGateThreshold) {
      const midiFloat = freqToMidi(result.frequency);
      const noteInfo = midiToNoteInfo(midiFloat);

      pitchData = {
        frequency: Math.round(result.frequency * 10) / 10,
        midi: midiFloat,
        noteName: noteInfo.noteName,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
        clarity: result.clarity,
        volume: result.volume,
        timestamp: now,
      };
    } else {
      // Unvoiced or silent frame
      pitchData = {
        frequency: 0,
        midi: 0,
        noteName: '',
        octave: 0,
        cents: 0,
        clarity: 0,
        volume: result.volume,
        timestamp: now,
      };
    }

    for (const listener of this.listeners) {
      listener(pitchData);
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };
}

export const audioEngine = new AudioEngine();
