import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  cover: string;
  views: number;
  created_at: string;
  author_name: string;
  category_name: string;
  type: 'post';
}

interface Project {
  id: number;
  title: string;
  description: string;
  cover: string;
  created_at: string;
  type: 'project';
}

interface Photo {
  id: number;
  title: string;
  cover: string;
  imageCount: number;
  created_at: string;
  type: 'photo';
}

type ArchiveItem = Post | Project | Photo;

interface TimelineGroup {
  key: string;
  year: number;
  month: number;
  items: ArchiveItem[];
}

interface TagItem {
  name: string;
  count: number;
}

export default function Archive() {
  const navigate = useNavigate();
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [tagCloud, setTagCloud] = useState<TagItem[]>([]);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'timeline' | 'horizontal' | 'list'>('timeline');
  const [loading, setLoading] = useState(true);

  const allItems: ArchiveItem[] = timeline.flatMap(g => g.items).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  useEffect(() => {
    axios.get('/api/archive').then(res => {
      if (res.data.success) {
        setTopPosts(res.data.topPosts);
        setTimeline(res.data.timeline);
        setTagCloud(res.data.tagCloud);
        if (res.data.timeline.length > 0) {
          setOpenMonths(new Set([res.data.timeline[0].key]));
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const typeIcon = (t: string) => {
    if (t === 'post') return '📝';
    if (t === 'project') return '🔧';
    return '📷';
  };

  const typeLabel = (t: string) => {
    if (t === 'post') return '文章';
    if (t === 'project') return '项目';
    return '照片';
  };

  const handleItemClick = (item: ArchiveItem) => {
    if (item.type === 'post') navigate(`/post/${item.id}`);
    else if (item.type === 'project') navigate('/projects');
    else navigate(`/photos/${item.id}`);
  };

  const handleTagClick = (name: string) => {
    navigate(`/posts?keyword=${encodeURIComponent(name)}`);
  };

  if (loading) {
    return (
      <div className="archive-loading">
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="archive-page">
      <div className="archive-header">
        <h1 className="archive-title">归档</h1>
        <p className="archive-subtitle">记录成长的每一步</p>
      </div>

      <section className="archive-featured">
        <h2 className="archive-section-title">精华推荐</h2>
        <div className="archive-featured-grid">
          {topPosts.map((post, i) => (
            <div
              key={post.id}
              className={`archive-featured-card ${i === 0 ? 'featured-main' : ''}`}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <div className="featured-cover">
                <img src={post.cover || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600'} alt={post.title} />
                <div className="featured-overlay">
                  <span className="featured-views">👁 {post.views} 阅读</span>
                </div>
              </div>
              <div className="featured-info">
                <h3 className="featured-title">{post.title}</h3>
                <div className="featured-meta">
                  <span className="featured-date">{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                  {post.category_name && <span className="featured-category">{post.category_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="archive-timeline-section">
        <div className="archive-timeline-header">
          <h2 className="archive-section-title">归档记录</h2>
          <div className="archive-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <span className="toggle-icon">◉</span> 时间轴
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'horizontal' ? 'active' : ''}`}
              onClick={() => setViewMode('horizontal')}
            >
              <span className="toggle-icon">↔</span> 横向
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span className="toggle-icon">☰</span> 列表
            </button>
          </div>
        </div>

        {viewMode === 'timeline' && (
          <div className="archive-timeline-cards">
            {timeline.map(group => (
              <div key={group.key} className="timeline-year-group">
                <div className="timeline-year-badge">{group.key}</div>
                <div className="timeline-cards-row">
                  {group.items.map((item, i) => {
                    const cover = item.type === 'post' ? (item as Post).cover :
                                  item.type === 'photo' ? (item as Photo).cover : null;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className={`timeline-card ${i % 2 === 0 ? 'left' : 'right'}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="timeline-card-dot" />
                        <div className="timeline-card-content">
                          {cover && (
                            <div className="timeline-card-cover">
                              <img src={cover} alt={item.title} />
                            </div>
                          )}
                          <div className="timeline-card-body">
                            <span className="timeline-card-icon">{typeIcon(item.type)}</span>
                            <h4 className="timeline-card-title">{item.title}</h4>
                            {item.type === 'post' && (item as Post).category_name && (
                              <span className="timeline-card-category">{(item as Post).category_name}</span>
                            )}
                            {item.type === 'project' && (item as Project).description && (
                              <p className="timeline-card-desc">{(item as Project).description}</p>
                            )}
                            {item.type === 'photo' && (
                              <span className="timeline-card-count">{(item as Photo).imageCount} 张照片</span>
                            )}
                            <div className="timeline-card-meta">
                              <span className="timeline-card-type">{typeLabel(item.type)}</span>
                              <span className="timeline-card-date">{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'horizontal' && (
          <div className="archive-horizontal">
            <div className="h-timeline-track">
              <div className="h-timeline-line" />
              {allItems.map((item, i) => {
                const d = new Date(item.created_at);
                const dateStr = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                const isTop = i % 2 === 0;
                const cover = item.type === 'post' ? (item as Post).cover :
                              item.type === 'photo' ? (item as Photo).cover : null;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`h-timeline-node ${isTop ? 'top' : 'bottom'}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {isTop && (
                      <div className={`h-timeline-card ${item.type}`}>
                        {cover && (
                          <div className="h-timeline-cover">
                            <img src={cover} alt={item.title} />
                          </div>
                        )}
                        <div className="h-timeline-body">
                          <h4 className="h-timeline-title">
                            <span className="h-timeline-icon">{typeIcon(item.type)}</span>
                            {item.title}
                          </h4>
                          {item.type === 'project' && (item as Project).description && (
                            <p className="h-timeline-desc">{(item as Project).description}</p>
                          )}
                          {item.type === 'photo' && (
                            <span className="h-timeline-count">{(item as Photo).imageCount} 张照片</span>
                          )}
                          <div className="h-timeline-meta">
                            {(item.type === 'post' && (item as Post).category_name) && (
                              <span className="h-timeline-category">{(item as Post).category_name}</span>
                            )}
                            {item.type === 'project' && (
                              <span className="h-timeline-category">项目</span>
                            )}
                            {item.type === 'photo' && (
                              <span className="h-timeline-category">照片</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="h-timeline-dot">
                      <span className="h-timeline-date">{dateStr}</span>
                    </div>
                    {!isTop && (
                      <div className={`h-timeline-card ${item.type}`}>
                        {cover && (
                          <div className="h-timeline-cover">
                            <img src={cover} alt={item.title} />
                          </div>
                        )}
                        <div className="h-timeline-body">
                          <h4 className="h-timeline-title">
                            <span className="h-timeline-icon">{typeIcon(item.type)}</span>
                            {item.title}
                          </h4>
                          {item.type === 'project' && (item as Project).description && (
                            <p className="h-timeline-desc">{(item as Project).description}</p>
                          )}
                          {item.type === 'photo' && (
                            <span className="h-timeline-count">{(item as Photo).imageCount} 张照片</span>
                          )}
                          <div className="h-timeline-meta">
                            {(item.type === 'post' && (item as Post).category_name) && (
                              <span className="h-timeline-category">{(item as Post).category_name}</span>
                            )}
                            {item.type === 'project' && (
                              <span className="h-timeline-category">项目</span>
                            )}
                            {item.type === 'photo' && (
                              <span className="h-timeline-category">照片</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="archive-timeline-list">
            {timeline.map(group => (
              <div key={group.key} className="archive-month-group">
                <div className="archive-month-header" onClick={() => toggleMonth(group.key)}>
                  <div className="month-dot" />
                  <h3 className="month-title">{group.key}</h3>
                  <span className="month-count">{group.items.length} 条记录</span>
                  <span className={`month-arrow ${openMonths.has(group.key) ? 'open' : ''}`}>▸</span>
                </div>
                {openMonths.has(group.key) && (
                  <div className="archive-month-items">
                    {group.items.map(item => (
                      <div key={`${item.type}-${item.id}`} className="archive-item" onClick={() => handleItemClick(item)}>
                        <span className="archive-item-icon">{typeIcon(item.type)}</span>
                        <span className="archive-item-title">{item.title}</span>
                        <span className="archive-item-type">{typeLabel(item.type)}</span>
                        <span className="archive-item-date">{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {tagCloud.length > 0 && (
        <section className="archive-tags">
          <h2 className="archive-section-title">标签云</h2>
          <div className="archive-tag-list">
            {tagCloud.map(tag => (
              <span
                key={tag.name}
                className="archive-tag"
                onClick={() => handleTagClick(tag.name)}
                style={{ fontSize: `${Math.min(1 + tag.count * 0.15, 1.8)}rem` }}
              >
                #{tag.name}
                <span className="tag-count">{tag.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
