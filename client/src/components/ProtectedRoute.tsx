import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="container"><p>加载中...</p></div>;
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
