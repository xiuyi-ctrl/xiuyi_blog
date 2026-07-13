import { useState, useEffect } from 'react';
import * as music from '../lib/musicStore';

interface LyricLine {
  time: number;
  text: string;
}

function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.?\d*)\]/g);
    if (!match) continue;
    const text = line.replace(/\[\d+:\d+\.?\d*\]/g, '').trim();
    if (!text) continue;
    for (const tag of match) {
      const m = tag.match(/\[(\d+):(\d+\.?\d*)\]/);
      if (m) {
        const time = parseInt(m[1]) * 60 + parseFloat(m[2]);
        result.push({ time, text });
      }
    }
  }
  result.sort((a, b) => a.time - b.time);
  return result;
}

const NoteIcon = () => (
  <svg className="current-lyric-note" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
);

export default function CurrentLyric() {
  const [state, setState] = useState(music.getState());
  const [currentText, setCurrentText] = useState('');
  const [lines, setLines] = useState<LyricLine[]>([]);

  useEffect(() => {
    return music.subscribe(() => setState(music.getState()));
  }, []);

  const currentSong = state.songs[state.currentIndex];

  useEffect(() => {
    setLines([]);
    setCurrentText('');
    if (!currentSong) return;

    const lrc = currentSong.lrc || '';
    if (lrc) {
      setLines(parseLRC(lrc));
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (lines.length === 0) {
      setCurrentText('');
      return;
    }
    let idx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (state.currentTime >= lines[i].time) {
        idx = i;
        break;
      }
    }
    setCurrentText(idx >= 0 ? lines[idx].text : '');
  }, [state.currentTime, lines]);

  return (
    <div className="current-lyric-card">
      <NoteIcon />
      <div className={`current-lyric-text ${!currentText ? 'current-lyric-empty' : ''}`}>
        {currentText || '♪ 纯音乐，请欣赏'}
      </div>
      <NoteIcon />
    </div>
  );
}
