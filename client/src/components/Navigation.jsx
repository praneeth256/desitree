import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchVideos } from '../services/api';

export default function Navigation({ search = '', onSearch = () => {}, showAdmin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const videos = await fetchVideos();
        setAllVideos(videos);
      } catch (error) {
        console.error('Error loading videos for search:', error);
      }
    };
    loadVideos();
  }, []);

  useEffect(() => {
    const trimmed = (search || '').trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const matched = allVideos
      .filter((v) => v.title?.toLowerCase().includes(trimmed))
      .slice(0, 6);
    setSuggestions(matched);
  }, [search, allVideos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setShowSuggestions(false);
    if ((search || '').trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  }, [search, navigate]);

  const handleSuggestionClick = (video) => {
    setShowSuggestions(false);
    onSearch(video.title);
    navigate(`/player/${video.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    onSearch('');
    setShowSuggestions(false);
    navigate('/', { state: { resetFilters: true } });
  };

  return (
    <nav>
      <NavLink to="/" className="logo" onClick={handleLogoClick}>Desi<span>Tree</span></NavLink>
      <div className="nav-center">
        <div className="search-wrap" ref={wrapRef}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="search-bar"
            placeholder="Search videos..."
            autoComplete="off"
          />
          <button
            type="button"
            className="search-btn"
            onClick={handleSearchSubmit}
            aria-label="Search"
            title="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-dropdown">
              {suggestions.map((video) => (
                <li
                  key={video.id}
                  className="search-dropdown-item"
                  onClick={() => handleSuggestionClick(video)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span className="search-dropdown-title">{video.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="nav-right">
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Admin</NavLink>
        )}
{user ? (
          <>
            <span className="user-greeting">Hi, {user.name}</span>
            {user.role === 'admin' && (
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            )}
          </>
        ) : (
          <>
            <NavLink to="/signin" className="btn btn-ghost">Sign In</NavLink>
            <NavLink to="/signup" className="btn btn-premium">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
