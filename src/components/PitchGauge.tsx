import React from 'react';
import type { PitchData } from '../types/audio';

interface PitchGaugeProps {
  pitchData: PitchData | null;
  targetMidi?: number | null;
  targetNoteName?: string | null;
}

export const PitchGauge: React.FC<PitchGaugeProps> = ({
  pitchData,
  targetMidi: _targetMidi = null,
  targetNoteName = null,
}) => {
  const hasVoice = pitchData && pitchData.frequency > 0 && pitchData.clarity > 0.6;
  const cents = hasVoice ? pitchData.cents : 0;
  const noteName = hasVoice ? pitchData.noteName : '—';
  const freq = hasVoice ? `${pitchData.frequency} Hz` : '等待聲音輸入...';

  // Cent deviation color
  const absCents = Math.abs(cents);
  let statusColor = 'text-slate-400';
  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
  let statusText = '靜音 / 未發聲';

  if (hasVoice) {
    if (absCents <= 20) {
      statusColor = 'text-emerald-400';
      badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20';
      statusText = '完美命中 (Perfect)';
    } else if (absCents <= 40) {
      statusColor = 'text-amber-400';
      badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-500/20';
      statusText = cents < 0 ? '略微偏低 (Slightly Flat)' : '略微偏高 (Slightly Sharp)';
    } else {
      statusColor = 'text-rose-400';
      badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-500/20';
      statusText = cents < 0 ? '明顯偏低 (Flat)' : '明顯偏高 (Sharp)';
    }
  }

  // Pointer position (-50 to +50 cents -> 0% to 100%)
  const needlePercent = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Note Display */}
      <div className="flex items-center gap-5">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 shadow-inner">
          <span className={`text-4xl font-extrabold tracking-tight transition-colors duration-150 ${statusColor}`}>
            {noteName}
          </span>
          {hasVoice && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Live
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            即時音高辨識
          </div>
          <div className="text-lg font-bold text-slate-100">{freq}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badgeColor} transition-all duration-200`}>
              {statusText}
            </span>
            {targetNoteName && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-950/80 text-blue-300 border border-blue-500/40">
                目標音: {targetNoteName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cents Deviation Needle Bar */}
      <div className="w-full md:w-80 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span className="text-rose-400">-50c (偏低)</span>
          <span className="text-emerald-400 font-bold">0c (標準音準)</span>
          <span className="text-rose-400">+50c (偏高)</span>
        </div>

        {/* Gauge Track */}
        <div className="relative h-5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex items-center shadow-inner">
          {/* Green sweet spot in center (-20 to +20 cents -> 30% to 70%) */}
          <div className="absolute left-[30%] right-[30%] h-full bg-emerald-500/15 border-x border-emerald-500/30" />
          {/* Zero center tick line */}
          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-emerald-400/80 z-10" />

          {/* Needle Indicator */}
          {hasVoice && (
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full transition-all duration-75 z-20 shadow-md"
              style={{
                left: `${needlePercent}%`,
                backgroundColor: absCents <= 20 ? '#10b981' : absCents <= 40 ? '#f59e0b' : '#f43f5e',
                boxShadow: absCents <= 20 ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
              }}
            />
          )}
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>{hasVoice ? `${cents > 0 ? '+' : ''}${cents} cents` : '0 cents'}</span>
          <span>穩定度: {hasVoice ? `${Math.round(pitchData.clarity * 100)}%` : '—'}</span>
        </div>
      </div>
    </div>
  );
};
