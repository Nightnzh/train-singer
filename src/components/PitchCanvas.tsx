import React, { useEffect, useRef } from 'react';
import type { PitchData, NoteTarget } from '../types/audio';
import { NOTE_NAMES } from '../audio/notes';

interface PitchCanvasProps {
  currentPitch: PitchData | null;
  targetNotes?: NoteTarget[];
  playbackTime?: number;      // Current time in seconds (for song/coach mode)
  isLiveScroll?: boolean;     // True for monitor mode (scrolls dynamically)
  minMidi?: number;           // Default 48 (C3)
  maxMidi?: number;           // Default 74 (D5)
  hitStatus?: 'perfect' | 'great' | 'miss' | 'idle';
  height?: number;
}

interface RecordedPoint {
  midi: number;
  time: number;
  clarity: number;
  hitStatus?: 'perfect' | 'great' | 'miss' | 'idle';
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
  currentPitch,
  targetNotes = [],
  playbackTime = 0,
  isLiveScroll = false,
  minMidi = 48, // C3
  maxMidi = 74, // D5
  hitStatus = 'idle',
  height = 360,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<RecordedPoint[]>([]);

  // Record user pitch points into history
  useEffect(() => {
    if (!currentPitch) return;

    const now = isLiveScroll ? performance.now() / 1000 : playbackTime;

    if (currentPitch.frequency > 0 && currentPitch.clarity > 0.6) {
      historyRef.current.push({
        midi: currentPitch.midi,
        time: now,
        clarity: currentPitch.clarity,
        hitStatus: hitStatus,
      });
    }

    // Keep history clean (keep within 10 seconds of now)
    const cutoff = now - 10;
    while (historyRef.current.length > 0 && historyRef.current[0].time < cutoff) {
      historyRef.current.shift();
    }
  }, [currentPitch, playbackTime, isLiveScroll, hitStatus]);

  // Main 60 FPS Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || 800;
      const h = height;

      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#0f131d';
      ctx.fillRect(0, 0, width, h);

      const totalSemitones = maxMidi - minMidi;
      const rowHeight = h / totalSemitones;
      const currentTime = isLiveScroll ? performance.now() / 1000 : playbackTime;

      // Playhead position
      const playheadX = isLiveScroll ? width * 0.85 : width * 0.28;
      const pixelsPerSecond = 140; // Horizontal scroll speed

      // 1. Draw Piano Roll Rows (Black and White keys background)
      for (let midi = maxMidi; midi >= minMidi; midi--) {
        const y = (maxMidi - midi) * rowHeight;
        const noteIndex = ((midi % 12) + 12) % 12;
        const isSharp = [1, 3, 6, 8, 10].includes(noteIndex);
        const isC = noteIndex === 0;

        // Row background
        ctx.fillStyle = isSharp ? '#141824' : '#192030';
        ctx.fillRect(0, y, width, rowHeight);

        // Row border
        ctx.strokeStyle = isC ? '#334155' : '#1e293b';
        ctx.lineWidth = isC ? 1.5 : 0.6;
        ctx.beginPath();
        ctx.moveTo(0, y + rowHeight);
        ctx.lineTo(width, y + rowHeight);
        ctx.stroke();

        // Note Labels on left edge
        if (isC || !isSharp) {
          const octave = Math.floor(midi / 12) - 1;
          const label = `${NOTE_NAMES[noteIndex]}${octave}`;
          ctx.fillStyle = isC ? '#38bdf8' : '#64748b';
          ctx.font = isC ? 'bold 11px system-ui, sans-serif' : '10px system-ui, sans-serif';
          ctx.fillText(label, 8, y + rowHeight - 4);
        }
      }

      // Helper function to map MIDI to Y
      const midiToY = (midiVal: number) => {
        return (maxMidi - midiVal) * rowHeight;
      };

      // 2. Draw Target Note Blocks (for Songs & Exercises)
      if (targetNotes.length > 0) {
        targetNotes.forEach((note) => {
          const startX = playheadX + (note.startTime - currentTime) * pixelsPerSecond;
          const blockWidth = Math.max(12, note.duration * pixelsPerSecond);
          const y = midiToY(note.midi) + 2;
          const blockHeight = rowHeight - 4;

          // Only draw if visible on canvas
          if (startX + blockWidth >= 0 && startX <= width) {
            const isCurrentlyPlaying =
              currentTime >= note.startTime && currentTime <= note.startTime + note.duration;

            // Target block styling
            ctx.save();
            ctx.shadowBlur = isCurrentlyPlaying ? 14 : 4;
            ctx.shadowColor = isCurrentlyPlaying ? '#38bdf8' : 'transparent';

            ctx.fillStyle = isCurrentlyPlaying ? 'rgba(56, 189, 248, 0.45)' : 'rgba(59, 130, 246, 0.2)';
            ctx.strokeStyle = isCurrentlyPlaying ? '#38bdf8' : '#3b82f6';
            ctx.lineWidth = isCurrentlyPlaying ? 2 : 1;

            // Rounded rectangle
            const r = 4;
            ctx.beginPath();
            ctx.roundRect(startX, y, blockWidth, blockHeight, r);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Syllable or Note text inside block
            const text = note.lyric || note.noteName;
            ctx.fillStyle = isCurrentlyPlaying ? '#ffffff' : '#93c5fd';
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, startX + blockWidth / 2, y + blockHeight / 2);
          }
        });
      }

      // 3. Draw User Singing History Trail
      const history = historyRef.current;
      if (history.length > 1) {
        for (let i = 1; i < history.length; i++) {
          const pPrev = history[i - 1];
          const pCurr = history[i];

          // If gap between points is larger than 150ms, don't bridge them (separate singing phrases)
          if (Math.abs(pCurr.time - pPrev.time) > 0.15) continue;

          const x1 = playheadX + (pPrev.time - currentTime) * pixelsPerSecond;
          const y1 = midiToY(pPrev.midi);
          const x2 = playheadX + (pCurr.time - currentTime) * pixelsPerSecond;
          const y2 = midiToY(pCurr.midi);

          if (x2 < 0 || x1 > width) continue;

          ctx.save();
          let strokeColor = '#38bdf8'; // Default sky blue
          if (pCurr.hitStatus === 'perfect') strokeColor = '#10b981'; // Emerald
          else if (pCurr.hitStatus === 'great') strokeColor = '#f59e0b'; // Amber
          else if (pCurr.hitStatus === 'miss') strokeColor = '#f43f5e'; // Rose

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 8;
          ctx.shadowColor = strokeColor;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Draw Current Pitch Cursor & Playhead
      // Vertical Playhead Line
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.restore();

      // Current live pitch head indicator
      if (currentPitch && currentPitch.frequency > 0 && currentPitch.clarity > 0.6) {
        const liveY = midiToY(currentPitch.midi);
        const color =
          hitStatus === 'perfect' ? '#10b981' : hitStatus === 'great' ? '#f59e0b' : '#38bdf8';

        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // Glowing circle at playhead
        ctx.beginPath();
        ctx.arc(playheadX, liveY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(playheadX, liveY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Small tag showing current note next to playhead
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(playheadX + 12, liveY - 12, 46, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentPitch.noteName, playheadX + 35, liveY - 1);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentPitch, targetNotes, playbackTime, isLiveScroll, minMidi, maxMidi, hitStatus, height]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0f131d]">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      />
    </div>
  );
};
