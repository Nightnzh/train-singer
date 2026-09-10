import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Exercise, NoteTarget, PitchData, PerformanceStats, HitRating } from '../types/audio';
import { EXERCISES, KEY_PRESETS } from '../data/exercises';
import { synth } from '../audio/SynthAudio';
import { midiToNoteInfo } from '../audio/notes';
import { PitchCanvas } from './PitchCanvas';
import { PitchGauge } from './PitchGauge';
import { ScoreModal } from './ScoreModal';
import { Play, Square, Volume2 } from 'lucide-react';

interface CoachViewProps {
  pitchData: PitchData | null;
  isMicActive: boolean;
  onStartMic: () => void;
}

export const CoachView: React.FC<CoachViewProps> = ({
  pitchData,
  isMicActive,
  onStartMic,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(EXERCISES[2]); // Default 5-tone
  const [baseMidi, setBaseMidi] = useState<number>(60); // Default C4
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [currentHitStatus, setCurrentHitStatus] = useState<HitRating>('idle');
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const statsTrackerRef = useRef<{
    samples: Array<{ dev: number; rating: HitRating }>;
    maxCombo: number;
    currentCombo: number;
  }>({ samples: [], maxCombo: 0, currentCombo: 0 });

  // Generate target notes based on selected exercise and chosen base key
  const targetNotes: NoteTarget[] = useMemo(() => {
    const secondsPerBeat = 60 / selectedExercise.tempo;
    let accumulatedTime = 0; // Starts right after count-in

    return selectedExercise.notes.map((n, idx) => {
      const midi = baseMidi + n.relativeMidi;
      const noteInfo = midiToNoteInfo(midi);
      const duration = n.durationBeats * secondsPerBeat;
      const item: NoteTarget = {
        id: `target-${idx}`,
        midi,
        noteName: noteInfo.noteName,
        startTime: accumulatedTime,
        duration,
        lyric: n.solfege,
      };
      accumulatedTime += duration;
      return item;
    });
  }, [selectedExercise, baseMidi]);

  const totalDuration = useMemo(() => {
    if (targetNotes.length === 0) return 0;
    const last = targetNotes[targetNotes.length - 1];
    return last.startTime + last.duration;
  }, [targetNotes]);

  // Preview the exercise demo sound
  const handlePreviewAudio = () => {
    if (isPlaying) return;
    const now = synth.getCurrentTime();
    targetNotes.forEach((n) => {
      synth.playNote(n.midi, n.duration * 0.9, now + n.startTime, 0.6);
    });
  };

  // Start the vocal practice session
  const handleStartExercise = () => {
    if (!isMicActive) {
      onStartMic();
    }

    // Reset stats
    statsTrackerRef.current = { samples: [], maxCombo: 0, currentCombo: 0 };
    setStats(null);
    setCurrentHitStatus('idle');

    // Start 4-beat count in
    setCountdown(3);
    const countInterval = 600; // ms per beat for count-in

    synth.playClick(false);
    setTimeout(() => {
      setCountdown(2);
      synth.playClick(false);
    }, countInterval);

    setTimeout(() => {
      setCountdown(1);
      synth.playClick(false);
    }, countInterval * 2);

    setTimeout(() => {
      setCountdown(null);
      synth.playClick(true);
      beginExercise();
    }, countInterval * 3);
  };

  const beginExercise = () => {
    setIsPlaying(true);
    setPlaybackTime(0);
    startTimeRef.current = performance.now();

    // Play accompanying piano prompts slightly to guide singer
    const audioNow = synth.getCurrentTime();
    targetNotes.forEach((n) => {
      synth.playNote(n.midi, n.duration * 0.5, audioNow + n.startTime, 0.35);
    });

    // Start frame evaluation loop
    const runLoop = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      setPlaybackTime(elapsed);

      if (elapsed >= totalDuration + 0.6) {
        // Exercise finished!
        finishExercise();
        return;
      }

      timerRef.current = requestAnimationFrame(runLoop);
    };

    timerRef.current = requestAnimationFrame(runLoop);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCountdown(null);
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  };

  // Evaluate user pitch against active target note
  useEffect(() => {
    if (!isPlaying) return;

    // Find current active note target
    const activeNote = targetNotes.find(
      (n) => playbackTime >= n.startTime && playbackTime <= n.startTime + n.duration
    );

    if (activeNote && pitchData && pitchData.frequency > 0 && pitchData.clarity > 0.6) {
      const midiDiff = pitchData.midi - activeNote.midi;
      const centsDiff = midiDiff * 100;
      const absCents = Math.abs(centsDiff);

      let rating: HitRating = 'miss';
      if (absCents <= 28) {
        rating = 'perfect';
      } else if (absCents <= 50) {
        rating = 'great';
      }

      setCurrentHitStatus(rating);

      // Track sample
      if (rating === 'perfect' || rating === 'great') {
        statsTrackerRef.current.currentCombo += 1;
        if (statsTrackerRef.current.currentCombo > statsTrackerRef.current.maxCombo) {
          statsTrackerRef.current.maxCombo = statsTrackerRef.current.currentCombo;
        }
      } else {
        statsTrackerRef.current.currentCombo = 0;
      }

      statsTrackerRef.current.samples.push({ dev: centsDiff, rating });
    } else {
      setCurrentHitStatus('idle');
    }
  }, [isPlaying, playbackTime, pitchData, targetNotes]);

  const finishExercise = () => {
    handleStop();

    const { samples, maxCombo } = statsTrackerRef.current;
    const totalSamples = Math.max(1, samples.length);
    const perfects = samples.filter((s) => s.rating === 'perfect').length;
    const greats = samples.filter((s) => s.rating === 'great').length;
    const misses = samples.filter((s) => s.rating === 'miss').length;

    const hitRate = Math.round(((perfects + greats * 0.7) / totalSamples) * 100);
    const finalScore = Math.min(100, Math.max(0, hitRate));

    // Calculate average pitch tendency
    const avgDev = samples.reduce((acc, cur) => acc + cur.dev, 0) / totalSamples;
    let pitchTendency: 'flat' | 'sharp' | 'balanced' = 'balanced';
    if (avgDev < -15) pitchTendency = 'flat';
    else if (avgDev > 15) pitchTendency = 'sharp';

    const resultStats: PerformanceStats = {
      totalNotes: targetNotes.length,
      perfectCount: perfects,
      greatCount: greats,
      missCount: misses,
      maxCombo,
      currentCombo: 0,
      score: finalScore,
      pitchAccuracy: hitRate,
      pitchTendency,
      averageCentsDeviation: Math.round(avgDev),
    };

    setStats(resultStats);
    setShowScoreModal(true);
  };

  // Find active note for display
  const activeNote = targetNotes.find(
    (n) => playbackTime >= n.startTime && playbackTime <= n.startTime + n.duration
  );

  return (
    <div className="space-y-6">
      {/* Exercise Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EXERCISES.map((ex) => {
          const isSelected = selectedExercise.id === ex.id;
          return (
            <button
              key={ex.id}
              onClick={() => {
                if (!isPlaying) setSelectedExercise(ex);
              }}
              disabled={isPlaying}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-sky-950/60 border-sky-500/80 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400 mb-1">
                {ex.difficulty} • {ex.tempo} BPM
              </div>
              <div className="text-sm font-bold text-slate-100 line-clamp-1">{ex.title}</div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-2">{ex.description}</div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400 shadow-sky-400/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Control Toolbar: Key Pitch Selector & Action Buttons */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Key Selection */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">起唱基準音 (Key)：</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {KEY_PRESETS.map((preset) => (
              <button
                key={preset.midi}
                disabled={isPlaying}
                onClick={() => {
                  setBaseMidi(preset.midi);
                  synth.playNote(preset.midi, 0.4);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  baseMidi === preset.midi
                    ? 'bg-sky-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewAudio}
            disabled={isPlaying}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>示範聽音</span>
          </button>

          {!isPlaying ? (
            <button
              onClick={handleStartExercise}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>開始練唱</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>停止</span>
            </button>
          )}
        </div>
      </div>

      {/* Pitch Gauge */}
      <PitchGauge
        pitchData={pitchData}
        targetMidi={activeNote ? activeNote.midi : null}
        targetNoteName={activeNote ? `${activeNote.noteName} (${activeNote.lyric})` : null}
      />

      {/* 60 FPS Canvas with Target Note Bars */}
      <div className="relative space-y-2">
        {/* Count-in overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-2xl">
            <div className="text-center animate-bounce">
              <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                {countdown}
              </span>
              <div className="text-lg font-bold text-white mt-2">準備開口唱！</div>
            </div>
          </div>
        )}

        {/* Real-time Hit Status Badge */}
        {isPlaying && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            {currentHitStatus === 'perfect' && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 animate-pulse">
                PERFECT!
              </span>
            )}
            {currentHitStatus === 'great' && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-black shadow-lg shadow-amber-400/40">
                GREAT
              </span>
            )}
          </div>
        )}

        <PitchCanvas
          currentPitch={pitchData}
          targetNotes={targetNotes}
          playbackTime={playbackTime}
          isLiveScroll={false}
          minMidi={Math.max(36, baseMidi - 6)}
          maxMidi={Math.min(84, baseMidi + 18)}
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
            handleStartExercise();
          }}
          title={selectedExercise.title}
          stats={stats}
        />
      )}
    </div>
  );
};
