import React, { useState } from 'react';
import { Mic, MicOff, Sliders, Music, Activity, Headphones, Volume2 } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

export type AppMode = 'monitor' | 'coach' | 'song';

interface NavbarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  inputVolume: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onModeChange,
  isMicActive,
  onToggleMic,
  inputVolume,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [gain, setGain] = useState(1.2);

  const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setGain(val);
    audioEngine.setInputGain(val);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none m-0">
              Train Singer
            </h1>
            <span className="text-[11px] text-sky-400 font-medium">智慧練唱教練</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onModeChange('monitor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'monitor'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>自由音準監控</span>
          </button>

          <button
            onClick={() => onModeChange('coach')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'coach'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>發聲音階教練</span>
          </button>

          <button
            onClick={() => onModeChange('song')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'song'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>歌曲跟唱挑戰</span>
          </button>
        </nav>

        {/* Mic & Settings Controls */}
        <div className="flex items-center gap-3">
          {/* Live Volume Meter Bar */}
          {isMicActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, inputVolume * 350)}%` }}
                />
              </div>
            </div>
          )}

          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="收音設定"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 text-xs">
                <div className="font-bold text-slate-200 mb-3">麥克風輸入靈敏度</div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>軟體增益 (Gain)</span>
                  <span className="font-mono text-sky-400">{gain.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={gain}
                  onChange={handleGainChange}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  若聲音太小難以辨識，可適度調高增益；若有破音爆音請調低。
                </p>
              </div>
            )}
          </div>

          {/* Mic Toggle Button */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isMicActive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMicActive ? '停止收音' : '啟動麥克風'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
