import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Album {
  id: number;
  title: string;
  description: string;
  cover: string;
}

const AUTO_PLAY_INTERVAL = 4000;

export default function PhotoShowcase() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
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

  useEffect(() => {
    if (isHovered || albums.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % albums.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isHovered, albums.length]);

  if (albums.length === 0) return null;

  return (
    <div className="photo-showcase-wrapper">
      <div className="photo-showcase-header">
        <span className="photo-showcase-label">PHOTO COLLECTION</span>
      </div>
      <div className="photo-showcase">
        <div
          className="photo-showcase-panels"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
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
    </div>
  );
}
