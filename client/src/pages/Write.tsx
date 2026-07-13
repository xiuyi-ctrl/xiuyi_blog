import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        const { data } = await api.get('/posts', { params: { pageSize: 100 } });
        const uniqueCategories = new Map<number, Category>();
        data.posts.forEach((post: any) => {
          if (post.category_id && post.category_name && !uniqueCategories.has(post.category_id)) {
            uniqueCategories.set(post.category_id, {
              id: post.category_id,
              name: post.category_name
            });
          }
        });
        setCategories(Array.from(uniqueCategories.values()));
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
      <h1 className="page-title">{editId ? '编辑文章' : '写文章'}</h1>
      <p className="page-subtitle">记录你的想法</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="文章标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="write-title"
        />

        <div className="write-meta">
          <input
            type="text"
            placeholder="封面图 URL"
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
            placeholder="标签（逗号分隔）"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="markdown-editor">
          <div className="editor-pane">
            <div className="pane-header">编辑</div>
            <textarea
              placeholder="输入文章内容（支持 Markdown 语法）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="preview-pane">
            <div className="pane-header">预览</div>
            <div className="preview-content">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="placeholder">在左侧输入内容，这里会实时预览...</p>
              )}
            </div>
          </div>
        </div>

        <div className="write-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '提交中...' : editId ? '更新文章' : '发布文章'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
