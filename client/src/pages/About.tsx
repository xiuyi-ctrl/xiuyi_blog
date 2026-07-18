import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import { onStatsChanged } from '../lib/statsEvents';

interface Stats {
  posts: number;
  projects: number;
  views: number;
  photos: number;
  messages: number;
}

const DURATION = 800;

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number>(0);
  const from = useRef(0);
  const current = useRef(0);

  const animate = useCallback((ts: number) => {
    if (!start.current) start.current = ts;
    const elapsed = ts - start.current;
    const progress = Math.min(elapsed / DURATION, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = Math.round(from.current + (target - from.current) * eased);
    current.current = next;
    setValue(next);
    if (progress < 1) {
      raf.current = requestAnimationFrame(animate);
    }
  }, [target]);

  useEffect(() => {
    if (target === 0) { current.current = 0; setValue(0); return; }
    from.current = current.current;
    start.current = 0;
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return value;
}

export default function About() {
  const [stats, setStats] = useState<Stats>({ posts: 0, projects: 0, views: 0, photos: 0, messages: 0 });
  const [toast, setToast] = useState<string | null>(null);

  const animPosts = useCountUp(stats.posts);
  const animProjects = useCountUp(stats.projects);
  const animPhotos = useCountUp(stats.photos);
  const animMessages = useCountUp(stats.messages);
  const animViews = useCountUp(stats.views);

  useEffect(() => {
    let alive = true;
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/blog-stats');
        if (alive && data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
    return onStatsChanged(fetchStats);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(`${label}已复制到剪贴板`);
    });
  };

  return (
    <div className="about-container">
      <div className="about-profile-card">
        <div className="about-profile-top">
          <div className="about-avatar">
            <img src="https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/yileina.png" alt="avatar" />
          </div>
          <div className="about-profile-info">
            <h1 className="about-name">Xiuyi</h1>
            <p className="about-bio">
                一名软件工程在读研究生，拥有丰富的编程经验，热衷学习新技术。
            </p>
          </div>
        </div>

        <div className="about-contact-grid">
          <button className="about-contact-item" onClick={() => window.open('https://github.com/xiuyi-ctrl', '_blank')}>
            <span className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </span>
            <span className="contact-label">GitHub</span>
            <span className="contact-value">xiuyi-ctrl</span>
          </button>

          <button className="about-contact-item" onClick={() => copyToClipboard('2998526825@qq.com', '邮箱')}>
            <span className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 4L12 13L2 4"/>
              </svg>
            </span>
            <span className="contact-label">Email</span>
            <span className="contact-value">2998526825@qq.com</span>
          </button>

          <button className="about-contact-item" onClick={() => copyToClipboard('2998526825', 'QQ')}>
            <span className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span className="contact-label">QQ</span>
            <span className="contact-value">2998526825</span>
          </button>

          <button className="about-contact-item" onClick={() => copyToClipboard('fly29985', '微信')}>
            <span className="contact-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </span>
            <span className="contact-label">WeChat</span>
            <span className="contact-value">fly29985</span>
          </button>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-card about-skills-card">
          <h2 className="about-card-title">🛠 技能栈</h2>
          <div className="skills-group">
            <h3 className="skills-category">熟练</h3>
            <div className="skills-tags">
              {['Python', 'Vue', 'MySQL'].map(t => (
                <span key={t} className="skill-tag tag-master">{t}</span>
              ))}
            </div>
          </div>
          <div className="skills-group">
            <h3 className="skills-category">掌握</h3>
            <div className="skills-tags">
              {['Java', 'SpringBoot', 'LangChain', 'Git', 'Vibe Coding'].map(t => (
                <span key={t} className="skill-tag tag-skill">{t}</span>
              ))}
            </div>
          </div>
          <div className="skills-group">
            <h3 className="skills-category">了解</h3>
            <div className="skills-tags">
              {['React', 'TypeScript', 'LangGraph', 'AI'].map(t => (
                <span key={t} className="skill-tag tag-learn">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="about-card about-stats-card">
          <h2 className="about-card-title">📊 博客数据</h2>
          <div className="about-stats-grid">
            <div className="about-stat-item">
              <span className="about-stat-number">{animPosts}</span>
              <span className="about-stat-label">篇文章</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-number">{animProjects}</span>
              <span className="about-stat-label">个项目</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-number">{animPhotos}</span>
              <span className="about-stat-label">张照片</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-number">{animMessages}</span>
              <span className="about-stat-label">条留言</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-number">{animViews}</span>
              <span className="about-stat-label">次浏览</span>
            </div>
          </div>
        </div>
      </div>

      <div className="about-card about-blog-card">
        <h2 className="about-card-title">✨ 关于博客</h2>
        <div className="about-blog-content">
          <div className="about-blog-item">
            <span className="blog-item-label">博客名称</span>
            <span className="blog-item-value">Xiuyiの夜航独白</span>
          </div>
          <div className="about-blog-item">
            <span className="blog-item-label">技术栈</span>
            <span className="blog-item-value">React + Express + MySQL</span>
          </div>
          <div className="about-blog-features">
            <span className="blog-item-label">功能特性</span>
            <div className="features-list">
              <span className="feature-tag">GitHub OAuth 登录</span>
              <span className="feature-tag">多级留言回复</span>
              <span className="feature-tag">音乐播放器</span>
              <span className="feature-tag">照片墙 3D 展示</span>
              <span className="feature-tag">暗色模式</span>
              <span className="feature-tag">响应式设计</span>
              <span className="feature-tag">Markdown 文章</span>
              <span className="feature-tag">归档时间轴</span>
            </div>
          </div>
          <div className="about-blog-item">
            <span className="blog-item-label">开源地址</span>
            <a
              className="about-blog-link"
              href="https://github.com/xiuyi-ctrl/xiuyi_blog"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/xiuyi-ctrl/xiuyi_blog
            </a>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
