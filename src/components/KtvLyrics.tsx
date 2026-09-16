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
  // Determine color palettes based on theme
  const themeColors = {
    gold: {
      activeGradient: 'linear-gradient(to right, #fde047, #f59e0b)',
      glow: '0 0 20px rgba(245, 158, 11, 0.6)',
      dotColor: 'bg-amber-400',
      ballColor: 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-amber-400/80',
    },
    cyan: {
      activeGradient: 'linear-gradient(to right, #67e8f9, #06b6d4)',
      glow: '0 0 20px rgba(6, 182, 212, 0.6)',
      dotColor: 'bg-cyan-400',
      ballColor: 'bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-cyan-400/80',
    },
    rose: {
      activeGradient: 'linear-gradient(to right, #f472b6, #ec4899)',
      glow: '0 0 20px rgba(236, 72, 153, 0.6)',
      dotColor: 'bg-rose-400',
      ballColor: 'bg-gradient-to-tr from-rose-400 to-pink-300 shadow-rose-400/80',
    },
  }[theme];

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
      {/* Subtle KTV neon ambient top bar */}
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
                    countdownDots >= dot ? themeColors.dotColor : 'bg-slate-700 opacity-40'
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
        {/* LINE 1: Active Line (with progressive character fill & bouncing ball) */}
        {currentLine ? (
          <div className="relative inline-flex items-center justify-center flex-wrap gap-x-1 gap-y-0.5 tracking-wider">
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

              const isSingingThisChar = fillPercent > 0 && fillPercent < 100;

              return (
                <span
                  key={`${currentLine.id}-${wIdx}`}
                  className="relative inline-block text-2xl md:text-3xl font-black transition-all"
                  style={{
                    fontFamily:
                      '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif',
                  }}
                >
                  {/* Bouncing Ball over current character */}
                  {isSingingThisChar && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
                      <span
                        className={`block w-2.5 h-2.5 rounded-full shadow-lg ${themeColors.ballColor}`}
                      />
                    </span>
                  )}

                  {/* Character with dynamic progressive fill gradient */}
                  <span
                    className="inline-block transition-colors"
                    style={{
                      background: `linear-gradient(to right, #fde047 0%, #f59e0b ${fillPercent}%, #ffffff ${fillPercent}%, #cbd5e1 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter:
                        fillPercent > 0 ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))' : 'none',
                    }}
                  >
                    {word.char}
                  </span>
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
            <div className="text-sm md:text-base font-bold text-slate-500 tracking-wide flex items-center gap-1.5 opacity-85 transition-opacity">
              <span className="text-[10px] uppercase font-bold text-slate-600 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
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
