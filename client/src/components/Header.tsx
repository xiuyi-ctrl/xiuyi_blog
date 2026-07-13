import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <Link to="/" className="logo">Xiuyi Blog</Link>
      <nav>
        {user ? (
          <>
            <Link to="/write">写文章</Link>
            <Link to="/profile">{user.username}</Link>
            <button onClick={handleLogout}>退出</button>
          </>
        ) : (
          <>
            <Link to="/login">登录</Link>
            <Link to="/register">注册</Link>
          </>
        )}
      </nav>
    </header>
  );
}
