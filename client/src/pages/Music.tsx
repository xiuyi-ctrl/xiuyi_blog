import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api';
import Lyrics from '../components/Lyrics';

export default function Music() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerReady = useRef(false);
  const [currentSongId, setCurrentSongId] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleSongChange = useCallback((songId: number, time: number) => {
    setCurrentSongId(songId);
    setCurrentTime(time);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    if (playerReady.current || !containerRef.current) return;
    let destroyed = false;

    const tryInit = (audioList: any[]) => {
      const AP = (window as any).APlayer;
      if (!AP || !containerRef.current || playerReady.current || destroyed) return false;

      playerReady.current = true;

      const player = new AP({
        container: containerRef.current,
        mini: false,
        autoplay: false,
        mutex: true,
        preload: 'auto',
        theme: '#D4A76A',
        loop: 'all',
        lrcType: 3,
        audio: audioList
      });

      player.on('loadeddata', () => {
        const audio = player.audio;
        if (audio && audioList[player.list.index]) {
          handleSongChange(audioList[player.list.index].id || 0, 0);
        }
      });

      player.on('timeupdate', () => {
        const audio = player.audio;
        if (audio) {
          handleTimeUpdate(audio.currentTime || 0);
        }
      });

      player.on('play', () => {
        const idx = player.list.index;
        if (audioList[idx]) {
          handleSongChange(audioList[idx].id || 0, player.audio?.currentTime || 0);
        }
      });

      return true;
    };

    const fetchAndPlay = async () => {
      try {
        const { data } = await api.get('/music/playlist/18146875685');
        if (data.success && data.songs.length > 0) {
          const audioList = data.songs.map((s: any) => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            url: s.url,
            cover: s.cover || '',
            lrc: s.lrc || ''
          })).filter((s: any) => s.url);

          if (audioList.length > 0) {
            tryInit(audioList);
          }
        }
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
      }
    };

    fetchAndPlay();

    return () => { destroyed = true; };
  }, [handleSongChange, handleTimeUpdate]);

  return (
    <div className="container">
      <h1 className="page-title">音乐</h1>
      <p className="page-subtitle">Listen to Music</p>
      <div className="music-page-player" ref={containerRef} />
      {currentSongId > 0 && (
        <div className="music-lyrics-section">
          <Lyrics songId={currentSongId} currentTime={currentTime} />
        </div>
      )}
    </div>
  );
}
