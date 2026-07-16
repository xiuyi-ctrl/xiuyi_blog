import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackgroundSettings from './BackgroundSettings';
import pictureIcon from '../assets/pictures/icons/picture.svg';
import settingIcon from '../assets/pictures/icons/setting.svg';
import userIcon from '../assets/pictures/icons/user.svg';

const navItems = [
  { path: '/', label: '首页', icon: '⌂' },
  { path: '/posts', label: '文章', icon: '✎' },
  { path: '/projects', label: '项目', icon: '◈' },
  { path: '/archive', label: '归档', icon: '⊞' },
  { path: '/photos', label: '照片墙', icon: pictureIcon, isImg: true },
  { path: '/music', label: '音乐', icon: '♪' },
  { path: '/guestbook', label: '留言', icon: '✉' },
  { path: '/about', label: '关于', icon: userIcon, isImg: true },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [bgImage, setBgImage] = useState(() => 
    localStorage.getItem('bgImage') || 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/secondPage.png'
  );
  const [bgBlur, setBgBlur] = useState(() => 
    Number(localStorage.getItem('bgBlur')) || 20
  );

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-image', bgImage ? `url(${bgImage})` : 'none');
    document.documentElement.style.setProperty('--bg-blur', `${bgBlur}px`);
    
    localStorage.setItem('bgImage', bgImage);
    localStorage.setItem('bgBlur', String(bgBlur));
  }, [bgImage, bgBlur]);

  useLayoutEffect(() => {
    const activeIndex = navItems.findIndex(item => 
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );
    const link = linkRefs.current[activeIndex];
    const indicator = indicatorRef.current;
    const nav = navRef.current;

    if (link && indicator && nav) {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      indicator.style.width = `${linkRect.width}px`;
      indicator.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
    }
  }, [location.pathname]);

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
          <nav className="nav" ref={navRef}>
            <div className="nav-indicator" ref={indicatorRef} />
            {navItems.map((item, index) => (
              <Link 
                key={item.path} 
                to={item.path}
                ref={el => { linkRefs.current[index] = el; }}
                className={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}
              >
                <span className="nav-icon">
                  {item.isImg ? <img src={item.icon} alt={item.label} className="nav-icon-img" /> : item.icon}
                </span>
                {item.label}
              </Link>
            ))}
            
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
