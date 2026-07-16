import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackgroundSettings from './BackgroundSettings';
import pictureIcon from '../assets/pictures/icons/picture.svg';
import settingIcon from '../assets/pictures/icons/setting.svg';
import userIcon from '../assets/pictures/icons/user.svg';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [bgImage, setBgImage] = useState(() => 
    localStorage.getItem('bgImage') || 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/1.jpg'
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
          <Link to="/" className="logo">Xiuyi<span style={{ color: '#6366f1' }}>の</span>夜航独白</Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <span className="nav-icon">⌂</span>
              首页
            </Link>
            <Link to="/posts" className={location.pathname === '/posts' ? 'active' : ''}>
              <span className="nav-icon">✎</span>
              文章
            </Link>
            <Link to="/projects" className={location.pathname === '/projects' ? 'active' : ''}>
              <span className="nav-icon">◈</span>
              项目
            </Link>
            <Link to="/archive" className={location.pathname === '/archive' ? 'active' : ''}>
              <span className="nav-icon">⊞</span>
              归档
            </Link>
            <Link to="/photos" className={location.pathname.startsWith('/photos') ? 'active' : ''}>
              <span className="nav-icon"><img src={pictureIcon} alt="照片墙" className="nav-icon-img" /></span>
              照片墙
            </Link>
            <Link to="/music" className={location.pathname === '/music' ? 'active' : ''}>
              <span className="nav-icon">♪</span>
              音乐
            </Link>
            <Link to="/guestbook" className={location.pathname === '/guestbook' ? 'active' : ''}>
              <span className="nav-icon">✉</span>
              留言
            </Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
              <span className="nav-icon"><img src={userIcon} alt="关于" className="nav-icon-img" /></span>
              关于
            </Link>
            
            <button 
              className="settings-btn"
              onClick={() => setShowBgSettings(true)}
              title="背景设置"
            >
              <span className="nav-icon"><img src={settingIcon} alt="设置" className="nav-icon-img" /></span>
            </button>
            
            {user ? (
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>退出</a>
            ) : null}
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
