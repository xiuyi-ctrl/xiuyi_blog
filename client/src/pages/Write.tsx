import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

interface Category {
  id: number;
  name: string;
}

export default function Write() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [cover, setCover] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/posts', { params: { pageSize: 1 } });
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();

    if (editId) {
      const fetchPost = async () => {
        try {
          const { data } = await api.get(`/posts/${editId}`);
          const p = data.post;
          setTitle(p.title);
          setContent(p.content);
          setCategory(p.category_id || '');
          setTags(p.tags?.join(', ') || '');
          setCover(p.cover || '');
        } catch {
          setError('文章不存在');
        }
      };
      fetchPost();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        content,
        category: category ? Number(category) : null,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        cover: cover || null
      };

      if (editId) {
        await api.put(`/posts/${editId}`, payload);
      } else {
        await api.post('/posts', payload);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>{editId ? '编辑文章' : '写文章'}</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="write-form">
        <input
          type="text"
          placeholder="文章标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="封面图 URL（可选）"
          value={cover}
          onChange={(e) => setCover(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">选择分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="标签（逗号分隔，如：React, TypeScript）"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <textarea
          placeholder="文章内容（支持 Markdown）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
        />

        <button type="submit" disabled={loading}>
          {loading ? '提交中...' : '发布文章'}
        </button>
      </form>
    </div>
  );
}
