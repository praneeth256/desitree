import { useEffect, useMemo, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import VideoCard from '../components/VideoCard';
import { subscribeToVideos } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'most-viewed', label: 'Most Viewed' },
  { key: 'most-liked', label: 'Most Liked' },
  { key: 'indian', label: 'Indian' },
  { key: 'nri', label: 'NRI' },
  { key: 'videsi', label: 'Videsi' },
];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user, loading } = useAuth();

  const VIDEOS_PER_PAGE = 16;

  useEffect(() => {
    const category = selectedFilter === 'all' ? null : selectedFilter;
    const unsubscribe = subscribeToVideos(category, (data) => {
      setVideos(data);
    });
    return () => unsubscribe();
  }, [selectedFilter]);

  useEffect(() => {
    if (user && !loading) {
      const welcomed = JSON.parse(localStorage.getItem('welcomedUsers') || '[]');
      const isFirst = !welcomed.includes(user.id);
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
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let filtered = videos.filter((video) => {
      if (normalizedSearch && !video.title.toLowerCase().includes(normalizedSearch) && 
          !video.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch))) {
        return false;
      }
      
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'most-viewed') return true;
      if (selectedFilter === 'most-liked') return true;
      return video.category === selectedFilter;
    });

    // Sort based on filter
    if (selectedFilter === 'most-viewed') {
      filtered.sort((a, b) => b.views - a.views);
    } else if (selectedFilter === 'most-liked') {
      filtered.sort((a, b) => b.likes - a.likes);
    } else {
      // Most recent first for 'all' and category filters
      filtered.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt.seconds ? a.uploadedAt.toDate() : a.uploadedAt) : new Date(0);
        const dateB = b.uploadedAt ? new Date(b.uploadedAt.seconds ? b.uploadedAt.toDate() : b.uploadedAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return filtered;
  }, [videos, selectedFilter, searchTerm]);

  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * VIDEOS_PER_PAGE;
    return visibleVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [visibleVideos, currentPage]);

  const totalPages = Math.ceil(visibleVideos.length / VIDEOS_PER_PAGE);

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
      {showWelcome && (
        <div className="welcome-popup">
          {welcomeMessage}
        </div>
      )}
      <div className="filters-bar">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            className={filter.key === selectedFilter ? 'filter active' : 'filter'}
            type="button"
            onClick={() => {
              setSelectedFilter(filter.key);
              setCurrentPage(1);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <main>
        <div className="section-hdr">
          <div className="section-title">{selectedFilter === 'all' ? 'All Videos' : `${FILTERS.find((f) => f.key === selectedFilter)?.label}`}</div>
        </div>
        <div className="video-grid">
          {paginatedVideos.map((video) => (
            <VideoCard key={video._id || video.id} video={video} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-pagination"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-pagination"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
