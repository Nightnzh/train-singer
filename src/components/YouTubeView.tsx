import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PitchData } from '../types/audio';
import { PitchGauge } from './PitchGauge';
import { PitchCanvas } from './PitchCanvas';
import { KtvLyrics } from './KtvLyrics';
import { YOUTUBE_KTV_LYRICS, parseLrc, type KtvLine } from '../utils/lyrics';
import {
  extractYouTubeVideoId,
  formatTime,
  YOUTUBE_PRESETS,
  type YouTubePreset,
} from '../utils/youtube';
import {
  Play,
  Square,
  Repeat,
  Tv,
  TvMinimal,
  RotateCcw,
  Sparkles,
  Link,
  ChevronRight,
  Gauge,
  FileText,
  X,
} from 'lucide-react';

interface YouTubeViewProps {
  pitchData: PitchData | null;
  isMicActive: boolean;
  onStartMic: () => void;
}

// Minimal YouTube IFrame API Player interface
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YouTubeView: React.FC<YouTubeViewProps> = ({
  pitchData,
  isMicActive,
  onStartMic,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>(YOUTUBE_PRESETS[0].videoId);
  const [currentTitle, setCurrentTitle] = useState<string>(YOUTUBE_PRESETS[0].title);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showVideo, setShowVideo] = useState<boolean>(true);

  // A-B Loop State
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  // Custom LRC Lyrics State
  const [customLrcLines, setCustomLrcLines] = useState<KtvLine[] | null>(null);
  const [showLrcModal, setShowLrcModal] = useState<boolean>(false);
  const [lrcInputText, setLrcInputText] = useState<string>('');

  // Active KTV Lyrics: custom pasted LRC or built-in preset lyrics
  const activeLyrics: KtvLine[] = useMemo(() => {
    if (customLrcLines && customLrcLines.length > 0) return customLrcLines;
    return YOUTUBE_KTV_LYRICS[currentVideoId] || [];
  }, [customLrcLines, currentVideoId]);

  const playerRef = useRef<YTPlayer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isApiLoadedRef = useRef<boolean>(false);

  // Initialize YouTube IFrame API
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player-frame', {
        videoId: currentVideoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!isApiLoadedRef.current) {
        isApiLoadedRef.current = true;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentVideoId]);

  // High-frequency playback sync loop
  useEffect(() => {
    const syncLoop = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime() || 0;
        setPlaybackTime(time);

        const d = playerRef.current.getDuration() || 0;
        if (d > 0 && d !== duration) {
          setDuration(d);
        }

        // A-B Loop boundary check
        if (isLooping && loopStart !== null && loopEnd !== null && loopEnd > loopStart) {
          if (time >= loopEnd) {
            playerRef.current.seekTo(loopStart, true);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(syncLoop);
    };

    animFrameRef.current = requestAnimationFrame(syncLoop);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [duration, isLooping, loopStart, loopEnd]);

  // Handle URL or ID submission
  const handleLoadUrl = useCallback(() => {
    const extractedId = extractYouTubeVideoId(urlInput);
    if (extractedId) {
      setCurrentVideoId(extractedId);
      setCurrentTitle(`自訂 YouTube 影片 (${extractedId})`);
      setUrlInput('');
      setLoopStart(null);
      setLoopEnd(null);
      setIsLooping(false);
      setCustomLrcLines(null);
    } else {
      alert('請輸入有效的 YouTube 影片網址或 11 碼 Video ID！');
    }
  }, [urlInput]);

  const handleSelectPreset = (preset: YouTubePreset) => {
    setCurrentVideoId(preset.videoId);
    setCurrentTitle(preset.title);
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
    setCustomLrcLines(null);
  };

  const handleApplyLrc = () => {
    if (!lrcInputText.trim()) {
      setCustomLrcLines(null);
      setShowLrcModal(false);
      return;
    }

    const parsed = parseLrc(lrcInputText);
    if (parsed.length === 0) {
      alert('無法解析歌詞，請確保包含 [00:12.34] 時間戳記！');
      return;
    }

    setCustomLrcLines(parsed);
    setShowLrcModal(false);
  };

  const handleLoadExampleLrc = () => {
    const example = `[00:02.00]示範 KTV 歌詞開始
[00:06.50]這是一首自訂匯入的練唱歌
[00:11.20]支援任何標準 LRC 時間標籤
[00:16.80]現在跟著動態走字一起大聲唱`;
    setLrcInputText(example);
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      if (!isMicActive) {
        onStartMic();
      }
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setPlaybackTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const handleSetLoopStart = () => {
    setLoopStart(Math.round(playbackTime * 10) / 10);
  };

  const handleSetLoopEnd = () => {
    setLoopEnd(Math.round(playbackTime * 10) / 10);
  };

  const handleClearLoop = () => {
    setIsLooping(false);
    setLoopStart(null);
    setLoopEnd(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner if mic is not active */}
      {!isMicActive && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 to-indigo-950/70 border border-red-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">尚未開啟麥克風</div>
              <div className="text-xs text-slate-300">
                開啟麥克風後，YouTube 播放時即可在鋼琴捲軸上即時繪製您的音準曲線！
              </div>
            </div>
          </div>
          <button
            onClick={onStartMic}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition whitespace-nowrap cursor-pointer"
          >
            啟動麥克風
          </button>
        </div>
      )}

      {/* YouTube URL Input Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Link className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
            placeholder="貼上任何 YouTube 歌曲 / KTV 伴奏網址（例如 https://www.youtube.com/watch?v=...）"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/70 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
          />
        </div>
        <button
          onClick={handleLoadUrl}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>載入音源</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Presets Grid */}
      <div>
        <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>精選 YouTube 伴奏推薦（點擊一鍵載入）：</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {YOUTUBE_PRESETS.map((preset) => {
            const isSelected = currentVideoId === preset.videoId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-red-950/50 border-red-500/80 shadow-lg shadow-red-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-red-400 mb-1">
                  {preset.artist} • {preset.category}
                </div>
                <div className="text-xs font-bold text-slate-100 line-clamp-1">{preset.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400 shadow-red-400/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pitch Gauge */}
      <PitchGauge pitchData={pitchData} />

      {/* Embedded YouTube Player & Controls Area */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Title & View Toggle Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">
              當前音源
            </span>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{currentTitle}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback speed pills */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => handleRateChange(0.75)}
                className={`px-2 py-0.5 rounded-md transition ${
                  playbackRate === 0.75 ? 'bg-red-500 text-white font-bold' : 'text-slate-400'
                }`}
              >
                0.75x
              </button>
              <button
                onClick={() => handleRateChange(1.0)}
                className={`px-2 py-0.5 rounded-md transition ${
                  playbackRate === 1.0 ? 'bg-red-500 text-white font-bold' : 'text-slate-400'
                }`}
              >
                1.0x
              </button>
              <button
                onClick={() => handleRateChange(1.25)}
                className={`px-2 py-0.5 rounded-md transition ${
                  playbackRate === 1.25 ? 'bg-red-500 text-white font-bold' : 'text-slate-400'
                }`}
              >
                1.25x
              </button>
            </div>

            {/* Toggle Video Display */}
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title={showVideo ? '隱藏影片畫面（純音訊模式）' : '顯示影片畫面'}
            >
              {showVideo ? <TvMinimal className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
              <span>{showVideo ? '隱藏影片' : '顯示影片'}</span>
            </button>
          </div>
        </div>

        {/* YouTube IFrame Mount Container */}
        <div
          className={`relative rounded-xl overflow-hidden bg-black transition-all duration-300 ${
            showVideo ? 'w-full max-w-xl mx-auto aspect-video shadow-2xl' : 'h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div id="youtube-player-frame" className="w-full h-full" />
        </div>

        {/* Playback Scrubber & Time */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(playbackTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={playbackTime}
            onChange={handleSeek}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
          />
        </div>

        {/* Control Toolbar: Play, Loop A-B, etc. */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          {/* Main Play / Pause Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer ${
                isPlaying
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/25'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? '暫停播放' : '開始播放跟唱'}</span>
            </button>
          </div>

          {/* A-B Loop Controls */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-red-400" />
              <span>A-B 段落循環：</span>
            </span>

            <button
              onClick={handleSetLoopStart}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition"
            >
              A: {loopStart !== null ? formatTime(loopStart) : '設起點'}
            </button>

            <span className="text-slate-600">→</span>

            <button
              onClick={handleSetLoopEnd}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition"
            >
              B: {loopEnd !== null ? formatTime(loopEnd) : '設終點'}
            </button>

            {loopStart !== null && loopEnd !== null && loopEnd > loopStart && (
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  isLooping
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isLooping ? '循環中' : '啟動循環'}
              </button>
            )}

            {(loopStart !== null || loopEnd !== null) && (
              <button
                onClick={handleClearLoop}
                className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition"
                title="清除循環標記"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* LRC Lyrics Modal Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLrcModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
                customLrcLines
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/15'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="匯入或自訂 LRC 歌詞"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{customLrcLines ? '自訂歌詞 (已套用)' : '歌詞設定 (LRC)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real KTV Dynamic Subtitles Component */}
      <KtvLyrics lines={activeLyrics} playbackTime={playbackTime} theme="gold" />

      {/* 60 FPS Pitch Canvas (Synchronized with YouTube time) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-red-400" />
            <span>YouTube 同步鋼琴捲軸音準軌跡</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            目前秒數：{formatTime(playbackTime)}
          </span>
        </div>

        <PitchCanvas
          currentPitch={pitchData}
          playbackTime={playbackTime}
          isLiveScroll={false}
          minMidi={40} // E2
          maxMidi={80} // G#5
          height={380}
        />
      </div>

      {/* Custom LRC Lyrics Import Modal */}
      {showLrcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">匯入自訂 LRC 歌詞</h3>
              </div>
              <button
                onClick={() => setShowLrcModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              貼上標準 LRC 歌詞格式（每行包含 <code>[mm:ss.xx]</code> 時間戳記），系統將自動對齊 YouTube 影片產生逐字染色 KTV 字幕！
            </p>

            <textarea
              rows={8}
              value={lrcInputText}
              onChange={(e) => setLrcInputText(e.target.value)}
              placeholder="[00:12.30]第一句歌詞&#10;[00:16.80]第二句歌詞..."
              className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadExampleLrc}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  填入範例
                </button>
                {customLrcLines && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLrcLines(null);
                      setLrcInputText('');
                      setShowLrcModal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-medium transition cursor-pointer border border-rose-800/40"
                  >
                    恢復預設歌詞
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLrcModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleApplyLrc}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  套用歌詞
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
