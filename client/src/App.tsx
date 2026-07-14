import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Projects from './pages/Projects';
import Write from './pages/Write';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Music from './pages/Music';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/music" element={<Music />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
