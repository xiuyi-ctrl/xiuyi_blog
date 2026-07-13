import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

interface Song {
  id: number;
  name: string;
  artist: string;
  cover: string;
  url: string;
}

const STORAGE_KEY = 'xiuyi_music_player';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface MusicPlayerProps {
  onSongChange?: (songId: number, time: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export default function MusicPlayer({ onSongChange, onTimeUpdate }: MusicPlayerProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const savedState = useRef(loadState());
  const [currentIndex, setCurrentIndex] = useState(savedState.current?.currentIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(savedState.current?.isPlaying ?? false);
  const [currentTime, setCurrentTime] = useState(savedState.current?.currentTime ?? 0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const savedTimeRef = useRef<number | null>(savedState.current?.currentTime ?? null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (currentSong) {
      onSongChange?.(currentSong.id, currentTime);
    }
  }, [currentSong?.id, currentTime, onSongChange]);

  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data } = await api.get('/music/playlist/18146875685');
        if (data.success && data.songs.length > 0) {
          const filtered = data.songs.filter((s: Song) => s.url);
          setSongs(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
      }
    };
    fetchPlaylist();
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex,
      isPlaying,
      currentTime,
    }));
  }, [currentIndex, isPlaying, currentTime, songs.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    audio.src = currentSong.url;
    audio.load();

    const onTimeUpdateHandler = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      if (savedTimeRef.current !== null) {
        audio.currentTime = savedTimeRef.current;
        savedTimeRef.current = null;
      }
    };
    const onCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    };
    const onEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % songs.length);
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdateHandler);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdateHandler);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentIndex, songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying && currentSong) {
      audio.play().catch(() => {});
    }
  }, [currentIndex, isPlaying, currentSong]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentSong]);

  const handlePrev = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
    setCurrentTime(0);
    savedTimeRef.current = null;
  }, [songs.length]);

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
    setCurrentTime(0);
    savedTimeRef.current = null;
  }, [songs.length]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="cmp-controls">
          <button className="cmp-btn" onClick={handlePrev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button className="cmp-btn cmp-play" onClick={togglePlay}>
            {isPlaying ? (
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
