import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const INITIAL_COUNT = 10;
const DEFAULT_COVER = 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/secondPage.png';

interface Post {
  id: number;
  title: string;
  content: string;
  cover: string;
  views: number;
  created_at: string;
  author_name: string;
  category_name: string;
  category_id: number;
  tags: string[];
}

interface Category {
  id: number;
  name: string;
  description: string;
  post_count: number;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [coverErrors, setCoverErrors] = useState<Record<number, boolean>>({});

  const fetchPosts = async (search = '', categoryId: number | null = null) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, pageSize: 1000 };
      if (search) params.keyword = search;
      if (categoryId) params.category = categoryId;
      const { data } = await api.get('/posts', { params });
      setPosts(data.posts);
      setVisibleCount(INITIAL_COUNT);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((searchKeyword: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchPosts(searchKeyword, selectedCategory);
    }, 300);
  }, [selectedCategory]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedSearch(value);
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchPosts(keyword, categoryId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .replace(/^>\s/gm, '')
      .replace(/---/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  const getExcerpt = (content: string) => {
    const lines = content.split('\n');
    const contentWithoutTitle = lines.slice(1).join('\n').trim();
    const clean = stripMarkdown(contentWithoutTitle);
    if (clean.length <= 120) return clean;
    const truncated = clean.slice(0, 120);
    const lastSentence = Math.max(
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('！'),
      truncated.lastIndexOf('？'),
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf(' '),
    );
    return lastSentence > 30 ? truncated.slice(0, lastSentence + 1) : truncated;
  };

  const handleCoverError = (postId: number) => {
    setCoverErrors(prev => ({ ...prev, [postId]: true }));
  };

  const getCoverSrc = (post: Post) => {
    if (coverErrors[post.id]) return DEFAULT_COVER;
    return post.cover || DEFAULT_COVER;
  };

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  const postListRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setVisibleCount(prev => prev + INITIAL_COUNT);
  };

  useEffect(() => {
    if (!loadingMore) return;
    let rafId: number;
    const check = () => {
      const list = postListRef.current;
      if (!list) return;
      const cards = list.querySelectorAll('.post-card');
      const last = cards[cards.length - 1] as HTMLElement;
      if (!last) return;
      const style = getComputedStyle(last);
      if (style.animationPlayState === 'running') {
        rafId = requestAnimationFrame(check);
      } else {
        setLoadingMore(false);
      }
    };
    rafId = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafId);
  }, [loadingMore, visibleCount]);

  return (
    <div className="container">
      <div className="posts-header">
        <h1 className="page-title">手记拾遗</h1>
        <div className="page-divider">
          <span className="divider-dot" />
          <span className="divider-line" />
          <span className="divider-dot" />
        </div>
        <p className="page-subtitle">思考、记录、分享</p>
        
        <form onSubmit={(e) => e.preventDefault()} className="home-search">
          <svg className="home-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="搜索文章..."
            value={keyword}
            onChange={handleSearchInput}
          />
        </form>
      </div>

      <div className="posts-filter-bar">
        <div className="category-tags">
          <button
            className={`category-tag ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            全部
            <span className="category-count">{categories.reduce((sum, c) => sum + c.post_count, 0)}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tag ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
              <span className="category-count">{cat.post_count}</span>
            </button>
          ))}
        </div>
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
      ) : posts.length === 0 ? (
        <div className="posts-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
          </div>
          <p>未找到相关文章</p>
          <span className="empty-hint">换个关键词或分类试试</span>
          <button className="empty-action" onClick={() => { setKeyword(''); setSelectedCategory(null); fetchPosts('', null); }}>
            查看全部文章
          </button>
        </div>
      ) : (
        <>
          <div className="post-list" ref={postListRef}>
            {visiblePosts.map((post, index) => {
              const isHero = index === 0 && !keyword && !selectedCategory;
              return (
                <Link
                  to={`/post/${post.id}`}
                  key={post.id}
                  className={`post-card ${isHero ? 'post-card-hero' : ''}`}
                  style={{ animationDelay: `${index * 0.12}s` }}
                  onAnimationEnd={(e) => {
                    (e.target as HTMLElement).style.animation = 'none';
                  }}
                >
                  {coverErrors[post.id] ? (
                    <div className="post-cover-placeholder" />
                  ) : (
                    <div className="post-cover-wrap">
                      <img
                        src={getCoverSrc(post)}
                        alt={post.title}
                        className="post-cover"
                        onError={() => handleCoverError(post.id)}
                      />
                    </div>
                  )}
                  <div className="post-info">
                    <div className="post-date-row">
                      <span className="post-date">{formatDate(post.created_at)}</span>
                      {post.category_name && (
                        <span className="post-category">{post.category_name}</span>
                      )}
                    </div>
                    <h2>{post.title}</h2>
                    <p className="post-excerpt">{getExcerpt(post.content)}</p>
                    <div className="post-footer">
                      {post.tags && post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.slice(0, isHero ? 3 : 2).map((tag, i) => (
                            <span key={i} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <span className="post-views">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {post.views}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <span className="load-more-dots">
                    <span /><span /><span />
                  </span>
                ) : (
                  <>加载更多<span className="load-more-hint">（{posts.length - visibleCount} 篇）</span></>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
