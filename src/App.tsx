import { useState, useEffect, useCallback } from 'react';
import type { PitchData } from './types/audio';
import { audioEngine } from './audio/AudioEngine';
import { Navbar, type AppMode } from './components/Navbar';
import { MonitorView } from './components/MonitorView';
import { CoachView } from './components/CoachView';
import { SongView } from './components/SongView';
import { Heart } from 'lucide-react';

export function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('monitor');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Subscribe to audio engine pitch events
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((data: PitchData) => {
      setPitchData(data);
      setInputVolume(data.volume);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartMic = useCallback(async () => {
    try {
      setMicError(null);
      await audioEngine.start();
      setIsMicActive(true);
    } catch (err: unknown) {
      console.error('Failed to access microphone:', err);
      setMicError('無法存取麥克風，請檢查瀏覽器麥克風權限設定。');
      setIsMicActive(false);
    }
  }, []);

  const handleStopMic = useCallback(() => {
    audioEngine.stop();
    setIsMicActive(false);
    setPitchData(null);
    setInputVolume(0);
  }, []);

  const handleToggleMic = useCallback(() => {
    if (isMicActive) {
      handleStopMic();
    } else {
      handleStartMic();
    }
  }, [isMicActive, handleStartMic, handleStopMic]);

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        inputVolume={inputVolume}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Microphone Error Alert if blocked */}
        {micError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between shadow-lg">
            <span>⚠️ {micError}</span>
            <button
              onClick={handleStartMic}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-bold"
            >
              重試授權
            </button>
          </div>
        )}

        {/* View Switching */}
        {activeMode === 'monitor' && (
          <MonitorView
            pitchData={pitchData}
            isMicActive={isMicActive}
            onStartMic={handleStartMic}
          />
        )}

        {activeMode === 'coach' && (
          <CoachView
            pitchData={pitchData}
            isMicActive={isMicActive}
            onStartMic={handleStartMic}
          />
        )}

        {activeMode === 'song' && (
          <SongView
            pitchData={pitchData}
            isMicActive={isMicActive}
            onStartMic={handleStartMic}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span>Train Singer 歌唱訓練助手</span>
            <span>•</span>
            <span className="text-slate-400">YIN 音準演算法 + Web Audio 60 FPS Canvas</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>建議佩戴耳機練習以獲得最佳評分體驗</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
