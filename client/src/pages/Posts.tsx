import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (page = 1, search = '', categoryId: number | null = null) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 10 };
      if (search) params.keyword = search;
      if (categoryId) params.category = categoryId;
      const { data } = await api.get('/posts', { params });
      setPosts(data.posts);
      setPagination(data.pagination);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1, keyword, selectedCategory);
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchPosts(1, keyword, categoryId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
      </div>

      <div className="posts-filter-bar">
        <div className="category-tags">
          <button
            className={`category-tag ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tag ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="搜索文章..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit">搜索</button>
        </form>
      </div>

      {loading ? (
        <div className="posts-empty">
          <span className="empty-icon">&#8943;</span>
          <p>加载中</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="posts-empty">
          <span className="empty-icon">&#9744;</span>
          <p>暂无文章</p>
          <span className="empty-hint">换个分类或关键词试试</span>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post, index) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className="post-card"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              {post.cover && (
                <div className="post-cover-wrap">
                  <img src={post.cover} alt={post.title} className="post-cover" />
                </div>
              )}
              <div className="post-info">
                <span className="post-date">{formatDate(post.created_at)}</span>
                <h2>{post.title}</h2>
                <p className="post-excerpt">{post.content.slice(0, 120)}...</p>
                <div className="post-footer">
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchPosts(pagination.page - 1, keyword, selectedCategory)}
          >
            &#8592;
          </button>
          <div className="pagination-pages">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => {
                const diff = Math.abs(p - pagination.page);
                return diff === 0 || diff === 1 || p === 1 || p === pagination.totalPages;
              })
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && typeof arr[i - 1] === 'number' && p - (arr[i - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${i}`} className="pagination-ellipsis">{p}</span>
                ) : (
                  <button
                    key={p}
                    className={`pagination-num ${p === pagination.page ? 'pagination-active' : ''}`}
                    onClick={() => fetchPosts(p, keyword, selectedCategory)}
                  >
                    {p}
                  </button>
                )
              )}
          </div>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchPosts(pagination.page + 1, keyword, selectedCategory)}
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
}
