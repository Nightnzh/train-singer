import React from 'react';
import type { KtvLine } from '../utils/lyrics';
import { Music } from 'lucide-react';

interface KtvLyricsProps {
  lines: KtvLine[];
  playbackTime: number;
  theme?: 'gold' | 'cyan' | 'rose';
  className?: string;
}

export const KtvLyrics: React.FC<KtvLyricsProps> = ({
  lines = [],
  playbackTime = 0,
  theme = 'gold',
  className = '',
}) => {
  // Pure text colors (no background-clip, zero square/rectangle artifacts)
  const sungTextColor = {
    gold: 'text-amber-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
  }[theme] || 'text-amber-400';

  const dotColor = {
    gold: 'bg-amber-400',
    cyan: 'bg-cyan-400',
    rose: 'bg-rose-400',
  }[theme] || 'bg-amber-400';

  if (lines.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-slate-500 text-xs">
        <Music className="w-5 h-5 mx-auto mb-1 opacity-40" />
        <span>尚未載入字幕或暫無歌詞</span>
      </div>
    );
  }

  // Find active line index
  let activeIndex = lines.findIndex(
    (line) => playbackTime >= line.startTime - 3.5 && playbackTime <= line.endTime + 0.5
  );

  // If before first line
  if (activeIndex === -1 && playbackTime < lines[0].startTime) {
    activeIndex = 0;
  }

  // If between lines, pick the next upcoming line
  if (activeIndex === -1) {
    activeIndex = lines.findIndex((line) => line.startTime > playbackTime);
    if (activeIndex === -1) activeIndex = lines.length - 1;
  }

  const currentLine = lines[activeIndex];
  const nextLine = lines[activeIndex + 1] || null;

  // Countdown calculations
  const timeUntilStart = currentLine ? currentLine.startTime - playbackTime : -1;
  const isCountingDown = timeUntilStart > 0 && timeUntilStart <= 3.5;
  const countdownDots = isCountingDown ? Math.max(1, Math.ceil(timeUntilStart)) : 0;

  return (
    <div
      className={`relative w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 p-5 shadow-2xl overflow-hidden select-none ${className}`}
    >
      {/* Subtle KTV ambient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Countdown and phrase indicator badge */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            KTV 字幕
          </span>

          {/* 4 Countdown Dots leading into phrase */}
          {isCountingDown && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="text-[11px] font-bold text-amber-400 mr-0.5">預備</span>
              {[4, 3, 2, 1].map((dot) => (
                <span
                  key={dot}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    countdownDots >= dot ? dotColor : 'bg-slate-700 opacity-40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          句數：{activeIndex + 1} / {lines.length}
        </div>
      </div>

      {/* Dual-line KTV display container */}
      <div className="space-y-3 text-center min-h-[96px] flex flex-col justify-center">
        {/* LINE 1: Active Line (PURE text color fill - no background, zero square artifacts) */}
        {currentLine ? (
          <div className="relative inline-flex items-center justify-center flex-wrap gap-x-0.5 gap-y-1 tracking-wide">
            {currentLine.words.map((word, wIdx) => {
              let fillPercent = 0;
              if (playbackTime >= word.startTime + word.duration) {
                fillPercent = 100;
              } else if (playbackTime >= word.startTime) {
                fillPercent = Math.min(
                  100,
                  Math.max(0, ((playbackTime - word.startTime) / word.duration) * 100)
                );
              }

              return (
                <span
                  key={`${currentLine.id}-${wIdx}`}
                  className="relative inline-block text-2xl md:text-3xl font-black leading-tight"
                  style={{
                    fontFamily:
                      '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif',
                  }}
                >
                  {/* 1. Base Layer: Unsung character in white/light gray */}
                  <span className="text-slate-200">{word.char}</span>

                  {/* 2. Overlay Layer: ONLY text color change, clipped strictly by character width */}
                  {fillPercent > 0 && (
                    <span
                      className={`absolute top-0 left-0 h-full overflow-hidden ${sungTextColor} select-none pointer-events-none`}
                      style={{
                        width: `${fillPercent}%`,
                        whiteSpace: 'pre',
                      }}
                    >
                      {word.char}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-xl text-slate-600 font-bold">...</div>
        )}

        {/* LINE 2: Next Line Preview (Soft white/gray, ready to sing next) */}
        <div className="min-h-[28px] flex items-center justify-center">
          {nextLine ? (
            <div className="text-sm md:text-base font-bold text-slate-400 tracking-wide flex items-center gap-1.5 opacity-90 transition-opacity">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                次句
              </span>
              <span>{nextLine.text}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-600 italic">
              {playbackTime > (currentLine?.endTime || 0) ? '— 歌曲結束 —' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
