import React, { useState, useEffect } from 'react';
import type { PitchData } from '../types/audio';
import { PitchGauge } from './PitchGauge';
import { PitchCanvas } from './PitchCanvas';
import { RotateCcw, Info, Sparkles } from 'lucide-react';

interface MonitorViewProps {
  pitchData: PitchData | null;
  isMicActive: boolean;
  onStartMic: () => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  pitchData,
  isMicActive,
  onStartMic,
}) => {
  const [lowestNote, setLowestNote] = useState<{ note: string; midi: number } | null>(null);
  const [highestNote, setHighestNote] = useState<{ note: string; midi: number } | null>(null);

  // Track personal vocal range
  useEffect(() => {
    if (!pitchData || pitchData.frequency <= 0 || pitchData.clarity < 0.7) return;

    const midi = Math.round(pitchData.midi);
    const note = pitchData.noteName;

    setLowestNote((prev) => (!prev || midi < prev.midi ? { note, midi } : prev));
    setHighestNote((prev) => (!prev || midi > prev.midi ? { note, midi } : prev));
  }, [pitchData]);

  const handleResetRange = () => {
    setLowestNote(null);
    setHighestNote(null);
  };

  const semitoneRange =
    highestNote && lowestNote ? Math.max(0, highestNote.midi - lowestNote.midi + 1) : 0;
  const octaveRange = (semitoneRange / 12).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner if mic is not active */}
      {!isMicActive && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">尚未開啟麥克風收音</div>
              <div className="text-xs text-slate-300">
                點擊右側按鈕允許瀏覽器存取麥克風，即可即時偵測您的歌聲音高！
              </div>
            </div>
          </div>
          <button
            onClick={onStartMic}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition whitespace-nowrap cursor-pointer"
          >
            立即啟動
          </button>
        </div>
      )}

      {/* Main Pitch Gauge */}
      <PitchGauge pitchData={pitchData} />

      {/* 60 FPS Real-time Rolling Pitch Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>鋼琴捲軸即時音準軌跡 (Piano Roll Stream)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">時間軸自動向左捲動</span>
        </div>

        <PitchCanvas
          currentPitch={pitchData}
          isLiveScroll={true}
          minMidi={45} // A2
          maxMidi={76} // E5
          height={380}
        />
      </div>

      {/* Vocal Range & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lowest Note */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">本次探索最低音</div>
            <div className="text-3xl font-extrabold text-sky-400">
              {lowestNote ? lowestNote.note : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {lowestNote ? `MIDI #${lowestNote.midi}` : '唱出低音來記錄'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg">
            Low
          </div>
        </div>

        {/* Highest Note */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">本次探索最高音</div>
            <div className="text-3xl font-extrabold text-indigo-400">
              {highestNote ? highestNote.note : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {highestNote ? `MIDI #${highestNote.midi}` : '唱出高音來記錄'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
            High
          </div>
        </div>

        {/* Span Range */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">音域總跨度</div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {semitoneRange > 0 ? `${octaveRange} 八度` : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {semitoneRange > 0 ? `涵蓋 ${semitoneRange} 個半音` : '請發聲以計算'}
            </div>
          </div>
          <button
            onClick={handleResetRange}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="重設記錄"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vocal Tips */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">自由練唱技巧小撇步：</span>
          對著麥克風發出長音「嗚 (Uu)」或「啊 (Ah)」，觀察音準軌跡是否維持在同一水平線上。如果軌跡上下晃動較大，代表氣息支撐不足；若軌跡在音分錶上剛好落入中央綠色區間（±20
          cents 內），代表音準非常紮實！
        </div>
      </div>
    </div>
  );
};
