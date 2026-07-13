import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

interface Post {
  id: number;
  title: string;
  created_at: string;
  views: number;
  author_id: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const { data } = await api.get('/posts', { params: { pageSize: 100 } });
        setPosts(data.posts.filter((p: Post) => p.author_id === user?.id));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };
    if (user) fetchMyPosts();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="container">
      <div className="profile">
        <h1>个人中心</h1>
        <div className="profile-info">
          <p><strong>用户名：</strong>{user.username}</p>
          <p><strong>邮箱：</strong>{user.email}</p>
        </div>

        <h2>我的文章（{posts.length}）</h2>
        {posts.length === 0 ? (
          <p>还没有发布文章</p>
        ) : (
          <ul className="my-posts">
            {posts.map((post) => (
              <li key={post.id}>
                <span onClick={() => navigate(`/post/${post.id}`)}>{post.title}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span>{post.views} 次浏览</span>
              </li>
            ))}
          </ul>
        )}

        <button onClick={handleLogout} className="logout-btn">退出登录</button>
      </div>
    </div>
  );
}
