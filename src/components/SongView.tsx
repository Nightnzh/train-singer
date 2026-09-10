import React, { useState, useEffect, useRef } from 'react';
import type { Song, PitchData, PerformanceStats, HitRating, NoteTarget } from '../types/audio';
import { SONGS } from '../data/songs';
import { synth } from '../audio/SynthAudio';
import { PitchCanvas } from './PitchCanvas';
import { PitchGauge } from './PitchGauge';
import { ScoreModal } from './ScoreModal';
import { Play, Square, Flame, Music } from 'lucide-react';

interface SongViewProps {
  pitchData: PitchData | null;
  isMicActive: boolean;
  onStartMic: () => void;
}

export const SongView: React.FC<SongViewProps> = ({
  pitchData,
  isMicActive,
  onStartMic,
}) => {
  const [selectedSong, setSelectedSong] = useState<Song>(SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [keyOffset, setKeyOffset] = useState<number>(0); // Transpose (-6 to +6)
  const [currentHitStatus, setCurrentHitStatus] = useState<HitRating>('idle');
  const [combo, setCombo] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const chordsPlayedRef = useRef<Set<number>>(new Set());
  const statsTrackerRef = useRef<{
    samples: Array<{ dev: number; rating: HitRating }>;
    maxCombo: number;
    currentCombo: number;
    perfects: number;
    greats: number;
    misses: number;
  }>({
    samples: [],
    maxCombo: 0,
    currentCombo: 0,
    perfects: 0,
    greats: 0,
    misses: 0,
  });

  // Transposed target notes
  const transposedNotes: NoteTarget[] = selectedSong.notes.map((n) => ({
    ...n,
    midi: n.midi + keyOffset,
  }));

  // Min and max MIDI for canvas view
  const minMidi = Math.min(...transposedNotes.map((n) => n.midi)) - 4;
  const maxMidi = Math.max(...transposedNotes.map((n) => n.midi)) + 5;

  const handleStartSong = () => {
    if (!isMicActive) {
      onStartMic();
    }

    // Reset session trackers
    statsTrackerRef.current = {
      samples: [],
      maxCombo: 0,
      currentCombo: 0,
      perfects: 0,
      greats: 0,
      misses: 0,
    };
    chordsPlayedRef.current.clear();
    setCombo(0);
    setLiveScore(0);
    setStats(null);
    setCurrentHitStatus('idle');

    setIsPlaying(true);
    setPlaybackTime(0);
    startTimeRef.current = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      setPlaybackTime(elapsed);

      // Play backing chords at their scheduled times
      if (selectedSong.backingTrack) {
        selectedSong.backingTrack.chords.forEach((chordEvent, index) => {
          if (!chordsPlayedRef.current.has(index) && elapsed >= chordEvent.time) {
            chordsPlayedRef.current.add(index);
            const transposedChord = chordEvent.notes.map((m) => m + keyOffset);
            synth.playChord(transposedChord, 1.8);
          }
        });
      }

      // Check if song reached the end
      if (elapsed >= selectedSong.duration + 1.0) {
        finishSong();
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handleStopSong = () => {
    setIsPlaying(false);
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Evaluate user singing pitch against currently playing note
  useEffect(() => {
    if (!isPlaying) return;

    const activeNote = transposedNotes.find(
      (n) => playbackTime >= n.startTime && playbackTime <= n.startTime + n.duration
    );

    if (activeNote && pitchData && pitchData.frequency > 0 && pitchData.clarity > 0.6) {
      const centsDiff = (pitchData.midi - activeNote.midi) * 100;
      const absCents = Math.abs(centsDiff);

      let rating: HitRating = 'miss';
      if (absCents <= 30) {
        rating = 'perfect';
      } else if (absCents <= 50) {
        rating = 'great';
      }

      setCurrentHitStatus(rating);

      const tracker = statsTrackerRef.current;
      tracker.samples.push({ dev: centsDiff, rating });

      if (rating === 'perfect' || rating === 'great') {
        tracker.currentCombo += 1;
        if (tracker.currentCombo > tracker.maxCombo) {
          tracker.maxCombo = tracker.currentCombo;
        }
        setCombo(tracker.currentCombo);

        // Increment score
        setLiveScore((prev) => Math.min(100, prev + (rating === 'perfect' ? 0.35 : 0.2)));
      } else {
        tracker.currentCombo = 0;
        setCombo(0);
      }
    } else {
      setCurrentHitStatus('idle');
    }
  }, [isPlaying, playbackTime, pitchData, transposedNotes]);

  const finishSong = () => {
    handleStopSong();

    const tracker = statsTrackerRef.current;
    const totalSamples = Math.max(1, tracker.samples.length);
    const perfects = tracker.samples.filter((s) => s.rating === 'perfect').length;
    const greats = tracker.samples.filter((s) => s.rating === 'great').length;
    const misses = tracker.samples.filter((s) => s.rating === 'miss').length;

    const hitRate = Math.round(((perfects + greats * 0.7) / totalSamples) * 100);
    const finalScore = Math.min(100, Math.max(0, Math.round(liveScore * 2.2)));

    const avgDev = tracker.samples.reduce((a, b) => a + b.dev, 0) / totalSamples;
    let pitchTendency: 'flat' | 'sharp' | 'balanced' = 'balanced';
    if (avgDev < -15) pitchTendency = 'flat';
    else if (avgDev > 15) pitchTendency = 'sharp';

    const resultStats: PerformanceStats = {
      totalNotes: selectedSong.notes.length,
      perfectCount: perfects,
      greatCount: greats,
      missCount: misses,
      maxCombo: tracker.maxCombo,
      currentCombo: 0,
      score: finalScore || hitRate,
      pitchAccuracy: hitRate,
      pitchTendency,
      averageCentsDeviation: Math.round(avgDev),
    };

    setStats(resultStats);
    setShowScoreModal(true);
  };

  // Find active note for display and lyric sync
  const activeNote = transposedNotes.find(
    (n) => playbackTime >= n.startTime && playbackTime <= n.startTime + n.duration
  );

  return (
    <div className="space-y-6">
      {/* Song Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SONGS.map((song) => {
          const isSelected = selectedSong.id === song.id;
          return (
            <button
              key={song.id}
              onClick={() => {
                if (!isPlaying) {
                  setSelectedSong(song);
                  setKeyOffset(0);
                }
              }}
              disabled={isPlaying}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-sky-950/70 border-sky-500/80 shadow-lg shadow-sky-500/15'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400 mb-1">
                {song.artist} • 難度 {song.difficulty}
              </div>
              <div className="text-sm font-bold text-slate-100">{song.title}</div>
              <div className="text-xs text-slate-400 mt-1">時長約 {song.duration} 秒 • {song.bpm} BPM</div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400 shadow-sky-400/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Control Bar: Key Transpose & Play Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Key Transpose */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">歌曲移調 (Key)：</span>
          <button
            disabled={isPlaying}
            onClick={() => setKeyOffset((prev) => Math.max(-6, prev - 1))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center transition"
          >
            -
          </button>
          <span className="w-12 text-center text-xs font-mono font-bold text-sky-400">
            {keyOffset > 0 ? `+${keyOffset}` : keyOffset === 0 ? '原調' : keyOffset}
          </span>
          <button
            disabled={isPlaying}
            onClick={() => setKeyOffset((prev) => Math.min(6, prev + 1))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center transition"
          >
            +
          </button>
        </div>

        {/* Live Score & Combo Meter */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${combo > 2 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
            <div className="text-left">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">連擊 COMBO</div>
              <div className="text-lg font-black text-amber-400 font-mono leading-none">
                x{combo}
              </div>
            </div>
          </div>

          <div className="text-left">
            <div className="text-[10px] uppercase text-slate-400 font-semibold">當前得分</div>
            <div className="text-lg font-black text-sky-400 font-mono leading-none">
              {Math.round(liveScore * 2.2)} <span className="text-xs text-slate-500 font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!isPlaying ? (
            <button
              onClick={handleStartSong}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>伴奏跟唱</span>
            </button>
          ) : (
            <button
              onClick={handleStopSong}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>停止播放</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Karaoke Lyrics Display */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-center shadow-inner">
        <div className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-sky-400" />
          <span>動態歌詞同步</span>
        </div>
        <div className="text-2xl font-black tracking-wide text-slate-200 min-h-[36px] flex items-center justify-center gap-1">
          {transposedNotes.map((note) => {
            const isNoteActive =
              playbackTime >= note.startTime && playbackTime <= note.startTime + note.duration;
            const hasPassed = playbackTime > note.startTime + note.duration;

            return (
              <span
                key={note.id}
                className={`transition-all duration-100 ${
                  isNoteActive
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300 scale-125 font-extrabold px-1'
                    : hasPassed
                    ? 'text-slate-500 font-medium'
                    : 'text-slate-300 font-normal'
                }`}
              >
                {note.lyric || note.noteName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Pitch Gauge */}
      <PitchGauge
        pitchData={pitchData}
        targetMidi={activeNote ? activeNote.midi : null}
        targetNoteName={activeNote ? `${activeNote.noteName} (${activeNote.lyric})` : null}
      />

      {/* Canvas */}
      <div className="relative space-y-2">
        {/* Real-time Hit Status Tag */}
        {isPlaying && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            {currentHitStatus === 'perfect' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 animate-pulse">
                PERFECT!
              </span>
            )}
            {currentHitStatus === 'great' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-400 text-black shadow-lg shadow-amber-400/50">
                GREAT
              </span>
            )}
          </div>
        )}

        <PitchCanvas
          currentPitch={pitchData}
          targetNotes={transposedNotes}
          playbackTime={playbackTime}
          isLiveScroll={false}
          minMidi={minMidi}
          maxMidi={maxMidi}
          hitStatus={currentHitStatus}
          height={380}
        />
      </div>

      {/* Score Modal */}
      {stats && (
        <ScoreModal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
          onRetry={() => {
            setShowScoreModal(false);
            handleStartSong();
          }}
          title={selectedSong.title}
          stats={stats}
        />
      )}
    </div>
  );
};
