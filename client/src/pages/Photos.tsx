import { useState, useEffect } from 'react';
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

export default function Photos() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getGalleryItems = (album: Album) => {
    const imageUrls = album.image_url || {};
    return Object.entries(imageUrls).map(([name, url]) => ({ image: url, text: name }));
  };

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
            />
          ) : (
            <div className="photos-empty"><p>该相册暂无照片</p></div>
          )}
        </div>

        <div className="photos-hint">
          <span>← 拖动或滚轮浏览 →</span>
        </div>
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
