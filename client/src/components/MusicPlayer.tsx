import { useState, useEffect, useCallback } from 'react';
import * as music from '../lib/musicStore';

export default function MusicPlayer() {
  const [state, setState] = useState(music.getState());

  useEffect(() => {
    return music.subscribe(() => setState(music.getState()));
  }, []);

  useEffect(() => {
    if (state.songs.length === 0) {
      music.loadPlaylist();
    }
  }, []);

  const currentSong = state.songs[state.currentIndex];

  const togglePlay = useCallback(() => music.togglePlay(), []);
  const handlePrev = useCallback(() => music.prev(), []);
  const handleNext = useCallback(() => music.next(), []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    music.seek(percent * state.duration);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="cmp-player">
        <div className="cmp-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="cmp-player">
      <div className="cmp-top">
        <img className="cmp-cover" src={currentSong.cover} alt={currentSong.name} />
        <div className="cmp-info">
          <div className="cmp-name">{currentSong.name}</div>
          <div className="cmp-artist">{currentSong.artist}</div>
        </div>
      </div>

      <div className="cmp-bottom">
        <div className="cmp-progress" onClick={handleProgressClick}>
          <div className="cmp-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="cmp-time">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
        <div className="cmp-controls">
          <button className="cmp-btn" onClick={handlePrev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button className="cmp-btn cmp-play" onClick={togglePlay}>
            {state.isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <button className="cmp-btn" onClick={handleNext}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
