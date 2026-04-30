import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatViews } from '../utils/formatViews';

const PREVIEW_SEGMENTS  = [0.1, 0.3, 0.5, 0.7];
const SEGMENT_DURATION  = 2;
const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function VideoCard({ video, variant = 'grid', currentPage = 1, currentFilter = 'all' }) {
  const navigate        = useNavigate();
  const videoRef        = useRef(null);
  const [progress, setProgress]   = useState(0);
  const [hovering, setHovering]   = useState(false);
  const segmentIndexRef = useRef(0);
  const intervalRef     = useRef(null);
  const isTouch         = useRef(isTouchDevice());

  const formatDuration = (s) => {
    if (!s || isNaN(s)) return '';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const clearPreview = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const startKeyScenePreview = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.duration || isNaN(vid.duration)) return;
    segmentIndexRef.current = 0;
    const dur = vid.duration;
    const jump = () => { vid.currentTime = dur * PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length]; };
    jump();
    vid.play().catch(() => {});
    intervalRef.current = setInterval(() => {
      const pct   = PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length];
      const start = dur * pct;
      if (vid.currentTime >= start + SEGMENT_DURATION) {
        segmentIndexRef.current += 1;
        vid.currentTime = dur * PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length];
      }
    }, 250);
  }, []);

  const handleMouseEnter = () => {
    if (isTouch.current || !videoRef.current) return;
    setHovering(true);
    if (videoRef.current.readyState >= 1 && videoRef.current.duration) {
      startKeyScenePreview();
    } else {
      const onLoaded = () => { startKeyScenePreview(); videoRef.current?.removeEventListener('loadedmetadata', onLoaded); };
      videoRef.current.addEventListener('loadedmetadata', onLoaded);
      videoRef.current.preload = 'metadata';
      videoRef.current.load();
    }
  };

  const handleMouseLeave = () => {
    if (isTouch.current || !videoRef.current) return;
    clearPreview();
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setProgress(0);
    setHovering(false);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleClick = () => {
    navigate(`/player/${video._id || video.id}`, {
      state: { fromPage: currentPage, fromFilter: currentFilter }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => () => clearPreview(), []);

  return (
    <div
      className={`video-card ${variant}${hovering ? ' video-card--hover' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
    >
      <div className="thumb-wrap">
        <img src={video.thumbnailUrl || video.thumb} alt={video.title} loading="lazy" />
        {!isTouch.current && (
          <video
            ref={videoRef}
            src={video.previewUrl || video.preview || video.videoUrl}
            muted loop={false} playsInline preload="none"
            onTimeUpdate={handleTimeUpdate}
            style={{ pointerEvents: 'none' }}
          />
        )}
        {video.duration && <div className="duration-badge">{formatDuration(video.duration)}</div>}
        {video.premium && <div className="premium-ribbon">PREMIUM</div>}
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="card-info">
        <div className={`card-title${hovering ? ' card-title--gold' : ''}`}>{video.title}</div>
        <div className="card-meta">
          <span className="card-views">{formatViews(video.views)} views</span>
          {video.premium ? <span className="card-cat premium-label">PREMIUM</span> : <span className="free-tag">FREE</span>}
        </div>
      </div>
    </div>
  );
}
