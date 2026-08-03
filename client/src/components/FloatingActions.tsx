import { useState, useEffect, useRef } from 'react';
import GameModal from './games/GameModal';
import Game2048 from './games/Game2048';
import MemoryMatch from './games/MemoryMatch';
import MiniPiano from './games/MiniPiano';
import Snake from './games/Snake';
import Fortune from './games/Fortune';
import Match3 from './games/Match3';
import Blackjack from './games/Blackjack';
import WatermelonMerge from './games/WatermelonMerge';
import * as music from '../lib/musicStore';
import { petStore } from '../lib/petStore';

const GAMES: { id: string; name: string; theme: string }[] = [
  { id: '2048', name: '2048', theme: 'g-2048' },
  { id: 'memory', name: '记忆翻牌', theme: 'g-memory' },
  { id: 'piano', name: '迷你钢琴', theme: 'g-piano' },
  { id: 'snake', name: '贪吃蛇', theme: 'g-snake' },
  { id: 'fortune', name: '今日运势', theme: 'g-fortune' },
  { id: 'match3', name: '消消乐', theme: 'g-match3' },
  { id: 'blackjack', name: '21点', theme: 'g-blackjack' },
  { id: 'watermelon', name: '合成大西瓜', theme: 'g-watermelon' },
];

const GAME_ICONS: Record<string, React.ReactNode> = {
  '2048': <span className="float-game-icon-text">2048</span>,
  memory: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="12" height="16" rx="2.5" transform="rotate(-12 9.5 13)" />
      <rect x="8.5" y="3.5" width="12" height="16" rx="2.5" />
      <path d="M14.5 8.5 L17 12 L14.5 15.5 L12 12 Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  piano: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <line x1="8" y1="6.5" x2="8" y2="17.5" />
      <line x1="13" y1="6.5" x2="13" y2="17.5" />
      <path d="M5.5 6.5 h2.5 v4 h-2.5 z" fill="currentColor" stroke="none" />
      <path d="M10.5 6.5 h2.5 v4 h-2.5 z" fill="currentColor" stroke="none" />
      <path d="M15.5 6.5 h2.5 v4 h-2.5 z" fill="currentColor" stroke="none" />
    </svg>
  ),
  snake: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 17.5 V13 H15 V9 H11" />
      <circle cx="8.5" cy="17.5" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  fortune: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="7" />
      <path d="M7.5 15 H16.5 a4.5 4.5 0 0 1 -9 0 Z" />
      <path d="M12 6.5 L12.9 9.1 L15.5 10 L12.9 10.9 L12 13.5 L11.1 10.9 L8.5 10 L11.1 9.1 Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  match3: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  ),
  blackjack: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M12 8.2 L15 12.2 A3.8 3.8 0 1 1 9 12.2 Z" />
      <path d="M12 14.4 V17" />
    </svg>
  ),
  watermelon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 a8 8 0 0 1 8 8 h-16 a8 8 0 0 1 8 -8 Z" />
      <path d="M7.5 9.5 L9 11 M12 7.5 L12 9.5 M16.5 9.5 L15 11" strokeWidth="1.4" />
    </svg>
  ),
};

export default function FloatingActions() {
  const [showBackTop, setShowBackTop] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showGamesPanel, setShowGamesPanel] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [petHidden, setPetHidden] = useState(petStore.isHidden());
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
    if (!showPanel && !showGamesPanel) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPanel(false);
        setShowGamesPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel, showGamesPanel]);

  useEffect(() => {
    const sync = () => setPetHidden(petStore.isHidden());
    sync();
    return petStore.subscribe(sync);
  }, []);

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

  const toggleGamesPanel = () => {
    setShowGamesPanel(v => !v);
    setShowPanel(false);
  };

  const openGame = (gameId: string) => {
    setActiveGame(gameId);
    setShowGamesPanel(false);
  };

  const showPet = () => {
    petStore.wake();
    setShowGamesPanel(false);
  };

  const closeGame = () => {
    setActiveGame(null);
  };

  const activeGameName = GAMES.find(g => g.id === activeGame)?.name ?? '';

  const renderGame = () => {
    switch (activeGame) {
      case '2048':
        return <Game2048 />;
      case 'memory':
        return <MemoryMatch />;
      case 'piano':
        return <MiniPiano />;
      case 'snake':
        return <Snake />;
      case 'fortune':
        return <Fortune />;
      case 'match3':
        return <Match3 />;
      case 'blackjack':
        return <Blackjack />;
      case 'watermelon':
        return <WatermelonMerge />;
      default:
        return null;
    }
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

      <div className="float-games-wrap">
        {showGamesPanel && (
          <div className="float-games-panel">
            <div className="float-games-title">小游戏</div>
            <div className="float-games-grid">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  className="float-game-item"
                  onClick={() => openGame(game.id)}
                >
                  <span className={`float-game-icon ${game.theme}`}>{GAME_ICONS[game.id]}</span>
                  <span className="float-game-name">{game.name}</span>
                </button>
              ))}
              {petHidden && (
                <button
                  className="float-game-item"
                  onClick={showPet}
                  title="显示宠物"
                >
                  <span className="float-game-icon g-pet">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="11" r="2" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="11" r="2" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="13.5" r="2.6" fill="currentColor" stroke="none" />
                      <path d="M4.5 8.5 Q3 4.5 6 3.8 Q7.5 6 6.5 8.5" fill="currentColor" stroke="none" />
                      <path d="M19.5 8.5 Q21 4.5 18 3.8 Q16.5 6 17.5 8.5" fill="currentColor" stroke="none" />
                      <path d="M4 13 Q1.5 18 5.5 20.5 Q12 23.5 18.5 20.5 Q22.5 18 20 13" fill="currentColor" stroke="none" opacity="0.85" />
                    </svg>
                  </span>
                  <span className="float-game-name">显示宠物</span>
                </button>
              )}
            </div>
          </div>
        )}

        <button
          className={`float-btn float-games-btn${showGamesPanel ? ' active' : ''}`}
          onClick={toggleGamesPanel}
          title="小游戏"
          aria-label="小游戏"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5 13.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4.5 4.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4.5-4.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-4.5-4.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM21 2H3C1.35 2 0 3.35 0 5v14c0 1.65 1.35 3 3 3h18c1.65 0 3-1.35 3-3V5c0-1.65-1.35-3-3-3zm0 17H3V5h18v14z"/>
          </svg>
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

      <GameModal
        isOpen={activeGame !== null}
        onClose={closeGame}
        title={activeGameName}
      >
        {renderGame()}
      </GameModal>
    </div>
  );
}
