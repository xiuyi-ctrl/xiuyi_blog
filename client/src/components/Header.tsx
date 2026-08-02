import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import BackgroundSettings from './BackgroundSettings';
import pictureDarkIcon from '../assets/pictures/icons/picture_white.svg';
import pictureLightIcon from '../assets/pictures/icons/picture.svg';
import settingDarkIcon from '../assets/pictures/icons/setting_white.svg';
import settingLightIcon from '../assets/pictures/icons/setting.svg';
import userDarkIcon from '../assets/pictures/icons/user_white.svg';
import userLightIcon from '../assets/pictures/icons/user.svg';

const getNavItems = (pictureIcon: string, userIcon: string) => [
  { path: '/', label: '首页', icon: '⌂' },
  { path: '/posts', label: '文章', icon: '✎' },
  { path: '/projects', label: '项目', icon: '◈' },
  { path: '/photos', label: '照片墙', icon: pictureIcon, isImg: true },
  { path: '/archive', label: '归档', icon: '⊞' },
  { path: '/music', label: '音乐', icon: '♪' },
  { path: '/guestbook', label: '留言', icon: '✉' },
  { path: '/about', label: '关于', icon: userIcon, isImg: true },
];

const LIGHT_BG = '/pictures/backgrounds/xiaoAi05.jpg';
const DEFAULT_DARK_BG = 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/secondPage.png';

function getStoredBg(theme: 'dark' | 'light'): string {
  if (theme === 'light') {
    return localStorage.getItem('bgImage-light') || LIGHT_BG;
  }
  return localStorage.getItem('bgImage-dark') || localStorage.getItem('bgImage') || DEFAULT_DARK_BG;
}

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [bgImage, setBgImage] = useState(() => getStoredBg(theme));
  const [bgBlur, setBgBlur] = useState(() => 
    Number(localStorage.getItem('bgBlur')) || 20
  );
  const navItems = getNavItems(
    theme === 'light' ? pictureLightIcon : pictureDarkIcon,
    theme === 'light' ? userLightIcon : userDarkIcon
  );

  const prevThemeRef = useRef(theme);
  const bgImageRef = useRef(bgImage);
  bgImageRef.current = bgImage;

  useEffect(() => {
    if (prevThemeRef.current === theme) return;
    const prevBg = bgImageRef.current;
    localStorage.setItem(prevThemeRef.current === 'light' ? 'bgImage-light' : 'bgImage-dark', prevBg);
    setBgImage(getStoredBg(theme));
    prevThemeRef.current = theme;
  }, [theme]);

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
    const updateIndicator = () => {
      const activeIndex = navItems.findIndex(item => {
        if (item.path === '/') {
          return location.pathname === '/';
        }
        if (item.path === '/posts') {
          return location.pathname.startsWith('/posts') || location.pathname.startsWith('/post/');
        }
        return location.pathname.startsWith(item.path);
      });
      const link = linkRefs.current[activeIndex];
      const indicator = indicatorRef.current;
      const nav = navRef.current;

      if (link && indicator && nav) {
        const navRect = nav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicator.style.width = `${linkRect.width}px`;
        indicator.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
      }
    };

    updateIndicator();

    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateIndicator);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

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
                className={
                  item.path === '/'
                    ? location.pathname === '/' ? 'active' : ''
                    : item.path === '/posts'
                      ? (location.pathname.startsWith('/posts') || location.pathname.startsWith('/post/')) ? 'active' : ''
                      : location.pathname.startsWith(item.path) ? 'active' : ''
                }
              >
                <span className="nav-icon">
                  {item.isImg ? <img src={item.icon} alt={item.label} className="nav-icon-img" /> : item.icon}
                </span>
                {item.label}
              </Link>
            ))}
            
            <button 
              className="settings-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? '切换到白天模式' : '切换到夜间模式'}
              aria-label={theme === 'dark' ? '切换到白天模式' : '切换到夜间模式'}
            >
              <span className="nav-icon">{theme === 'dark' ? '☀' : '☾'}</span>
            </button>

            <button 
              className="settings-btn"
              onClick={() => setShowBgSettings(true)}
              title="背景设置"
            >
              <span className="nav-icon"><img src={theme === 'light' ? settingLightIcon : settingDarkIcon} alt="设置" className="nav-icon-img" /></span>
            </button>
            
            {user ? null : null}
          </nav>
        </div>
      </header>

      <BackgroundSettings
        isOpen={showBgSettings}
        onClose={() => setShowBgSettings(false)}
        currentBg={bgImage}
        blur={bgBlur}
        onBgChange={(url) => {
          setBgImage(url);
          localStorage.setItem(theme === 'light' ? 'bgImage-light' : 'bgImage-dark', url);
        }}
        onBlurChange={setBgBlur}
      />
    </>
  );
}
