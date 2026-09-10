import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Award, CheckCircle2 } from 'lucide-react';
import type { PerformanceStats } from '../types/audio';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  title: string;
  stats: PerformanceStats;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  title,
  stats,
}) => {
  useEffect(() => {
    if (isOpen && stats.score >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
  }, [isOpen, stats.score]);

  if (!isOpen) return null;

  // Grade calculation
  let grade = 'C';
  let gradeColor = 'text-slate-400 border-slate-500';
  let praise = '多加練習，氣息與音準會越來越穩定！';

  if (stats.score >= 90) {
    grade = 'S';
    gradeColor = 'text-amber-400 border-amber-400 bg-amber-400/10 shadow-amber-500/30';
    praise = '完美演繹！音準與氣息極度穩定，具備專業歌手水準！';
  } else if (stats.score >= 80) {
    grade = 'A';
    gradeColor = 'text-emerald-400 border-emerald-400 bg-emerald-400/10 shadow-emerald-500/30';
    praise = '非常好！絕大部分音符精準命中，表現相當亮眼！';
  } else if (stats.score >= 70) {
    grade = 'B';
    gradeColor = 'text-sky-400 border-sky-400 bg-sky-400/10 shadow-sky-500/30';
    praise = '掌握得不錯！留意音程跳躍時的音準起伏。';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl overflow-hidden text-center">
        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>練習成果結算</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

        {/* Rank & Score Badge */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center shadow-lg ${gradeColor}`}>
            <span className="text-6xl font-black">{grade}</span>
          </div>

          <div className="text-left">
            <div className="text-xs text-slate-400 uppercase tracking-wider">整體綜合得分</div>
            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              {stats.score}
              <span className="text-2xl text-slate-400 font-normal"> / 100</span>
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Award className="w-3.5 h-3.5" />
              <span>音準精準度 {stats.pitchAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Feedback Quote */}
        <p className="text-sm text-slate-300 italic mb-6 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          "{praise}"
        </p>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-emerald-400 font-semibold">Perfect</div>
            <div className="text-xl font-bold text-slate-100">{stats.perfectCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-amber-400 font-semibold">Great</div>
            <div className="text-xl font-bold text-slate-100">{stats.greatCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-rose-400 font-semibold">Miss</div>
            <div className="text-xl font-bold text-slate-100">{stats.missCount}</div>
          </div>
        </div>

        {/* Vocal tendency analysis */}
        <div className="text-xs text-left p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-400 space-y-1 mb-6">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>聲樂教練診斷：</span>
          </div>
          <p>
            {stats.pitchTendency === 'flat' && '音準整體略微「偏低 (Flat)」。建議發聲時加強橫膈膜氣息支撐，想像聲音從眉心向外送出。'}
            {stats.pitchTendency === 'sharp' && '音準整體略微「偏高 (Sharp)」。建議喉頭放鬆下沉，避免喉嚨過度夾緊擠壓發力。'}
            {stats.pitchTendency === 'balanced' && '音準中心十分平衡穩定！連擊最高達 ' + stats.maxCombo + ' 次。繼續保持此發聲位置！'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            再練一次
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition"
          >
            返回練習項目
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
