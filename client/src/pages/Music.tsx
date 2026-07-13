import { useEffect, useRef } from 'react';

export default function Music() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerReady = useRef(false);

  useEffect(() => {
    if (playerReady.current || !containerRef.current) return;

    const tryInit = () => {
      const AP = (window as any).APlayer;
      if (!AP || !containerRef.current || playerReady.current) return false;

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
        audio: [
          { name: '如果呢', artist: '郑润泽', url: 'https://music.163.com/song/media/outer/url?id=2161245025.mp3', cover: '' },
          { name: '于是', artist: '郑润泽', url: 'https://music.163.com/song/media/outer/url?id=1974443814.mp3', cover: '' },
          { name: '随风', artist: '郑润泽', url: 'https://music.163.com/song/media/outer/url?id=2058267230.mp3', cover: '' },
        ]
      });
      return true;
    };

    if (tryInit()) return;

    const check = setInterval(() => {
      if (tryInit()) clearInterval(check);
    }, 300);

    return () => clearInterval(check);
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">音乐</h1>
      <p className="page-subtitle">Listen to Music</p>
      <div className="music-page-player" ref={containerRef} />
    </div>
  );
}
