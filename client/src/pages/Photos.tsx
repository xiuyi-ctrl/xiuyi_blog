import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function AlbumList() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const albumItems: GalleryItem[] = albums.map(a => ({ image: a.cover, text: a.title }));

  const handleItemClick = (item: GalleryItem) => {
    const album = albums.find(a => a.title === item.text && a.cover === item.image);
    if (album) navigate(`/photos/${album.id}`);
  };

  return (
    <div className="photos-page">
      <div className="photos-header">
        <h1 className="photos-title">光影留痕</h1>
        <p className="photos-subtitle">用镜头记录生活的每一帧美好</p>
      </div>

      <div className="photos-gallery-wrapper">
        {loading ? (
          <div className="photos-loading">
            <div className="loading-dots"><span></span><span></span><span></span></div>
          </div>
        ) : albumItems.length > 0 ? (
          <CircularGallery
            items={albumItems}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            font="bold 30px Figtree"
            fontUrl="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap"
            scrollSpeed={2}
            scrollEase={0.05}
            onItemClick={handleItemClick}
          />
        ) : (
          <div className="photos-empty"><p>暂无照片集</p></div>
        )}
      </div>

      <div className="photos-hint">
        <span>← 拖动或滚轮浏览，点击进入相册 →</span>
      </div>
    </div>
  );
}

function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await api.get('/photos');
        const found = res.data.data.find((a: Album) => a.id === Number(id));
        setAlbum(found || null);
      } catch (err) {
        console.error('加载相册失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  const getGalleryItems = (a: Album): GalleryItem[] => {
    const imageUrls = a.image_url || {};
    return Object.entries(imageUrls).map(([name, url]) => ({ image: url, text: name }));
  };

  const closeLightbox = () => setLightbox(null);

  const navigateLightbox = (dir: number) => {
    if (!lightbox) return;
    const next = (lightbox.index + dir + lightbox.items.length) % lightbox.items.length;
    setLightbox({ ...lightbox, index: next });
  };

  const handleLightboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  };

  if (loading) {
    return (
      <div className="photos-page">
        <div className="photos-loading">
          <div className="loading-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="photos-page">
        <div className="photos-header">
          <button className="photos-back" onClick={() => navigate('/photos')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <h1 className="photos-title">相册不存在</h1>
        </div>
      </div>
    );
  }

  const items = getGalleryItems(album);

  return (
    <div className="photos-page">
      <div className="photos-header">
        <button className="photos-back" onClick={() => navigate('/photos')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <h1 className="photos-title">{album.title}</h1>
        <p className="photos-subtitle">{album.description}</p>
      </div>

      {items.length > 0 ? (
        <div className="photos-grid">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="photos-grid-item"
              onClick={() => setLightbox({ items, index: idx })}
            >
              <img src={item.image} alt={item.text} />
              <span className="photos-grid-label">{item.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="photos-empty"><p>该相册暂无照片</p></div>
      )}

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

export { AlbumList, AlbumDetail };
