import { useState, useEffect, useRef } from 'react';
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

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: 'chars' | 'words';
}

function SplitText({ 
  text, 
  className = '', 
  delay = 50, 
  duration = 0.6,
  splitType = 'chars'
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTextRef = useRef('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      setKey(prev => prev + 1);
    }
  }, [text]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const elements = containerRef.current.querySelectorAll('.split-char, .split-word');
    elements.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transform = 'translateY(20px)';
      htmlEl.style.transition = `opacity ${duration}s ease ${i * (delay / 1000)}s, transform ${duration}s ease ${i * (delay / 1000)}s`;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'translateY(0)';
        });
      });
    });
  }, [text, key, delay, duration]);

  const renderContent = () => {
    if (splitType === 'chars') {
      return text.split('').map((char, i) => (
        <span key={`${key}-${i}`} className="split-char" style={{ display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    }
    return text.split(' ').map((word, i) => (
      <span key={`${key}-${i}`} className="split-word" style={{ display: 'inline-block' }}>
        {word}
      </span>
    ));
  };

  return (
    <div 
      ref={containerRef} 
      className={`split-parent ${className}`}
      style={{ display: 'inline-block' }}
    >
      {renderContent()}
    </div>
  );
}

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
        {currentText ? (
          <SplitText 
            text={currentText} 
            delay={30}
            duration={0.5}
            splitType="chars"
          />
        ) : (
          '♪ 纯音乐，请欣赏'
        )}
      </div>
      <NoteIcon />
    </div>
  );
}
