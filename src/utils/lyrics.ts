import type { NoteTarget } from '../types/audio';

export interface KtvWord {
  char: string;
  startTime: number;
  duration: number;
}

export interface KtvLine {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words: KtvWord[];
}

/**
 * Parse standard LRC format string into KtvLine array.
 * Interpolates character timing evenly if word-level timestamps aren't provided.
 */
export function parseLrc(lrcText: string): KtvLine[] {
  const lines = lrcText.split('\n');
  const result: Array<{ time: number; text: string }> = [];

  const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const text = rawLine.replace(timeReg, '').trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timeReg.lastIndex = 0;
    while ((match = timeReg.exec(rawLine)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSec = min * 60 + sec + ms / 1000;
      result.push({ time: totalSec, text });
    }
  }

  result.sort((a, b) => a.time - b.time);

  return result.map((item, idx) => {
    const nextItem = result[idx + 1];
    const duration = nextItem ? Math.max(1.5, Math.min(6, nextItem.time - item.time)) : 4.0;
    const endTime = item.time + duration;

    // Distribute words evenly across the line
    const chars = Array.from(item.text);
    const charDuration = chars.length > 0 ? duration / chars.length : duration;

    const words: KtvWord[] = chars.map((char, cIdx) => ({
      char,
      startTime: item.time + cIdx * charDuration,
      duration: charDuration,
    }));

    return {
      id: `lrc-line-${idx}`,
      startTime: item.time,
      endTime,
      text: item.text,
      words,
    };
  });
}

/**
 * Convert structured NoteTarget[] (from built-in songs) into KtvLine[] with exact note timestamps
 */
export function songNotesToKtvLines(notes: NoteTarget[]): KtvLine[] {
  if (!notes || notes.length === 0) return [];

  const lines: KtvLine[] = [];
  let currentWords: KtvWord[] = [];
  let lineStart = notes[0].startTime;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const char = note.lyric || note.noteName;

    currentWords.push({
      char,
      startTime: note.startTime,
      duration: note.duration,
    });

    const isLast = i === notes.length - 1;
    const nextNote = notes[i + 1];
    const gapToNext = nextNote ? nextNote.startTime - (note.startTime + note.duration) : 999;

    // Break phrase if gap between notes is larger than 1.0s or line has over 12 words or is last
    if (isLast || gapToNext > 1.0 || currentWords.length >= 12) {
      const lineEnd = note.startTime + note.duration + 0.3;
      lines.push({
        id: `song-line-${lines.length}`,
        startTime: lineStart,
        endTime: lineEnd,
        text: currentWords.map((w) => w.char).join(''),
        words: [...currentWords],
      });

      if (nextNote) {
        lineStart = nextNote.startTime;
      }
      currentWords = [];
    }
  }

  return lines;
}

/**
 * Built-in KTV timed lyrics for YouTube Preset Songs
 */
export const YOUTUBE_KTV_LYRICS: Record<string, KtvLine[]> = {
  // 周杰倫 - 晴天 (qC_sY3eH5dI)
  qC_sY3eH5dI: [
    {
      id: 'qt-1',
      startTime: 30.5,
      endTime: 34.8,
      text: '故事的小黃花',
      words: [
        { char: '故', startTime: 30.5, duration: 0.6 },
        { char: '事', startTime: 31.1, duration: 0.6 },
        { char: '的', startTime: 31.7, duration: 0.5 },
        { char: '小', startTime: 32.2, duration: 0.8 },
        { char: '黃', startTime: 33.0, duration: 0.8 },
        { char: '花', startTime: 33.8, duration: 1.0 },
      ],
    },
    {
      id: 'qt-2',
      startTime: 35.2,
      endTime: 40.0,
      text: '從出生那年就飄著',
      words: [
        { char: '從', startTime: 35.2, duration: 0.7 },
        { char: '出', startTime: 35.9, duration: 0.6 },
        { char: '生', startTime: 36.5, duration: 0.6 },
        { char: '那', startTime: 37.1, duration: 0.7 },
        { char: '年', startTime: 37.8, duration: 0.7 },
        { char: '就', startTime: 38.5, duration: 0.6 },
        { char: '飄', startTime: 39.1, duration: 0.5 },
        { char: '著', startTime: 39.6, duration: 0.4 },
      ],
    },
    {
      id: 'qt-3',
      startTime: 40.5,
      endTime: 45.2,
      text: '童年的蕩鞦韆',
      words: [
        { char: '童', startTime: 40.5, duration: 0.6 },
        { char: '年', startTime: 41.1, duration: 0.6 },
        { char: '的', startTime: 41.7, duration: 0.5 },
        { char: '蕩', startTime: 42.2, duration: 0.8 },
        { char: '鞦', startTime: 43.0, duration: 0.8 },
        { char: '韆', startTime: 43.8, duration: 1.4 },
      ],
    },
    {
      id: 'qt-4',
      startTime: 45.8,
      endTime: 51.5,
      text: '隨記憶一直晃到現在',
      words: [
        { char: '隨', startTime: 45.8, duration: 0.6 },
        { char: '記', startTime: 46.4, duration: 0.6 },
        { char: '憶', startTime: 47.0, duration: 0.6 },
        { char: '一', startTime: 47.6, duration: 0.5 },
        { char: '直', startTime: 48.1, duration: 0.5 },
        { char: '晃', startTime: 48.6, duration: 0.8 },
        { char: '到', startTime: 49.4, duration: 0.7 },
        { char: '現', startTime: 50.1, duration: 0.7 },
        { char: '在', startTime: 50.8, duration: 0.7 },
      ],
    },
    {
      id: 'qt-5',
      startTime: 52.0,
      endTime: 56.5,
      text: '刮風這天我試過握著你手',
      words: [
        { char: '刮', startTime: 52.0, duration: 0.4 },
        { char: '風', startTime: 52.4, duration: 0.4 },
        { char: '這', startTime: 52.8, duration: 0.4 },
        { char: '天', startTime: 53.2, duration: 0.5 },
        { char: '我', startTime: 53.7, duration: 0.4 },
        { char: '試', startTime: 54.1, duration: 0.4 },
        { char: '過', startTime: 54.5, duration: 0.4 },
        { char: '握', startTime: 54.9, duration: 0.4 },
        { char: '著', startTime: 55.3, duration: 0.4 },
        { char: '你', startTime: 55.7, duration: 0.4 },
        { char: '手', startTime: 56.1, duration: 0.4 },
      ],
    },
  ],

  // 田馥甄 - 小幸運 (wL3wUoI-LqA)
  'wL3wUoI-LqA': [
    {
      id: 'lucky-1',
      startTime: 1.0,
      endTime: 6.8,
      text: '與你相遇 好幸運',
      words: [
        { char: '與', startTime: 1.0, duration: 0.6 },
        { char: '你', startTime: 1.6, duration: 0.7 },
        { char: '相', startTime: 2.3, duration: 0.6 },
        { char: '遇', startTime: 2.9, duration: 1.3 },
        { char: '好', startTime: 4.2, duration: 0.6 },
        { char: '幸', startTime: 4.8, duration: 0.6 },
        { char: '運', startTime: 5.4, duration: 1.4 },
      ],
    },
    {
      id: 'lucky-2',
      startTime: 7.2,
      endTime: 15.5,
      text: '可我已失去 為你淚流滿面的權利',
      words: [
        { char: '可', startTime: 7.2, duration: 0.5 },
        { char: '我', startTime: 7.7, duration: 0.5 },
        { char: '已', startTime: 8.2, duration: 0.5 },
        { char: '失', startTime: 8.7, duration: 0.6 },
        { char: '去', startTime: 9.3, duration: 1.3 },
        { char: '為', startTime: 10.6, duration: 0.5 },
        { char: '你', startTime: 11.1, duration: 0.5 },
        { char: '淚', startTime: 11.6, duration: 0.5 },
        { char: '流', startTime: 12.1, duration: 0.5 },
        { char: '滿', startTime: 12.6, duration: 0.5 },
        { char: '面', startTime: 13.1, duration: 0.6 },
        { char: '的', startTime: 13.7, duration: 0.5 },
        { char: '權', startTime: 14.2, duration: 0.6 },
        { char: '利', startTime: 14.8, duration: 0.7 },
      ],
    },
    {
      id: 'lucky-3',
      startTime: 16.0,
      endTime: 22.5,
      text: '但願在我看不到的天際',
      words: [
        { char: '但', startTime: 16.0, duration: 0.6 },
        { char: '願', startTime: 16.6, duration: 0.6 },
        { char: '在', startTime: 17.2, duration: 0.6 },
        { char: '我', startTime: 17.8, duration: 0.6 },
        { char: '看', startTime: 18.4, duration: 0.5 },
        { char: '不', startTime: 18.9, duration: 0.5 },
        { char: '到', startTime: 19.4, duration: 0.5 },
        { char: '的', startTime: 19.9, duration: 0.5 },
        { char: '天', startTime: 20.4, duration: 0.6 },
        { char: '際', startTime: 21.0, duration: 1.5 },
      ],
    },
  ],

  // 鄧紫棋 - 光年之外 (f_i6Hox3e8o)
  f_i6Hox3e8o: [
    {
      id: 'gn-1',
      startTime: 15.0,
      endTime: 21.0,
      text: '感受停在我髮端的指尖',
      words: [
        { char: '感', startTime: 15.0, duration: 0.6 },
        { char: '受', startTime: 15.6, duration: 0.6 },
        { char: '停', startTime: 16.2, duration: 0.8 },
        { char: '在', startTime: 17.0, duration: 0.5 },
        { char: '我', startTime: 17.5, duration: 0.5 },
        { char: '髮', startTime: 18.0, duration: 0.6 },
        { char: '端', startTime: 18.6, duration: 0.8 },
        { char: '的', startTime: 19.4, duration: 0.5 },
        { char: '指', startTime: 19.9, duration: 0.5 },
        { char: '尖', startTime: 20.4, duration: 0.6 },
      ],
    },
    {
      id: 'gn-2',
      startTime: 21.5,
      endTime: 27.5,
      text: '如何瞬間凍結了時間',
      words: [
        { char: '如', startTime: 21.5, duration: 0.6 },
        { char: '何', startTime: 22.1, duration: 0.6 },
        { char: '瞬', startTime: 22.7, duration: 0.8 },
        { char: '間', startTime: 23.5, duration: 0.7 },
        { char: '凍', startTime: 24.2, duration: 0.8 },
        { char: '結', startTime: 25.0, duration: 0.7 },
        { char: '了', startTime: 25.7, duration: 0.5 },
        { char: '時', startTime: 26.2, duration: 0.6 },
        { char: '間', startTime: 26.8, duration: 0.7 },
      ],
    },
    {
      id: 'gn-3',
      startTime: 28.0,
      endTime: 34.0,
      text: '記住望著我雙眼的瞬間',
      words: [
        { char: '記', startTime: 28.0, duration: 0.6 },
        { char: '住', startTime: 28.6, duration: 0.6 },
        { char: '望', startTime: 29.2, duration: 0.8 },
        { char: '著', startTime: 30.0, duration: 0.5 },
        { char: '我', startTime: 30.5, duration: 0.5 },
        { char: '雙', startTime: 31.0, duration: 0.6 },
        { char: '眼', startTime: 31.6, duration: 0.8 },
        { char: '的', startTime: 32.4, duration: 0.5 },
        { char: '瞬', startTime: 32.9, duration: 0.5 },
        { char: '間', startTime: 33.4, duration: 0.6 },
      ],
    },
  ],

  // Adele - Someone Like You (5-wZ1e0wD68)
  '5-wZ1e0wD68': [
    {
      id: 'sly-1',
      startTime: 14.5,
      endTime: 21.0,
      text: "I heard that you're settled down",
      words: [
        { char: 'I ', startTime: 14.5, duration: 0.7 },
        { char: 'heard ', startTime: 15.2, duration: 0.9 },
        { char: 'that ', startTime: 16.1, duration: 0.6 },
        { char: "you're ", startTime: 16.7, duration: 0.8 },
        { char: 'settled ', startTime: 17.5, duration: 1.5 },
        { char: 'down', startTime: 19.0, duration: 2.0 },
      ],
    },
    {
      id: 'sly-2',
      startTime: 22.0,
      endTime: 28.5,
      text: 'That you found a girl and you\'re married now',
      words: [
        { char: 'That ', startTime: 22.0, duration: 0.5 },
        { char: 'you ', startTime: 22.5, duration: 0.6 },
        { char: 'found ', startTime: 23.1, duration: 0.8 },
        { char: 'a ', startTime: 23.9, duration: 0.4 },
        { char: 'girl ', startTime: 24.3, duration: 1.0 },
        { char: 'and ', startTime: 25.3, duration: 0.5 },
        { char: "you're ", startTime: 25.8, duration: 0.6 },
        { char: 'married ', startTime: 26.4, duration: 1.0 },
        { char: 'now', startTime: 27.4, duration: 1.1 },
      ],
    },
  ],
};

/**
 * Search global synchronized LRC lyrics by song title / artist
 */
export async function searchOnlineLyrics(
  query: string
): Promise<{ trackName: string; artistName: string; lines: KtvLine[] } | null> {
  if (!query || !query.trim()) return null;

  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    // Find the first result with synchronized lyrics
    const matched = data.find((item) => item.syncedLyrics && item.syncedLyrics.length > 0);
    if (!matched) return null;

    const parsedLines = parseLrc(matched.syncedLyrics);
    return {
      trackName: matched.trackName,
      artistName: matched.artistName,
      lines: parsedLines,
    };
  } catch (err) {
    console.error('Failed to search online lyrics:', err);
    return null;
  }
}

/**
 * Shift all lines and words by a given offset in seconds (e.g. +1.5s or -0.5s)
 */
export function offsetKtvLines(lines: KtvLine[], offsetSeconds: number): KtvLine[] {
  return lines.map((line) => ({
    ...line,
    startTime: Math.max(0, line.startTime + offsetSeconds),
    endTime: Math.max(0, line.endTime + offsetSeconds),
    words: line.words.map((w) => ({
      ...w,
      startTime: Math.max(0, w.startTime + offsetSeconds),
    })),
  }));
}
