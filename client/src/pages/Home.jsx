import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import VideoCard from '../components/VideoCard';
import { subscribeToVideos } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'most-viewed', label: 'Most Viewed' },
  { key: 'most-liked',  label: 'Most Liked' },
  { key: 'indian',      label: 'Indian' },
  { key: 'nri',         label: 'NRI' },
  { key: 'videsi',      label: 'Videsi' },
];

const VIDEOS_PER_PAGE = 16;

export default function Home() {
  const [videos, setVideos]               = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm]       = useState('');
  const [showWelcome, setShowWelcome]     = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const { user, loading }                 = useAuth();
  const location                          = useLocation();
  const navigate                          = useNavigate();
  const topRef                            = useRef(null);

  // Reset when logo is clicked
  useEffect(() => {
    if (location.state?.resetFilters) {
      setSelectedFilter('all');
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [location.state]);

  // Restore page from history state (back button fix)
  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
      if (location.state?.filter) setSelectedFilter(location.state.filter);
    }
  }, []); // only on mount

  useEffect(() => {
    const category = selectedFilter === 'all' ? null : selectedFilter;
    const unsubscribe = subscribeToVideos(category, (data) => setVideos(data));
    return () => unsubscribe();
  }, [selectedFilter]);

  useEffect(() => {
    if (user && !loading) {
      const welcomed = JSON.parse(localStorage.getItem('welcomedUsers') || '[]');
      const isFirst  = !welcomed.includes(user.id);
      setWelcomeMessage(isFirst ? `Welcome ${user.name}!` : `Welcome back ${user.name}!`);
      setShowWelcome(true);
      if (isFirst) {
        welcomed.push(user.id);
        localStorage.setItem('welcomedUsers', JSON.stringify(welcomed));
      }
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, [user, loading]);

  const visibleVideos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let filtered = videos.filter((v) => {
      if (q && !v.title.toLowerCase().includes(q) && !v.tags?.some(t => t.toLowerCase().includes(q))) return false;
      if (selectedFilter === 'all' || selectedFilter === 'most-viewed' || selectedFilter === 'most-liked') return true;
      return v.category === selectedFilter;
    });
    if (selectedFilter === 'most-viewed')      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (selectedFilter === 'most-liked')  filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else filtered.sort((a, b) => {
      const da = a.uploadedAt ? new Date(a.uploadedAt.seconds ? a.uploadedAt.toDate() : a.uploadedAt) : new Date(0);
      const db = b.uploadedAt ? new Date(b.uploadedAt.seconds ? b.uploadedAt.toDate() : b.uploadedAt) : new Date(0);
      return db - da;
    });
    return filtered;
  }, [videos, selectedFilter, searchTerm]);

  const totalPages      = Math.max(1, Math.ceil(visibleVideos.length / VIDEOS_PER_PAGE));
  const safePage        = Math.min(currentPage, totalPages);
  const paginatedVideos = useMemo(() => {
    const start = (safePage - 1) * VIDEOS_PER_PAGE;
    return visibleVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [visibleVideos, safePage]);

  // Page change: scroll to top + save state in history for back button
  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    // Save current page into history so back button can restore it
    navigate('.', { replace: true, state: { page: p, filter: selectedFilter } });
    // Scroll to top of grid
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const changeFilter = (key) => {
    setSelectedFilter(key);
    setCurrentPage(1);
    navigate('.', { replace: true, state: { page: 1, filter: key } });
  };

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
      {showWelcome && <div className="welcome-popup">{welcomeMessage}</div>}

      {/* Marquee banner above filters */}
      <div className="marquee-wrap marquee-home">
        <div className="marquee-track">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="marquee-text marquee-pink-gold">
              Desi Videos Uploaded everyday For Free&nbsp;&nbsp;|&nbsp;&nbsp;Comeback for latest uploads again&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      <div className="filters-bar" ref={topRef}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={f.key === selectedFilter ? 'filter active' : 'filter'}
            type="button"
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main>
        <div className="section-hdr">
          <div className="section-title">
            {selectedFilter === 'all' ? 'All Videos' : FILTERS.find(f => f.key === selectedFilter)?.label}
          </div>
        </div>

        <div className="video-grid">
          {paginatedVideos.map((video) => (
            <VideoCard
              key={video._id || video.id}
              video={video}
              currentPage={safePage}
              currentFilter={selectedFilter}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-pagination"
              onClick={() => goToPage(1)}
              disabled={safePage === 1}
            >« First</button>

            <button
              className="btn btn-pagination"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
            >‹ Prev</button>

            <span className="page-info">Page {safePage} of {totalPages}</span>

            <button
              className="btn btn-pagination"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
            >Next ›</button>

            <button
              className="btn btn-pagination"
              onClick={() => goToPage(totalPages)}
              disabled={safePage === totalPages}
            >Last »</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
