import { useEffect, useRef } from 'react';

export default function Music() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('meting-js')) {
      const meting = document.createElement('meting-js');
      meting.setAttribute('server', 'netease');
      meting.setAttribute('type', 'playlist');
      meting.setAttribute('id', '13521757209');
      meting.setAttribute('mutex', 'true');
      meting.setAttribute('preload', 'auto');
      meting.setAttribute('theme', '#D4A76A');
      meting.setAttribute('loop', 'all');
      containerRef.current.appendChild(meting);
    }
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">音乐</h1>
      <p className="page-subtitle">Listen to Music</p>
      <div className="music-page-player" ref={containerRef} />
    </div>
  );
}
