import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

interface Post {
  id: number;
  title: string;
  content: string;
  cover: string;
  views: number;
  created_at: string;
  updated_at: string;
  author_id: number;
  author_name: string;
  category_name: string;
  tags: string[];
}

const fetchTimestamps: Record<string, number> = {};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const lastTime = fetchTimestamps[id || ''] || 0;
    if (now - lastTime < 1500) {
      setLoading(false);
      return;
    }
    fetchTimestamps[id || ''] = now;

    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        setPost(data.post);
      } catch (err: any) {
        setError(err.response?.data?.message || '文章不存在');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('.post-content');
      if (!article) return;
      
      const articleTop = article.getBoundingClientRect().top;
      const articleHeight = article.scrollHeight;
      const windowHeight = window.innerHeight;
      
      if (articleTop < 0) {
        const progress = Math.min(100, Math.abs(articleTop) / (articleHeight - windowHeight) * 100);
        setReadingProgress(progress);
      } else {
        setReadingProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton-loading">
          <div className="skeleton-back"></div>
          <div className="skeleton-article">
            <div className="skeleton-cover"></div>
            <div className="skeleton-title"></div>
            <div className="skeleton-meta">
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
            </div>
            <div className="skeleton-tags">
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
            </div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line medium"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="container"><p className="post-error">{error}</p></div>;
  if (!post) return null;

  return (
    <>
      <div className="reading-progress" style={{ width: `${readingProgress}%` }} />
      
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>

        <article className="post-detail">
          {post.cover && (
            <img src={post.cover} alt={post.title} className="post-detail-cover" />
          )}

          <h1>{post.title}</h1>

          <div className="post-meta">
            <span>{post.author_name}</span>
            <span>{formatDate(post.created_at)}</span>
            {post.category_name && <span>{post.category_name}</span>}
            <span>{post.views} 次阅读</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="post-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          <div className="post-footer">
            最后更新于 {formatDate(post.updated_at)}
          </div>
        </article>
      </div>
    </>
  );
}
