import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

interface Project {
  id: number;
  title: string;
  description: string;
  skill_using: string[];
  github_url: string;
  status: 'active' | 'experimental' | 'archived';
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const fetchProjects = async (search = '') => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.keyword = search;
      const { data } = await api.get('/projects', { params });
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((searchKeyword: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchProjects(searchKeyword);
    }, 300);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedSearch(value);
  };

  const projectIcons: Record<string, JSX.Element> = {
    default: (
      <svg className="project-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  };

  const statusConfig = {
    active: { label: '活跃', className: 'status-active' },
    experimental: { label: '实验', className: 'status-experimental' },
    archived: { label: '归档', className: 'status-archived' },
  };

  return (
    <div className="container">
      <div className="posts-header">
        <h1 className="page-title">拾光留白</h1>
        <div className="page-divider">
          <span className="divider-dot" />
          <span className="divider-line" />
          <span className="divider-dot" />
        </div>
        <p className="page-subtitle">探索与创造</p>
        
        <form onSubmit={(e) => e.preventDefault()} className="home-search">
          <svg className="home-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="搜索项目..."
            value={keyword}
            onChange={handleSearchInput}
          />
        </form>
      </div>

      {loading ? (
        <div className="posts-empty">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>加载中</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="posts-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
          </div>
          <p>未找到相关项目</p>
          <span className="empty-hint">换个关键词试试</span>
          {keyword && (
            <button className="empty-action" onClick={() => { setKeyword(''); fetchProjects(''); }}>
              查看全部项目
            </button>
          )}
        </div>
      ) : (
        <div className="project-list">
          {projects.map((project, index) => {
            const status = statusConfig[project.status] || statusConfig.active;
            return (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                key={project.id}
                className="project-card"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="project-header">
                  <span className="project-icon-wrap">
                    {projectIcons.default}
                  </span>
                  <h2 className="project-title">{project.title}</h2>
                  <span className={`project-status ${status.className}`}>
                    {status.label}
                  </span>
                  <svg className="project-github-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.skill_using.map((skill, i) => (
                    <span key={i} className="project-tag">{skill}</span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
