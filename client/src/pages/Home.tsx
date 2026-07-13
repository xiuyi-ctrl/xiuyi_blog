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

export default function Home() {
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
      const { data } = await api.get('/posts', { params: { pageSize: 100 } });
      const uniqueCategories = new Map<number, Category>();
      data.posts.forEach((post: Post) => {
        if (post.category_id && post.category_name && !uniqueCategories.has(post.category_id)) {
          uniqueCategories.set(post.category_id, {
            id: post.category_id,
            name: post.category_name,
            description: ''
          });
        }
      });
      setCategories(Array.from(uniqueCategories.values()));
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
      <h1 className="page-title">Xiuyi's Blog</h1>
      <p className="page-subtitle">思考、记录、分享</p>

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

      {loading ? (
        <p style={{ textAlign: 'center', opacity: 0.5 }}>加载中...</p>
      ) : posts.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.5 }}>暂无文章</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <Link to={`/post/${post.id}`} key={post.id} className="post-card">
              {post.cover && (
                <img src={post.cover} alt={post.title} className="post-cover" />
              )}
              <div className="post-info">
                <h2>{post.title}</h2>
                <div className="post-meta">
                  <span>{formatDate(post.created_at)}</span>
                  {post.category_name && <span>{post.category_name}</span>}
                  <span>{post.views} 次阅读</span>
                </div>
                <p>{post.content.slice(0, 150)}...</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
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
            ← 上一页
          </button>
          <span>{pagination.page} / {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchPosts(pagination.page + 1, keyword, selectedCategory)}
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
}
