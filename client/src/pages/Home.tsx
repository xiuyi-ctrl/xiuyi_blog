import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MusicPlayer from '../components/MusicPlayer';
import CurrentLyric from '../components/CurrentLyric';
import Toast from '../components/Toast';

interface Stats {
  posts: number;
  projects: number;
  views: number;
  photos: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ posts: 0, projects: 0, views: 0, photos: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, projectsRes, photosRes] = await Promise.all([
          api.get('/posts', { params: { pageSize: 1 } }),
          api.get('/projects'),
          api.get('/photos/count')
        ]);
        setStats({
          posts: postsRes.data.pagination.total,
          projects: projectsRes.data.projects?.length || 0,
          views: postsRes.data.posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
          photos: photosRes.data.data?.total || 0
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
        <div
          className="home-profile-card"
          onClick={() => navigate('/about')}
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          <div className="profile-top">
            <div className="profile-avatar">
              <img src="https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/yileina.png" alt="avatar" className="avatar-img" />
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
              <span className="stat-number stat-color-2">{stats.projects}</span>
              <span className="stat-label">项目</span>
            </div>
            <div className="stat-item">
              <span className="stat-number stat-color-3">{stats.photos}</span>
              <span className="stat-label">照片</span>
            </div>

            <div className="profile-socials">
              <a href="https://github.com/xiuyi-ctrl" target="_blank" rel="noopener" className="social-icon" title="GitHub" onClick={(e) => e.stopPropagation()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <button
                className="social-icon"
                title="Email"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText('2998526825@qq.com').then(() => {
                    setToast('邮箱已复制到剪贴板');
                  });
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </button>
              <button
                className="social-icon"
                title="QQ"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText('2998526825').then(() => {
                    setToast('QQ已复制到剪贴板');
                  });
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .687 4.078.43 6.29.43 2.239 0 6.29.256 6.29-.43 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
                </svg>
              </button>
              <button
                className="social-icon"
                title="WeChat"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText('fly29985').then(() => {
                    setToast('微信已复制到剪贴板');
                  });
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.133 0 .24-.108.24-.243 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.909c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="home-right-column">
          <div
            className="home-music-card"
            onClick={() => navigate('/music')}
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
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

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
