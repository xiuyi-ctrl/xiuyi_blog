import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Post {
  id: number;
  title: string;
  summary: string;
  cover: string;
  created_at: string;
}

const DEFAULT_COVER = '/pictures/post_pictures/1.jpg';
const AUTO_PLAY_INTERVAL = 3000;

export default function ArticleShowcase() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/posts', { params: { pageSize: 5 } });
        setPosts(data.posts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };
    fetchPosts();
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % posts.length);
    }, AUTO_PLAY_INTERVAL);
  }, [posts.length]);

  useEffect(() => {
    if (posts.length === 0 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [posts.length, isPaused, startTimer]);

  const handleMouseEnter = (index: number) => {
    setIsPaused(true);
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (posts.length === 0) return null;

  const activePost = posts[activeIndex];

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="showcase-container">
      <div className="showcase-list" onMouseLeave={handleMouseLeave}>
        {posts.map((post, i) => (
          <div
            key={post.id}
            className={`showcase-item ${i === activeIndex ? 'active' : ''}`}
            onMouseEnter={() => handleMouseEnter(i)}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <span className="showcase-scene">SCENE {String(i + 1).padStart(2, '0')}</span>
            <span className="showcase-title">{post.title}</span>
            <span className="showcase-number">{String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      <div className="showcase-card" onClick={() => navigate(`/post/${activePost.id}`)}>
        <img
          className="showcase-cover"
          src={activePost.cover || DEFAULT_COVER}
          alt={activePost.title}
        />
        <div className="showcase-overlay" />
        <div className="showcase-card-content">
          <span className="showcase-label">PERSPECTIVE</span>
          <h2 className="showcase-card-title">{activePost.title}</h2>
          <p className="showcase-card-summary">{activePost.summary || '暂无摘要'}</p>
          <span className="showcase-date">{formatDate(activePost.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
