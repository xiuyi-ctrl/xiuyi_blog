import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Projects from './pages/Projects';
import Write from './pages/Write';
import Profile from './pages/Profile';
import Music from './pages/Music';
import { AlbumList, AlbumDetail } from './pages/Photos';
import Archive from './pages/Archive';
import Guestbook from './pages/Guestbook';
import About from './pages/About';
import api from './api';
import './App.css';

function App() {
  useEffect(() => {
    if (!sessionStorage.getItem('site_visited')) {
      api.post('/site-stats/visit').then(() => {
        sessionStorage.setItem('site_visited', '1');
      }).catch(() => {});
    }
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/music" element={<Music />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/photos" element={<AlbumList />} />
            <Route path="/photos/:id" element={<AlbumDetail />} />
            <Route path="/guestbook" element={<Guestbook />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </PageTransition>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
