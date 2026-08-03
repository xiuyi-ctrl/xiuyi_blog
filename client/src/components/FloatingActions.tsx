import { useState, useEffect, useRef } from 'react';
import * as music from '../lib/musicStore';

export default function FloatingActions() {
  const [showBackTop, setShowBackTop] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isPlaying, setIsPlaying] = useState(music.getState().isPlaying);
  const [volume, setVolume] = useState(music.getState().volume);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [song, setSong] = useState<{ name: string; artist: string; cover: string } | null>(null);
  const [playMode, setPlayMode] = useState(music.getState().playMode);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = music.getState();
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
      setProgress(state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0);
      setDuration(state.duration);
      setCurrentTime(state.currentTime);
      setPlayMode(state.playMode);
      const s = music.getCurrentSong();
      setSong(s ? { name: s.name, artist: s.artist, cover: s.cover } : null);
    };
    sync();
    return music.subscribe(sync);
  }, []);

  useEffect(() => {
    if (!showPanel) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  const handleBackTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    music.seek(percent * duration);
  };

  return (
    <div className="floating-actions" ref={containerRef}>
      <div className="float-player-wrap">
        {showPanel && (
          <div className="float-player-panel">
            <div className="float-player-song">
              <img className="float-player-cover" src={song?.cover} alt="" />
              <div className="float-player-info">
                <div className="float-player-name">{song?.name || '未在播放'}</div>
                <div className="float-player-artist">{song?.artist || ''}</div>
              </div>
            </div>

            <div className="float-player-progress" onClick={handleProgressClick}>
              <div className="float-player-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="float-player-time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="float-player-controls">
              <button
                className="float-ctrl-btn"
                onClick={() => music.togglePlayMode()}
                title={playMode === 'sequential' ? '顺序播放' : playMode === 'shuffle' ? '随机播放' : '单曲循环'}
                aria-label={playMode === 'sequential' ? '顺序播放' : playMode === 'shuffle' ? '随机播放' : '单曲循环'}
              >
                {playMode === 'sequential' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                )}
                {playMode === 'shuffle' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                  </svg>
                )}
                {playMode === 'single' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
                  </svg>
                )}
              </button>
              <button className="float-ctrl-btn" onClick={() => music.prev()} title="上一首" aria-label="上一首">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              <button className="float-ctrl-play" onClick={() => music.togglePlay()} title={isPlaying ? '暂停' : '播放'} aria-label={isPlaying ? '暂停' : '播放'}>
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              <button className="float-ctrl-btn" onClick={() => music.next()} title="下一首" aria-label="下一首">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            <div className="float-player-volume">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="float-player-vol-icon">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => music.setVolume(parseFloat(e.target.value))}
                className="float-player-vol-slider"
                aria-label="音量"
              />
            </div>
          </div>
        )}

        <button
          className={`float-btn float-player-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={() => setShowPanel(v => !v)}
          title={song ? `${song.name} - ${song.artist}` : '音乐播放器'}
          aria-label="音乐播放器"
        >
          {song ? (
            <img className="float-player-thumb" src={song.cover} alt="" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
            </svg>
          )}
          {isPlaying && <span className="float-equalizer">
            <i /><i /><i />
          </span>}
        </button>
      </div>

      <button
        className={`float-btn float-backtop${showBackTop ? ' show' : ''}`}
        onClick={handleBackTop}
        title="回到顶部"
        aria-label="回到顶部"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
      </button>
    </div>
  );
}
