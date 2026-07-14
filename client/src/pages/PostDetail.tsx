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

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
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

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="container"><p style={{ textAlign: 'center', opacity: 0.5, color: '#fff' }}>加载中...</p></div>;
  if (error) return <div className="container"><p className="error" style={{ color: '#f87171' }}>{error}</p></div>;
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

          {user && user.id === post.author_id && (
            <div className="post-actions">
              <button onClick={() => navigate(`/write?id=${post.id}`)}>编辑</button>
              <button onClick={handleDelete} className="danger">删除</button>
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
