import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackgroundSettings from './BackgroundSettings';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [bgImage, setBgImage] = useState(() => 
    localStorage.getItem('bgImage') || '/src/assets/pictures/background/bg1.jpg'
  );
  const [bgBlur, setBgBlur] = useState(() => 
    Number(localStorage.getItem('bgBlur')) || 20
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-image', bgImage ? `url(${bgImage})` : 'none');
    document.documentElement.style.setProperty('--bg-blur', `${bgBlur}px`);
    
    localStorage.setItem('bgImage', bgImage);
    localStorage.setItem('bgBlur', String(bgBlur));
  }, [bgImage, bgBlur]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div 
        className="blog-background"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          filter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none'
        }}
      />
      
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">Xiuyiの小站</Link>
          <nav className="nav">
            <Link to="/">
              <span className="nav-icon">⌂</span>
              首页
            </Link>
            <Link to="/posts">
              <span className="nav-icon">✎</span>
              文章
            </Link>
            <Link to="/projects">
              <span className="nav-icon">◈</span>
              项目
            </Link>
            <Link to="/archive">
              <span className="nav-icon">⊞</span>
              归档
            </Link>
            <Link to="/photos">
              <span className="nav-icon">◫</span>
              照片墙
            </Link>
            <Link to="/music">
              <span className="nav-icon">♪</span>
              音乐
            </Link>
            <Link to="/guestbook">
              <span className="nav-icon">✉</span>
              留言
            </Link>
            <Link to="/about">
              <span className="nav-icon">◉</span>
              关于
            </Link>
            
            <button 
              className="settings-btn"
              onClick={() => setShowBgSettings(true)}
              title="背景设置"
            >
              <span className="nav-icon">⚙</span>
            </button>
            
            {user ? (
              <>
                <Link to="/write">
                  <span className="nav-icon">✎</span>
                  写文章
                </Link>
                <Link to="/profile">{user.username}</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>退出</a>
              </>
            ) : (
              <Link to="/login">登录</Link>
            )}
          </nav>
        </div>
      </header>

      <BackgroundSettings
        isOpen={showBgSettings}
        onClose={() => setShowBgSettings(false)}
        currentBg={bgImage}
        blur={bgBlur}
        onBgChange={setBgImage}
        onBlurChange={setBgBlur}
      />
    </>
  );
}
