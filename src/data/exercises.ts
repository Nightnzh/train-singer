import type { Exercise } from '../types/audio';

export const EXERCISES: Exercise[] = [
  {
    id: 'sustain-1',
    title: '長音穩定度維持 (Sustained Pitch)',
    category: 'sustain',
    description: '深吸一口氣，均勻吐氣發出「Ah」或「Uu」，盡可能將音高平穩維持在基準線上。',
    difficulty: '初級',
    baseMidi: 60, // C4
    tempo: 75,
    notes: [
      { relativeMidi: 0, durationBeats: 4, solfege: 'Do (Ah~)' },
    ],
  },
  {
    id: 'scale-thirds',
    title: '大三度音程跳音 (Major Thirds)',
    category: 'scale',
    description: '體會 Do 與 Mi 之間的音程距離，注意音準不要偏低，保持聲音明亮放鬆。',
    difficulty: '初級',
    baseMidi: 60, // C4
    tempo: 80,
    notes: [
      { relativeMidi: 0, durationBeats: 1, solfege: 'Do' },
      { relativeMidi: 4, durationBeats: 1, solfege: 'Mi' },
      { relativeMidi: 0, durationBeats: 2, solfege: 'Do' },
    ],
  },
  {
    id: 'scale-5tone',
    title: '五度連音開嗓 (5-Tone Scale)',
    category: 'scale',
    description: '歌唱訓練最經典的發聲暖身，練習音階的連貫性（Legato）與每個半音全音的精確度。',
    difficulty: '中級',
    baseMidi: 60, // C4
    tempo: 95,
    notes: [
      { relativeMidi: 0, durationBeats: 1, solfege: 'Do' },
      { relativeMidi: 2, durationBeats: 1, solfege: 'Re' },
      { relativeMidi: 4, durationBeats: 1, solfege: 'Mi' },
      { relativeMidi: 5, durationBeats: 1, solfege: 'Fa' },
      { relativeMidi: 7, durationBeats: 1, solfege: 'Sol' },
      { relativeMidi: 5, durationBeats: 1, solfege: 'Fa' },
      { relativeMidi: 4, durationBeats: 1, solfege: 'Mi' },
      { relativeMidi: 2, durationBeats: 1, solfege: 'Re' },
      { relativeMidi: 0, durationBeats: 2, solfege: 'Do' },
    ],
  },
  {
    id: 'arpeggio-octave',
    title: '八度大琶音跨越 (Octave Arpeggio)',
    category: 'arpeggio',
    description: '訓練跨八度的換聲點與共鳴腔體轉換（胸聲至混聲/頭聲），保持喉頭穩定。',
    difficulty: '進階',
    baseMidi: 60, // C4
    tempo: 100,
    notes: [
      { relativeMidi: 0, durationBeats: 1, solfege: 'Do' },
      { relativeMidi: 4, durationBeats: 1, solfege: 'Mi' },
      { relativeMidi: 7, durationBeats: 1, solfege: 'Sol' },
      { relativeMidi: 12, durationBeats: 2, solfege: "Do'" },
      { relativeMidi: 7, durationBeats: 1, solfege: 'Sol' },
      { relativeMidi: 4, durationBeats: 1, solfege: 'Mi' },
      { relativeMidi: 0, durationBeats: 2, solfege: 'Do' },
    ],
  },
];

export const KEY_PRESETS = [
  { label: '男低音 (A2)', midi: 45 },
  { label: '男中音 (C3)', midi: 48 },
  { label: '男高音 (E3)', midi: 52 },
  { label: '女低音 (G3)', midi: 55 },
  { label: '女中音 (A3)', midi: 57 },
  { label: '中央 C (C4)', midi: 60 },
  { label: '女高音 (E4)', midi: 64 },
];
