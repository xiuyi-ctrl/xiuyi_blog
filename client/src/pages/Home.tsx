import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import MusicPlayer from '../components/MusicPlayer';
import CurrentLyric from '../components/CurrentLyric';

interface Stats {
  posts: number;
  views: number;
  photos: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ posts: 0, views: 0, photos: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/posts', { params: { pageSize: 1 } });
        setStats({
          posts: data.pagination.total,
          views: data.posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
          photos: 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/posts?keyword=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="home-container">
      <form onSubmit={handleSearch} className="home-search">
        <span className="home-search-icon">🔍</span>
        <input
          type="text"
          placeholder="输入标题、描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="home-grid">
        <div className="home-profile-card">
          <div className="profile-top">
            <div className="profile-avatar">
              <img src="/src/assets/pictures/background/yileina.png" alt="avatar" className="avatar-img" />
            </div>
            <div className="profile-info">
              <h1 className="profile-name">Xiuyi</h1>
              <p className="profile-bio">
                拥有丰富的编程经验，热衷于利用AI辅助编程，开发创意产品，解决实际问题，每个项目都是一次学习和成长的机会。
              </p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number stat-color-1">{stats.posts}</span>
              <span className="stat-label">文章</span>
            </div>
            <div className="stat-item">
              <span className="stat-number stat-color-2">26</span>
              <span className="stat-label">说说</span>
            </div>
            <div className="stat-item">
              <span className="stat-number stat-color-3">71</span>
              <span className="stat-label">照片</span>
            </div>

            <div className="profile-socials">
              <a href="https://github.com/xiuyi-ctrl" target="_blank" rel="noopener" className="social-icon" title="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="mailto:your@email.com" className="social-icon" title="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
              <a href="#" className="social-icon" title="RSS">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
                </svg>
              </a>
              <Link to="/about" className="social-icon" title="关于">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="home-right-column">
          <div className="home-music-card">
            <div className="music-header">
              <span className="music-badge">CLOUD MUSIC</span>
            </div>
            <MusicPlayer />
          </div>
        </div>
      </div>

      <div className="home-lyrics-row">
        <CurrentLyric />
      </div>
    </div>
  );
}
