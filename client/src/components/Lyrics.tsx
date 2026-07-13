import { useState, useEffect, useRef } from 'react';
import api from '../api';

interface LyricsProps {
  songId: number;
  currentTime: number;
}

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

export default function Lyrics({ songId, currentTime }: LyricsProps) {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setLines([]);
    setActiveIndex(-1);

    const fetchLyric = async () => {
      try {
        const { data } = await api.get(`/music/lyric/${songId}`);
        if (data.success && data.lrc) {
          setLines(parseLRC(data.lrc));
        }
      } catch (err) {
        console.error('Failed to fetch lyric:', err);
      }
    };

    fetchLyric();
  }, [songId]);

  useEffect(() => {
    if (lines.length === 0) return;

    let idx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        idx = i;
        break;
      }
    }
    setActiveIndex(idx);
  }, [currentTime, lines]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    if (el && containerRef.current) {
      const container = containerRef.current;
      const offsetTop = el.offsetTop - container.offsetTop;
      const scrollTo = offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [activeIndex]);

  if (lines.length === 0) {
    return (
      <div className="lyrics-card">
        <div className="lyrics-header">♪ 歌词</div>
        <div className="lyrics-empty">暂无歌词</div>
      </div>
    );
  }

  return (
    <div className="lyrics-card">
      <div className="lyrics-header">♪ 歌词</div>
      <div className="lyrics-scroll" ref={containerRef}>
        <div className="lyrics-spacer" />
        {lines.map((line, i) => (
          <div
            key={`${songId}-${i}`}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={`lyrics-line ${i === activeIndex ? 'lyrics-active' : ''}`}
          >
            {line.text}
          </div>
        ))}
        <div className="lyrics-spacer" />
      </div>
    </div>
  );
}
