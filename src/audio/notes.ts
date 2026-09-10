// Musical note utilities and conversions

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const SOLFEGE = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Ti'];

// Standard A4 frequency
export const A4_FREQ = 440;
export const A4_MIDI = 69;

/**
 * Convert frequency in Hz to floating-point MIDI note number
 */
export function freqToMidi(frequency: number): number {
  if (frequency <= 0) return 0;
  return 69 + 12 * Math.log2(frequency / A4_FREQ);
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Parse MIDI number into note representation
 */
export function midiToNoteInfo(midiFloat: number): {
  noteName: string;
  octave: number;
  roundedMidi: number;
  cents: number;
  pitchClass: string;
} {
  const roundedMidi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - roundedMidi) * 100);
  const pitchIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const pitchClass = NOTE_NAMES[pitchIndex];
  const noteName = `${pitchClass}${octave}`;

  return {
    noteName,
    octave,
    roundedMidi,
    cents,
    pitchClass,
  };
}

/**
 * Convert note name (e.g. "C4", "F#3") to MIDI number
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return 60; // default C4
  let pitch = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  if (pitch === 'DB') pitch = 'C#';
  else if (pitch === 'EB') pitch = 'D#';
  else if (pitch === 'GB') pitch = 'F#';
  else if (pitch === 'AB') pitch = 'G#';
  else if (pitch === 'BB') pitch = 'A#';

  const index = NOTE_NAMES.indexOf(pitch);
  if (index === -1) return 60;
  return (octave + 1) * 12 + index;
}

/**
 * Check if a pitch deviation is within acceptable tolerance
 */
export function evaluatePitchDeviation(cents: number): 'perfect' | 'great' | 'miss' {
  const absCents = Math.abs(cents);
  if (absCents <= 25) return 'perfect';
  if (absCents <= 45) return 'great';
  return 'miss';
}
