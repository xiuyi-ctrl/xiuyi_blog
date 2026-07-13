import { useEffect, useRef } from 'react';
import api from '../api';

export default function Music() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerReady = useRef(false);

  useEffect(() => {
    if (playerReady.current || !containerRef.current) return;
    let destroyed = false;

    const tryInit = (audioList: any[]) => {
      const AP = (window as any).APlayer;
      if (!AP || !containerRef.current || playerReady.current || destroyed) return false;

      playerReady.current = true;

      new AP({
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
      return true;
    };

    const fetchAndPlay = async () => {
      try {
        const { data } = await api.get('/music/playlist/13521757209');
        if (data.success && data.songs.length > 0) {
          const audioList = data.songs.map((s: any) => ({
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
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">音乐</h1>
      <p className="page-subtitle">Listen to Music</p>
      <div className="music-page-player" ref={containerRef} />
    </div>
  );
}
