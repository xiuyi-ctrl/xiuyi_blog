import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Suggestion {
  id: number;
  title: string;
  type: 'post' | 'project';
}

interface SearchSuggestionsProps {
  keyword: string;
  onSelect?: () => void;
}

export interface SearchSuggestionsHandle {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? (
      <mark key={i} className="search-highlight">{part}</mark>
    ) : (
      part
    )
  );
}

const SearchSuggestions = forwardRef<SearchSuggestionsHandle, SearchSuggestionsProps>(
  function SearchSuggestions({ keyword, onSelect }, ref) {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword.trim()) {
      setSuggestions([]);
      setVisible(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/search/suggestions', { params: { keyword: searchKeyword } });
      const results = data.suggestions || [];
      setSuggestions(results);
      setVisible(results.length > 0);
      setActiveIndex(results.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(keyword);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    if (suggestion.type === 'post') {
      navigate(`/post/${suggestion.id}`);
    } else {
      navigate('/projects');
    }
    setVisible(false);
    onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visible || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setVisible(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setVisible(false);
        setActiveIndex(-1);
        break;
    }
  };

  useImperativeHandle(ref, () => ({
    handleKeyDown
  }));

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  if (!visible) {
    return null;
  }

  if (!loading && suggestions.length === 0 && keyword.trim()) {
    return (
      <div className="search-suggestions" ref={containerRef} role="listbox">
        <div className="search-empty">
          <svg className="search-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <path d="M8 11h6"/>
          </svg>
          <p className="search-empty-title">没有找到相关内容</p>
          <p className="search-empty-hint">试试其他关键词</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-suggestions" ref={containerRef} role="listbox">
      {loading ? (
        <div className="search-suggestions-loading">
          <div className="search-loading-dot" />
          <div className="search-loading-dot" />
          <div className="search-loading-dot" />
        </div>
      ) : (
        <>
          <div className="search-suggestions-header">
            <span className="search-result-count">找到 {suggestions.length} 个结果</span>
          </div>
          <ul className="search-suggestions-list" ref={listRef}>
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${suggestion.id}`}
                id={`search-suggestion-${index}`}
                className={`search-suggestion-item ${index === activeIndex ? 'active' : ''}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className={`suggestion-icon ${suggestion.type}`}>
                  {suggestion.type === 'post' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                </span>
                <span className="suggestion-content">
                  <span className="suggestion-title">
                    {highlightText(suggestion.title, keyword)}
                  </span>
                </span>
                <span className={`suggestion-type ${suggestion.type}`}>
                  {suggestion.type === 'post' ? '文章' : '项目'}
                </span>
              </li>
            ))}
          </ul>
          <div className="search-suggestions-footer">
            <span className="search-hint">
              <kbd>↑</kbd><kbd>↓</kbd> 导航
              <kbd>↵</kbd> 选择
              <kbd>ESC</kbd> 关闭
            </span>
          </div>
        </>
      )}
    </div>
  );
});

export default SearchSuggestions;
