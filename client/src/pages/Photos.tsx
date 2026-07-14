import { useState, useEffect } from 'react';
import api from '../api';
import CircularGallery from '../components/CircularGallery';

export default function Photos() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await api.get('/photos');
        const albums = res.data.data;
        const items = [];
        albums.forEach(album => {
          const imageUrls = album.image_url || {};
          Object.entries(imageUrls).forEach(([name, url]) => {
            items.push({ image: url, text: name });
          });
        });
        setGalleryItems(items);
      } catch (err) {
        console.error('加载照片失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  return (
    <div className="photos-page">
      <div className="photos-header">
        <h1 className="photos-title">光影留痕</h1>
        <p className="photos-subtitle">用镜头记录生活的每一帧美好</p>
      </div>

      <div className="photos-gallery-wrapper">
        {loading ? (
          <div className="photos-loading">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : galleryItems.length > 0 ? (
          <CircularGallery
            items={galleryItems}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            font="bold 28px Figtree"
            fontUrl="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap"
            scrollSpeed={2}
            scrollEase={0.05}
          />
        ) : (
          <div className="photos-empty">
            <p>暂无照片</p>
          </div>
        )}
      </div>

      <div className="photos-hint">
        <span>← 拖动或滚轮浏览 →</span>
      </div>
    </div>
  );
}
