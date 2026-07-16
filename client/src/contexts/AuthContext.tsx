import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithGitHub: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser = params.get('user');

    if (urlToken && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        setToken(urlToken);
        setUser(parsedUser);
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse user from URL:', e);
      }
    } else {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGitHub, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
