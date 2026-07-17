import { useState, useEffect, useRef, useCallback } from 'react';
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

export default function Music() {
  const [state, setState] = useState(music.getState());
  const [activeTab, setActiveTab] = useState<'lyrics' | 'playlist'>('lyrics');
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const playlistScrollRef = useRef<HTMLDivElement>(null);
  const playlistItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef<number>(state.volume || 0.5);
  const [showVolume, setShowVolume] = useState(false);
  const volumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return music.subscribe(() => setState(music.getState()));
  }, []);

  useEffect(() => {
    if (state.songs.length === 0) {
      music.loadPlaylist();
    }
  }, []);

  const currentSong = state.songs[state.currentIndex];

  useEffect(() => {
    setLines([]);
    setActiveLine(-1);
    if (!currentSong) return;
    const lrc = currentSong.lrc || '';
    if (lrc) {
      setLines(parseLRC(lrc));
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (lines.length === 0) {
      setActiveLine(-1);
      return;
    }
    let idx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (state.currentTime >= lines[i].time) {
        idx = i;
        break;
      }
    }
    setActiveLine(idx);
  }, [state.currentTime, lines]);

  useEffect(() => {
    if (activeTab === 'lyrics' && activeLine >= 0) {
      setTimeout(() => {
        const el = lineRefs.current[activeLine];
        if (el && lyricsScrollRef.current) {
          const container = lyricsScrollRef.current;
          const offsetTop = el.offsetTop - container.offsetTop;
          const scrollTo = offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
          container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [activeTab, activeLine]);

  useEffect(() => {
    if (activeTab === 'playlist' && state.currentIndex >= 0) {
      setTimeout(() => {
        const el = playlistItemRefs.current[state.currentIndex];
        if (el && playlistScrollRef.current) {
          const container = playlistScrollRef.current;
          const offsetTop = el.offsetTop - container.offsetTop;
          const scrollTo = offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
          container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [activeTab, state.currentIndex]);

  const togglePlay = useCallback(() => music.togglePlay(), []);
  const handlePrev = useCallback(() => music.prev(), []);
  const handleNext = useCallback(() => music.next(), []);
  const toggleMode = useCallback(() => music.togglePlayMode(), []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (vol > 0) prevVolumeRef.current = vol;
    music.setVolume(vol);
  };

  const toggleMute = () => {
    if (state.volume > 0) {
      prevVolumeRef.current = state.volume;
      music.setVolume(0);
    } else {
      music.setVolume(prevVolumeRef.current || 0.5);
    }
  };

  const isMuted = state.volume === 0;

  const handleVolumeEnter = () => {
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    setShowVolume(true);
  };

  const handleVolumeLeave = () => {
    volumeTimerRef.current = setTimeout(() => setShowVolume(false), 200);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    music.seek(percent * state.duration);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    music.seek(percent * state.duration);
  }, [isDragging, state.duration]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="music-page">
        <div className="music-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="music-page">
      <div className="music-layout">
        <div className="music-left">
          <div className="music-disc-wrapper">
            <div className={`music-disc ${state.isPlaying ? 'music-disc-spinning' : ''}`}>
              <img className="music-disc-img" src={currentSong.cover} alt={currentSong.name} />
              <div className="music-disc-center" />
            </div>
            <div className="music-disc-glow" />
          </div>

          <div className="music-song-info">
            <div className="music-song-name">{currentSong.name}</div>
            <div className="music-song-artist">{currentSong.artist}</div>
          </div>

          <div className="music-progress">
            <div 
              ref={progressRef}
              className="music-progress-bar" 
              onClick={handleProgressClick}
            >
              <div className="music-progress-fill" style={{ width: `${progress}%` }} />
              <div 
                className={`music-progress-dot ${isDragging ? 'dragging' : ''}`}
                style={{ left: `${progress}%` }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              />
            </div>
            <div className="music-progress-time">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>

          <div className="music-controls">
            <button className="music-ctrl-btn" onClick={toggleMode} title={
              state.playMode === 'sequential' ? '顺序播放' :
              state.playMode === 'shuffle' ? '随机播放' : '单曲循环'
            }>
              {state.playMode === 'sequential' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                </svg>
              )}
              {state.playMode === 'shuffle' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              )}
              {state.playMode === 'single' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
                </svg>
              )}
            </button>
            <button className="music-ctrl-btn" onClick={handlePrev}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button className="music-ctrl-play" onClick={togglePlay}>
              {state.isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <button className="music-ctrl-btn" onClick={handleNext}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <div
              className="music-volume-wrap"
              onMouseEnter={handleVolumeEnter}
              onMouseLeave={handleVolumeLeave}
            >
              <button className="music-ctrl-btn music-volume-btn" onClick={toggleMute}>
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" stroke="none"/>
                    <line x1="16" y1="9" x2="21" y2="15"/>
                    <line x1="21" y1="9" x2="16" y2="15"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              {showVolume && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.volume}
                  onChange={handleVolumeChange}
                  className="music-volume-slider"
                />
              )}
            </div>
          </div>
        </div>

        <div className="music-right">
          <div className="music-tabs">
            <button
              className={`music-tab ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              歌词
            </button>
            <button
              className={`music-tab ${activeTab === 'playlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('playlist')}
            >
              歌单
            </button>
          </div>

          {activeTab === 'lyrics' ? (
            <div className="music-lyrics" ref={lyricsScrollRef}>
              {lines.length > 0 ? (
                lines.map((line, i) => (
                  <div
                    key={i}
                    ref={el => { lineRefs.current[i] = el; }}
                    className={`music-lyric-line ${i === activeLine ? 'active' : ''}`}
                    onClick={() => music.seek(line.time)}
                  >
                    {line.text}
                  </div>
                ))
              ) : (
                <div className="music-lyric-empty">暂无歌词</div>
              )}
            </div>
          ) : (
            <div className="music-playlist" ref={playlistScrollRef}>
              {state.songs.map((song, i) => (
                <div
                  key={song.id}
                  ref={el => { playlistItemRefs.current[i] = el; }}
                  className={`music-playlist-item ${i === state.currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    music.setSong(i);
                  }}
                >
                  <img className="music-playlist-cover" src={song.cover} alt={song.name} />
                  <div className="music-playlist-info">
                    <div className="music-playlist-name">{song.name}</div>
                    <div className="music-playlist-artist">{song.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
