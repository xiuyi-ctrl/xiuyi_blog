import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import CircularGallery from '../components/CircularGallery';

interface Album {
  id: number;
  title: string;
  description: string;
  cover: string;
  image_url: Record<string, string>;
  created_at: string;
}

interface GalleryItem {
  image: string;
  text: string;
}

export default function Photos() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get('/photos');
        setAlbums(res.data.data);
      } catch (err) {
        console.error('加载照片集失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const getGalleryItems = (album: Album): GalleryItem[] => {
    const imageUrls = album.image_url || {};
    return Object.entries(imageUrls).map(([name, url]) => ({ image: url, text: name }));
  };

  const handleItemClick = useCallback((item: GalleryItem) => {
    if (!selectedAlbum) return;
    const items = getGalleryItems(selectedAlbum);
    const idx = items.findIndex(i => i.image === item.image && i.text === item.text);
    setLightbox({ items, index: idx >= 0 ? idx : 0 });
  }, [selectedAlbum]);

  const closeLightbox = () => setLightbox(null);

  const navigateLightbox = (dir: number) => {
    if (!lightbox) return;
    const next = (lightbox.index + dir + lightbox.items.length) % lightbox.items.length;
    setLightbox({ ...lightbox, index: next });
  };

  const handleLightboxKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }, [lightbox]);

  if (selectedAlbum) {
    const items = getGalleryItems(selectedAlbum);
    return (
      <div className="photos-page">
        <div className="photos-header">
          <button className="photos-back" onClick={() => setSelectedAlbum(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <h1 className="photos-title">{selectedAlbum.title}</h1>
          <p className="photos-subtitle">{selectedAlbum.description}</p>
        </div>

        <div className="photos-gallery-wrapper">
          {items.length > 0 ? (
            <CircularGallery
              items={items}
              bend={3}
              textColor="#ffffff"
              borderRadius={0.05}
              font="bold 28px Figtree"
              fontUrl="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap"
              scrollSpeed={2}
              scrollEase={0.05}
              onItemClick={handleItemClick}
            />
          ) : (
            <div className="photos-empty"><p>该相册暂无照片</p></div>
          )}
        </div>

        <div className="photos-hint">
          <span>← 拖动或滚轮浏览，点击照片可放大 →</span>
        </div>

        {lightbox && (
          <div className="lightbox" onClick={closeLightbox} onKeyDown={handleLightboxKeyDown} tabIndex={0}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.items[lightbox.index].image} alt={lightbox.items[lightbox.index].text} />
              <div className="lightbox-caption">{lightbox.items[lightbox.index].text}</div>
              <div className="lightbox-counter">{lightbox.index + 1} / {lightbox.items.length}</div>
            </div>
            <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="photos-page">
      <div className="photos-header">
        <h1 className="photos-title">光影留痕</h1>
        <p className="photos-subtitle">用镜头记录生活的每一帧美好</p>
      </div>

      {loading ? (
        <div className="photos-loading">
          <div className="loading-dots"><span></span><span></span><span></span></div>
        </div>
      ) : albums.length > 0 ? (
        <div className="photos-album-grid">
          {albums.map(album => {
            const photoCount = Object.keys(album.image_url || {}).length;
            return (
              <div
                key={album.id}
                className="photos-album-card"
                onClick={() => setSelectedAlbum(album)}
              >
                <div className="photos-album-cover">
                  <img src={album.cover} alt={album.title} />
                  <span className="photos-album-count">{photoCount} 张</span>
                </div>
                <div className="photos-album-info">
                  <h3 className="photos-album-title">{album.title}</h3>
                  <p className="photos-album-desc">{album.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="photos-empty"><p>暂无照片集</p></div>
      )}
    </div>
  );
}
