import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

interface Message {
  id: number;
  content: string;
  likes: number;
  liked: boolean;
  created_at: string;
  username: string;
  avatar: string | null;
  user_id: number;
  replies: Reply[];
}

interface Reply {
  id: number;
  message_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  username: string;
  avatar: string | null;
  reply_to_username: string | null;
  children?: Reply[];
}

interface HeroMessage {
  id: number;
  content: string;
  created_at: string;
  username: string;
  avatar: string | null;
}

function buildReplyTree(replies: Reply[]): Reply[] {
  const map = new Map<number, Reply>();
  const roots: Reply[] = [];

  replies.forEach(r => {
    map.set(r.id, { ...r, children: [] });
  });

  replies.forEach(r => {
    const node = map.get(r.id)!;
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function ReplyItem({
  reply,
  currentUser,
  onReply,
  collapsed
}: {
  reply: Reply;
  currentUser: { id: number; username: string; avatar: string | null } | null;
  onReply: (messageId: number, content: string, parentId: number) => Promise<boolean>;
  collapsed?: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (collapsed) {
      setShowInput(false);
      setReplyContent('');
    }
  }, [collapsed]);

  useEffect(() => {
    if (!showInput) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.reply-nested-input')) {
        setShowInput(false);
        setReplyContent('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInput]);

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;
    const success = await onReply(reply.message_id, replyContent.trim(), reply.id);
    if (success) {
      setReplyContent('');
      setShowInput(false);
    }
  };

  return (
    <div className="reply-nested">
      <div className="reply-item">
        <div className="reply-avatar">
          {reply.avatar ? (
            <img src={reply.avatar} alt={reply.username} />
          ) : (
            <span>{reply.username?.charAt(0)}</span>
          )}
        </div>
        <div className="reply-body">
          <div className="reply-meta">
            <span className="reply-username">{reply.username}</span>
            {reply.reply_to_username && (
              <span className="reply-to">
                回复 <span className="reply-to-name">@{reply.reply_to_username}</span>
              </span>
            )}
            <span className="reply-time">{formatTime(reply.created_at)}</span>
          </div>
          <p className="reply-content">{reply.content}</p>
          {currentUser && (
            <button className="reply-action-btn" onClick={() => setShowInput(!showInput)}>
              回复
            </button>
          )}
        </div>
      </div>

      {showInput && (
        <div className="reply-nested-input">
          <input
            type="text"
            placeholder={`回复 @${reply.username}...`}
            className="reply-input"
            maxLength={200}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') setShowInput(false);
            }}
            autoFocus
          />
          <button className="reply-send-btn" onClick={handleSubmit} disabled={!replyContent.trim()}>
            发送
          </button>
        </div>
      )}

      {reply.children && reply.children.length > 0 && (
        <div className="reply-children">
          {reply.children.map(child => (
            <ReplyItem key={child.id} reply={child} currentUser={currentUser} onReply={onReply} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Guestbook() {
  const navigate = useNavigate();
  const { user, loginWithGitHub, logout } = useAuth();
  const [heroMessages, setHeroMessages] = useState<HeroMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  useEffect(() => {
    fetchHeroMessages();
  }, []);

  const fetchHeroMessages = async () => {
    try {
      const { data } = await api.get('/guestbook/hero');
      setHeroMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch hero messages:', error);
    }
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/guestbook', { params: { page, pageSize: 10 } });
      setMessages(data.messages);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);



  const handlePost = async (content: string) => {
    if (!user) {
      loginWithGitHub();
      return;
    }
    try {
      const { data } = await api.post('/guestbook', { content });
      setMessages(prev => [{ ...data.data, replies: [] }, ...prev]);
      setInputValue('');
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setToast(err.response?.data?.message || '留言失败');
    }
  };

  const handleLike = async (id: number) => {
    if (!user) {
      loginWithGitHub();
      return;
    }
    try {
      const { data } = await api.post(`/guestbook/${id}/like`);
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, liked: data.liked, likes: data.likes } : m
      ));
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleReply = async (messageId: number, content: string, parentId?: number) => {
    if (!user) {
      loginWithGitHub();
      return false;
    }
    try {
      const { data } = await api.post(`/guestbook/${messageId}/reply`, {
        content,
        parent_id: parentId || null
      });
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, replies: [...m.replies, data.data] } : m
      ));
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setToast(err.response?.data?.message || '回复失败');
      return false;
    }
  };

  return (
    <div className="guestbook-container">
      <section className="guestbook-hero">
        <div className="guestbook-hero-inner">
          <h1 className="guestbook-hero-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-8px', marginRight: 10 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            留言板
          </h1>
          <p className="guestbook-hero-subtitle">留下你的足迹，分享你的想法</p>
        </div>
        <div className="guestbook-hero-grid">
          {heroMessages.map((msg, idx) => (
            <div
              key={msg.id}
              className="hero-card"
              style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * (1 + (idx * 1.3) % 3)}deg)` }}
            >
              <div className="hero-card-header">
                <div className="hero-card-avatar">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt={msg.username} />
                  ) : (
                    <span>{msg.username?.charAt(0)}</span>
                  )}
                </div>
                <span className="hero-card-name">{msg.username}</span>
              </div>
              <p className="hero-card-content">{msg.content}</p>
            </div>
          ))}
        </div>
        <div className="guestbook-hero-scroll-hint">
          <span>↓ 向下滚动查看更多 ↓</span>
        </div>
      </section>

      <section className="guestbook-content">
        <div className="guestbook-form-wrapper">
          <div className="guestbook-form-header">
            {user ? (
              <div className="guestbook-form-user">
                <div className="guestbook-form-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} />
                  ) : (
                    <span>{user.username.charAt(0)}</span>
                  )}
                </div>
                <span className="guestbook-form-username">{user.username}</span>
                <button
                  className="guestbook-logout-btn"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  退出
                </button>
              </div>
            ) : (
              <button className="guestbook-login-hint" onClick={loginWithGitHub}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub 登录
              </button>
            )}
          </div>
          <textarea
            className="guestbook-input"
            placeholder={user ? '在这里留下你的留言...' : '请先登录后再留言'}
            disabled={!user}
            maxLength={500}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (inputValue.trim()) {
                  handlePost(inputValue);
                }
              }
            }}
          />
          <div className="guestbook-form-footer">
            <span className="guestbook-form-hint">Ctrl + Enter 发送</span>
            <button
              className="guestbook-submit-btn"
              disabled={!user || !inputValue.trim()}
              onClick={() => {
                if (inputValue.trim()) {
                  handlePost(inputValue);
                }
              }}
            >
              发表留言
            </button>
          </div>
        </div>

        <div className="guestbook-list-header">
          <span className="guestbook-total">共 {messages.length} 条留言</span>
        </div>

        {loading ? (
          <div className="guestbook-loading">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="guestbook-empty">
            <div className="guestbook-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <p className="guestbook-empty-title">还没有留言</p>
            <p className="guestbook-empty-desc">登录后分享你的想法，成为第一个留下足迹的人</p>
          </div>
        ) : (
          <div className="guestbook-list">
            {messages.map((msg, idx) => {
              const replyTree = buildReplyTree(msg.replies);
              const totalReplies = msg.replies.length;
              return (
                <div key={msg.id} className="message-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                  <div className="message-header">
                    <div className="message-user">
                      <div className="message-avatar">
                        {msg.avatar ? (
                          <img src={msg.avatar} alt={msg.username} />
                        ) : (
                          <span>{msg.username?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="message-meta">
                        <span className="message-username">{msg.username}</span>
                        <span className="message-time">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="message-content">{msg.content}</p>
                  <div className="message-actions">
                    <button
                      className={`message-action-btn ${msg.liked ? 'liked' : ''}`}
                      onClick={() => handleLike(msg.id)}
                    >
                      <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill={msg.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span className="action-count">{msg.likes || ''}</span>
                    </button>
                    <button
                      className={`message-action-btn ${replyingTo === msg.id ? 'active' : ''}`}
                      onClick={() => {
                        if (!user) { loginWithGitHub(); return; }
                        setReplyingTo(replyingTo === msg.id ? null : msg.id);
                      }}
                    >
                      <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span className="action-count">{totalReplies || ''}</span>
                    </button>
                  </div>
                  <div className={`message-replies ${replyingTo === msg.id ? '' : 'collapsed'}`}>
                    {user && replyingTo === msg.id && (
                      <div className="message-reply-form">
                        <input
                          type="text"
                          placeholder="写回复..."
                          className="reply-input"
                          maxLength={200}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.trim()) {
                                handleReply(msg.id, target.value).then(success => {
                                  if (success) {
                                    target.value = '';
                                    setReplyingTo(null);
                                  }
                                });
                              }
                            }
                            if (e.key === 'Escape') setReplyingTo(null);
                          }}
                        />
                      </div>
                    )}
                    {replyTree.length > 0 && (
                      <div className="message-replies-scroll">
                        {replyTree.map(reply => (
                          <ReplyItem
                            key={reply.id}
                            reply={reply}
                            currentUser={user}
                            onReply={(msgId, content, parentId) => handleReply(msgId, content, parentId)}
                            collapsed={replyingTo !== msg.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="guestbook-pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ←
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-num ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              →
            </button>
          </div>
        )}
      </section>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}
