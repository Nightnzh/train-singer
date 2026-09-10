export interface PitchData {
  frequency: number;       // Hz
  midi: number;            // Floating MIDI note number (e.g., 69.3)
  noteName: string;        // e.g., "A4"
  octave: number;          // e.g., 4
  cents: number;           // Deviation from closest note [-50, 50]
  clarity: number;         // Detection confidence [0, 1]
  volume: number;          // RMS volume [0, 1]
  timestamp: number;       // Performance timestamp in ms
}

export interface NoteTarget {
  id: string;
  midi: number;
  noteName: string;
  startTime: number;       // In seconds
  duration: number;        // In seconds
  lyric?: string;          // Optional syllable or lyric
}

export interface Exercise {
  id: string;
  title: string;
  category: 'sustain' | 'scale' | 'arpeggio';
  description: string;
  difficulty: '初級' | '中級' | '進階';
  baseMidi: number;        // e.g., 60 for C4
  tempo: number;           // BPM
  notes: Array<{
    relativeMidi: number;  // Offset from baseMidi (e.g., 0, 2, 4, 5, 7)
    durationBeats: number; // Duration in beats
    solfege: string;       // e.g., "Do", "Re", "Mi"
  }>;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: '簡單' | '普通' | '挑戰';
  bpm: number;
  duration: number;        // Total duration in seconds
  notes: NoteTarget[];
  backingTrack?: {
    chords: Array<{ time: number; chord: string; notes: number[] }>;
  };
}

export type HitRating = 'perfect' | 'great' | 'miss' | 'idle';

export interface PerformanceStats {
  totalNotes: number;
  perfectCount: number;
  greatCount: number;
  missCount: number;
  maxCombo: number;
  currentCombo: number;
  score: number;           // 0 - 100
  pitchAccuracy: number;   // Percentage
  pitchTendency: 'flat' | 'sharp' | 'balanced'; // 偏低 / 偏高 / 均衡
  highestNote?: string;
  lowestNote?: string;
  averageCentsDeviation: number;
}
