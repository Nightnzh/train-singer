/**
 * YIN Pitch Detection Algorithm with Parabolic Interpolation
 * Tailored for human singing voice (approx. 65 Hz - 1200 Hz, C2 - D6)
 */

export interface PitchDetectionResult {
  frequency: number; // in Hz (0 if unvoiced/silent)
  clarity: number;   // 0 to 1 confidence
  volume: number;    // RMS volume 0 to 1
}

export class PitchDetector {
  private threshold: number;
  private sampleRate: number;
  private minFrequency: number;
  private maxFrequency: number;
  private minLag: number;
  private maxLag: number;
  private bufferSize: number;
  private yinBuffer: Float32Array;

  constructor(
    sampleRate: number = 44100,
    bufferSize: number = 2048,
    threshold: number = 0.15,
    minFrequency: number = 65,
    maxFrequency: number = 1100
  ) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.threshold = threshold;
    this.minFrequency = minFrequency;
    this.maxFrequency = maxFrequency;

    // Lag range corresponding to human vocal fundamental frequencies
    this.minLag = Math.floor(sampleRate / maxFrequency);
    this.maxLag = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(bufferSize / 2));
    this.yinBuffer = new Float32Array(this.maxLag);
  }

  public setSampleRate(rate: number) {
    if (rate !== this.sampleRate) {
      this.sampleRate = rate;
      this.minLag = Math.floor(rate / this.maxFrequency);
      this.maxLag = Math.min(Math.floor(rate / this.minFrequency), Math.floor(this.bufferSize / 2));
      this.yinBuffer = new Float32Array(this.maxLag);
    }
  }

  /**
   * Calculate RMS (Root Mean Square) volume to filter out room silence and breath
   */
  public calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Run YIN pitch detection on raw audio buffer
   */
  public detect(buffer: Float32Array): PitchDetectionResult {
    const volume = this.calculateRMS(buffer);

    // Noise gate: ignore if below volume threshold
    if (volume < 0.015) {
      return { frequency: 0, clarity: 0, volume };
    }

    const halfBufferSize = Math.floor(buffer.length / 2);
    const maxTau = Math.min(this.maxLag, halfBufferSize);
    const yinBuffer = this.yinBuffer;

    // Step 1: Difference function
    for (let tau = this.minLag; tau < maxTau; tau++) {
      let sum = 0;
      for (let i = 0; i < halfBufferSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Step 2: Cumulative mean normalized difference function
    yinBuffer[this.minLag] = 1;
    let runningSum = 0;
    for (let tau = this.minLag; tau < maxTau; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = runningSum === 0 ? 1 : (yinBuffer[tau] * (tau - this.minLag + 1)) / runningSum;
    }

    // Step 3: Absolute threshold & minimum search
    let tauEstimate = -1;
    let minVal = 1000;
    let bestTau = -1;

    for (let tau = this.minLag; tau < maxTau; tau++) {
      const val = yinBuffer[tau];
      if (val < minVal) {
        minVal = val;
        bestTau = tau;
      }

      if (val < this.threshold) {
        // Find local minimum
        while (tau + 1 < maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    // If no tau was found below the absolute threshold, check if best minimum is plausible
    if (tauEstimate === -1) {
      if (minVal < 0.35 && bestTau !== -1) {
        tauEstimate = bestTau;
      } else {
        return { frequency: 0, clarity: 1 - Math.min(minVal, 1), volume };
      }
    }

    // Step 4: Parabolic interpolation for sub-sample precision
    let betterTau = tauEstimate;
    const x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
    const x2 = tauEstimate + 1 < maxTau ? tauEstimate + 1 : tauEstimate;

    if (x0 !== tauEstimate && x2 !== tauEstimate) {
      const s0 = yinBuffer[x0];
      const s1 = yinBuffer[tauEstimate];
      const s2 = yinBuffer[x2];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) {
        betterTau = tauEstimate + (s2 - s0) / denom;
      }
    }

    const frequency = this.sampleRate / betterTau;
    const clarity = Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate]));

    // Sanity check for human vocal range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return { frequency: 0, clarity: 0, volume };
    }

    return {
      frequency,
      clarity,
      volume,
    };
  }
}
