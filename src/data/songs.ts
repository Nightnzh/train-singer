import type { Song } from '../types/audio';

export const SONGS: Song[] = [
  {
    id: 'song-lucky',
    title: '小幸運 (副歌精華)',
    artist: '田馥甄',
    difficulty: '普通',
    bpm: 76,
    duration: 26,
    notes: [
      // "與你相遇 好幸運"
      { id: 'nl-1', midi: 64, noteName: 'E4', startTime: 1.0, duration: 0.5, lyric: '與' },
      { id: 'nl-2', midi: 67, noteName: 'G4', startTime: 1.6, duration: 0.6, lyric: '你' },
      { id: 'nl-3', midi: 69, noteName: 'A4', startTime: 2.3, duration: 0.5, lyric: '相' },
      { id: 'nl-4', midi: 67, noteName: 'G4', startTime: 2.9, duration: 0.8, lyric: '遇' },
      { id: 'nl-5', midi: 64, noteName: 'E4', startTime: 4.2, duration: 0.5, lyric: '好' },
      { id: 'nl-6', midi: 67, noteName: 'G4', startTime: 4.8, duration: 0.5, lyric: '幸' },
      { id: 'nl-7', midi: 69, noteName: 'A4', startTime: 5.4, duration: 1.2, lyric: '運' },

      // "可我已失去 為你淚流滿面的權利"
      { id: 'nl-8', midi: 67, noteName: 'G4', startTime: 7.2, duration: 0.4, lyric: '可' },
      { id: 'nl-9', midi: 69, noteName: 'A4', startTime: 7.7, duration: 0.4, lyric: '我' },
      { id: 'nl-10', midi: 72, noteName: 'C5', startTime: 8.2, duration: 0.4, lyric: '已' },
      { id: 'nl-11', midi: 71, noteName: 'B4', startTime: 8.7, duration: 0.5, lyric: '失' },
      { id: 'nl-12', midi: 69, noteName: 'A4', startTime: 9.3, duration: 0.8, lyric: '去' },

      { id: 'nl-13', midi: 67, noteName: 'G4', startTime: 10.6, duration: 0.4, lyric: '為' },
      { id: 'nl-14', midi: 65, noteName: 'F4', startTime: 11.1, duration: 0.4, lyric: '你' },
      { id: 'nl-15', midi: 64, noteName: 'E4', startTime: 11.6, duration: 0.4, lyric: '淚' },
      { id: 'nl-16', midi: 62, noteName: 'D4', startTime: 12.1, duration: 0.4, lyric: '流' },
      { id: 'nl-17', midi: 64, noteName: 'E4', startTime: 12.6, duration: 0.4, lyric: '滿' },
      { id: 'nl-18', midi: 65, noteName: 'F4', startTime: 13.1, duration: 0.5, lyric: '面' },
      { id: 'nl-19', midi: 64, noteName: 'E4', startTime: 13.7, duration: 0.4, lyric: '的' },
      { id: 'nl-20', midi: 62, noteName: 'D4', startTime: 14.2, duration: 1.2, lyric: '權利' },

      // "但願在我看不到的天際"
      { id: 'nl-21', midi: 64, noteName: 'E4', startTime: 16.0, duration: 0.5, lyric: '但' },
      { id: 'nl-22', midi: 67, noteName: 'G4', startTime: 16.6, duration: 0.5, lyric: '願' },
      { id: 'nl-23', midi: 69, noteName: 'A4', startTime: 17.2, duration: 0.5, lyric: '在' },
      { id: 'nl-24', midi: 67, noteName: 'G4', startTime: 17.8, duration: 0.5, lyric: '我' },
      { id: 'nl-25', midi: 64, noteName: 'E4', startTime: 18.4, duration: 0.4, lyric: '看' },
      { id: 'nl-26', midi: 65, noteName: 'F4', startTime: 18.9, duration: 0.4, lyric: '不' },
      { id: 'nl-27', midi: 67, noteName: 'G4', startTime: 19.4, duration: 0.4, lyric: '到' },
      { id: 'nl-28', midi: 64, noteName: 'E4', startTime: 19.9, duration: 0.4, lyric: '的' },
      { id: 'nl-29', midi: 62, noteName: 'D4', startTime: 20.4, duration: 0.5, lyric: '天' },
      { id: 'nl-30', midi: 60, noteName: 'C4', startTime: 21.0, duration: 1.5, lyric: '際' },
    ],
    backingTrack: {
      chords: [
        { time: 0.5, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 3.8, chord: 'Em', notes: [40, 52, 55, 59] },
        { time: 7.0, chord: 'F', notes: [41, 53, 57, 60] },
        { time: 10.4, chord: 'G', notes: [43, 50, 55, 59] },
        { time: 15.6, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 19.2, chord: 'Am', notes: [45, 52, 57, 60] },
        { time: 22.5, chord: 'C', notes: [48, 52, 55, 60] },
      ],
    },
  },
  {
    id: 'song-cant-help',
    title: "Can't Help Falling in Love",
    artist: 'Elvis Presley',
    difficulty: '簡單',
    bpm: 68,
    duration: 22,
    notes: [
      // "Wise men say"
      { id: 'ch-1', midi: 60, noteName: 'C4', startTime: 1.0, duration: 1.0, lyric: 'Wise' },
      { id: 'ch-2', midi: 64, noteName: 'E4', startTime: 2.2, duration: 0.8, lyric: 'men' },
      { id: 'ch-3', midi: 67, noteName: 'G4', startTime: 3.2, duration: 1.8, lyric: 'say' },

      // "Only fools rush in"
      { id: 'ch-4', midi: 67, noteName: 'G4', startTime: 5.6, duration: 0.6, lyric: 'On' },
      { id: 'ch-5', midi: 69, noteName: 'A4', startTime: 6.3, duration: 0.6, lyric: 'ly' },
      { id: 'ch-6', midi: 71, noteName: 'B4', startTime: 7.0, duration: 0.8, lyric: 'fools' },
      { id: 'ch-7', midi: 72, noteName: 'C5', startTime: 8.0, duration: 0.6, lyric: 'rush' },
      { id: 'ch-8', midi: 71, noteName: 'B4', startTime: 8.8, duration: 1.4, lyric: 'in' },

      // "But I can't help"
      { id: 'ch-9', midi: 69, noteName: 'A4', startTime: 10.8, duration: 0.7, lyric: 'But' },
      { id: 'ch-10', midi: 67, noteName: 'G4', startTime: 11.7, duration: 0.7, lyric: 'I' },
      { id: 'ch-11', midi: 65, noteName: 'F4', startTime: 12.6, duration: 0.7, lyric: "can't" },
      { id: 'ch-12', midi: 64, noteName: 'E4', startTime: 13.5, duration: 1.5, lyric: 'help' },

      // "falling in love with you"
      { id: 'ch-13', midi: 62, noteName: 'D4', startTime: 15.5, duration: 0.6, lyric: 'fall' },
      { id: 'ch-14', midi: 64, noteName: 'E4', startTime: 16.2, duration: 0.6, lyric: 'ing' },
      { id: 'ch-15', midi: 65, noteName: 'F4', startTime: 17.0, duration: 0.6, lyric: 'in' },
      { id: 'ch-16', midi: 64, noteName: 'E4', startTime: 17.8, duration: 0.8, lyric: 'love' },
      { id: 'ch-17', midi: 62, noteName: 'D4', startTime: 18.8, duration: 0.7, lyric: 'with' },
      { id: 'ch-18', midi: 60, noteName: 'C4', startTime: 19.7, duration: 1.8, lyric: 'you' },
    ],
    backingTrack: {
      chords: [
        { time: 0.8, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 3.0, chord: 'Em', notes: [40, 52, 55, 59] },
        { time: 5.4, chord: 'Am', notes: [45, 52, 57, 60] },
        { time: 8.6, chord: 'F', notes: [41, 53, 57, 60] },
        { time: 10.6, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 13.3, chord: 'G', notes: [43, 50, 55, 59] },
        { time: 15.4, chord: 'F', notes: [41, 53, 57, 60] },
        { time: 19.5, chord: 'C', notes: [48, 52, 55, 60] },
      ],
    },
  },
  {
    id: 'song-twinkle',
    title: '小星星 (經典發聲流行版)',
    artist: '童謠改編',
    difficulty: '簡單',
    bpm: 88,
    duration: 16,
    notes: [
      { id: 'tw-1', midi: 60, noteName: 'C4', startTime: 1.0, duration: 0.5, lyric: '一' },
      { id: 'tw-2', midi: 60, noteName: 'C4', startTime: 1.6, duration: 0.5, lyric: '閃' },
      { id: 'tw-3', midi: 67, noteName: 'G4', startTime: 2.2, duration: 0.5, lyric: '一' },
      { id: 'tw-4', midi: 67, noteName: 'G4', startTime: 2.8, duration: 0.5, lyric: '閃' },
      { id: 'tw-5', midi: 69, noteName: 'A4', startTime: 3.4, duration: 0.5, lyric: '亮' },
      { id: 'tw-6', midi: 69, noteName: 'A4', startTime: 4.0, duration: 0.5, lyric: '晶' },
      { id: 'tw-7', midi: 67, noteName: 'G4', startTime: 4.6, duration: 1.0, lyric: '晶' },

      { id: 'tw-8', midi: 65, noteName: 'F4', startTime: 6.0, duration: 0.5, lyric: '滿' },
      { id: 'tw-9', midi: 65, noteName: 'F4', startTime: 6.6, duration: 0.5, lyric: '天' },
      { id: 'tw-10', midi: 64, noteName: 'E4', startTime: 7.2, duration: 0.5, lyric: '都' },
      { id: 'tw-11', midi: 64, noteName: 'E4', startTime: 7.8, duration: 0.5, lyric: '是' },
      { id: 'tw-12', midi: 62, noteName: 'D4', startTime: 8.4, duration: 0.5, lyric: '小' },
      { id: 'tw-13', midi: 62, noteName: 'D4', startTime: 9.0, duration: 0.5, lyric: '星' },
      { id: 'tw-14', midi: 60, noteName: 'C4', startTime: 9.6, duration: 1.2, lyric: '星' },
    ],
    backingTrack: {
      chords: [
        { time: 0.8, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 3.2, chord: 'F', notes: [41, 53, 57, 60] },
        { time: 4.4, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 5.8, chord: 'F', notes: [41, 53, 57, 60] },
        { time: 7.0, chord: 'C', notes: [48, 52, 55, 60] },
        { time: 8.2, chord: 'G', notes: [43, 50, 55, 59] },
        { time: 9.4, chord: 'C', notes: [48, 52, 55, 60] },
      ],
    },
  },
];
