import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Album {
  id: number;
  title: string;
  description: string;
  cover: string;
}

export default function PhotoShowcase() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const { data } = await api.get('/photos');
        setAlbums(data.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch photos:', error);
      }
    };
    fetchAlbums();
  }, []);

  if (albums.length === 0) return null;

  return (
    <div className="photo-showcase">
      <div className="photo-showcase-header">
        <span className="photo-showcase-label">FEATURE COLLECTIONS</span>
        <span className="photo-showcase-subtitle">- 折叠卡片</span>
      </div>
      <div className="photo-showcase-panels">
        {albums.map((album, i) => (
          <div
            key={album.id}
            className={`photo-showcase-panel ${i === activeIndex ? 'active' : ''}`}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => navigate(`/photos/${album.id}`)}
          >
            <img className="panel-cover" src={album.cover} alt={album.title} />
            <div className="panel-overlay">
              <span className="panel-number">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="panel-title">{album.title}</h3>
              <p className="panel-desc">{album.description}</p>
              <span className="panel-view">VIEW ALBUM →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
