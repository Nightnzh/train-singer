export interface YouTubePreset {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  category: '中文流行' | '經典情歌' | '西洋熱門';
  description: string;
}

/**
 * Extract 11-character YouTube Video ID from various URL formats or raw ID
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Raw 11-character ID: VIDEO_ID
 */
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Regular expression for common YouTube URL structures
  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);

  if (match) {
    return match[1];
  }

  // If not a URL (does not contain '/', '?', or '.'), allow raw 11-character video ID
  if (!/[\/?\.]/.test(trimmed) && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Format seconds into mm:ss display
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Presets of high-quality YouTube karaoke/accompaniment tracks
 */
export const YOUTUBE_PRESETS: YouTubePreset[] = [
  {
    id: 'preset-qingtian',
    title: '晴天 (Sunny Day) KTV 伴奏',
    artist: '周杰倫',
    videoId: 'qC_sY3eH5dI',
    category: '中文流行',
    description: '經典校園抒情金曲，旋律朗朗上口，極度適合練習中低音至混聲過渡。',
  },
  {
    id: 'preset-lucky',
    title: '小幸運 (A Little Happiness) 伴奏',
    artist: '田馥甄',
    videoId: 'wL3wUoI-LqA',
    category: '經典情歌',
    description: '清新抒情流行代表作，練習真假音轉換、氣息控制與副歌情緒起伏。',
  },
  {
    id: 'preset-lightyear',
    title: '光年之外 (Light Years Away) 伴奏',
    artist: '鄧紫棋 G.E.M.',
    videoId: 'f_i6Hox3e8o',
    category: '中文流行',
    description: '挑戰高音爆發力、胸頭腔共鳴與持續強音咬字。',
  },
  {
    id: 'preset-someone',
    title: 'Someone Like You (Piano Karaoke)',
    artist: 'Adele',
    videoId: '5-wZ1e0wD68',
    category: '西洋熱門',
    description: '純純鋼琴伴奏，非常考驗音準的純粹度、情感訴說力與顫音控制。',
  },
];
