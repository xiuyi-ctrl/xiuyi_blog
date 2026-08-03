import { useState, useRef, useEffect, useCallback } from 'react';

const WHITE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const WHITE_FREQS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
const BLACK_NOTES = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'];
const BLACK_FREQS = [277.18, 311.13, 369.99, 415.3, 466.16];
const BLACK_BRIDGE = [0, 1, 3, 4, 5];
const WHITE_WIDTH_PCT = 100 / 7;
const BLACK_WIDTH_PCT = 8.6;

const KEY_MAP: Record<string, string> = {
  a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4',
  f: 'F4', t: 'F#4', g: 'G4', y: 'G#4', h: 'A4', u: 'A#4', j: 'B4',
};

const KEY_HINTS: { key: string; note: string }[] = [
  { key: 'A', note: 'C' },
  { key: 'W', note: 'C#' },
  { key: 'S', note: 'D' },
  { key: 'E', note: 'D#' },
  { key: 'D', note: 'E' },
  { key: 'F', note: 'F' },
  { key: 'T', note: 'F#' },
  { key: 'G', note: 'G' },
  { key: 'Y', note: 'G#' },
  { key: 'H', note: 'A' },
  { key: 'U', note: 'A#' },
  { key: 'J', note: 'B' },
];

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

export default function MiniPiano() {
  const [noteCount, setNoteCount] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem('miniPiano_best');
    return saved ? parseInt(saved) : 0;
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const pressedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    audioCtxRef.current = createAudioContext();
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  const playFrequency = useCallback(
    (freq: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.45, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      setNoteCount(n => {
        const next = n + 1;
        if (next > best) {
          setBest(next);
          localStorage.setItem('miniPiano_best', String(next));
        }
        return next;
      });
    },
    [best]
  );

  const playNote = useCallback(
    (note: string) => {
      const whiteIdx = WHITE_NOTES.indexOf(note);
      const blackIdx = BLACK_NOTES.indexOf(note);
      const freq =
        whiteIdx !== -1
          ? WHITE_FREQS[whiteIdx]
          : blackIdx !== -1
            ? BLACK_FREQS[blackIdx]
            : null;
      if (freq == null) return;
      playFrequency(freq);
    },
    [playFrequency]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = KEY_MAP[key];
      if (!note) return;
      if (pressedRef.current.has(key)) return;
      pressedRef.current.add(key);
      playNote(note);
    },
    [playNote]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    pressedRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const reset = () => {
    setNoteCount(0);
  };

  return (
    <div className="mini-piano-container">
      <div className="mini-piano-stats">
        <div className="mini-piano-stat">
          <span className="mini-piano-stat-label">弹奏音符</span>
          <span className="mini-piano-stat-value">{noteCount}</span>
        </div>
        <div className="mini-piano-stat">
          <span className="mini-piano-stat-label">最佳连弹</span>
          <span className="mini-piano-stat-value">{best}</span>
        </div>
        <button className="mini-piano-reset-btn" onClick={reset}>
          重置
        </button>
      </div>

      <div className="mini-piano-keyboard">
        <div className="mini-piano-white-row">
          {WHITE_NOTES.map((note) => (
            <button
              key={note}
              className="mini-piano-key white"
              onMouseDown={() => playNote(note)}
              onTouchStart={e => {
                e.preventDefault();
                playNote(note);
              }}
              aria-label={note}
            >
              <span className="mini-piano-key-label">{note}</span>
            </button>
          ))}
        </div>
        <div className="mini-piano-black-row">
          {BLACK_NOTES.map((note, i) => (
            <button
              key={note}
              className="mini-piano-key black"
              style={{
                left: `${(BLACK_BRIDGE[i] + 1) * WHITE_WIDTH_PCT - BLACK_WIDTH_PCT / 2}%`,
              }}
              onMouseDown={() => playNote(note)}
              onTouchStart={e => {
                e.preventDefault();
                playNote(note);
              }}
              aria-label={note}
            >
              <span className="mini-piano-key-label">{note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mini-piano-instructions">
        <p>键盘弹奏（或点击琴键）：</p>
        <div className="mini-piano-hints">
          {KEY_HINTS.map(h => (
            <span key={h.key} className="mini-piano-hint">
              <kbd>{h.key}</kbd> {h.note}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
