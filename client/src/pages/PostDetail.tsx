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

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  if (loading) return <div className="container"><p>加载中...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!post) return null;

  return (
    <div className="container">
      <article className="post-detail">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>作者：{post.author_name}</span>
          <span>分类：{post.category_name}</span>
          <span>发布：{new Date(post.created_at).toLocaleDateString()}</span>
          <span>浏览：{post.views}</span>
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
      </article>
    </div>
  );
}
