import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PREVIEW_SEGMENTS = [0.1, 0.3, 0.5, 0.7];
const SEGMENT_DURATION = 2; // seconds per key scene

// Detect touch device once on mount
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export default function VideoCard({ video, variant = 'grid' }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [hovering, setHovering] = useState(false);
  const segmentIndexRef = useRef(0);
  const intervalRef = useRef(null);
  const touchDeviceRef = useRef(isTouchDevice());

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearPreviewInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startKeyScenePreview = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.duration || isNaN(vid.duration)) return;

    segmentIndexRef.current = 0;
    const duration = vid.duration;

    const jumpToSegment = () => {
      const segmentPercent = PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length];
      vid.currentTime = duration * segmentPercent;
    };

    jumpToSegment();
    vid.play().catch(() => {});

    intervalRef.current = setInterval(() => {
      const segmentPercent = PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length];
      const segmentStart = duration * segmentPercent;
      
      if (vid.currentTime >= segmentStart + SEGMENT_DURATION) {
        segmentIndexRef.current += 1;
        const nextSegmentPercent = PREVIEW_SEGMENTS[segmentIndexRef.current % PREVIEW_SEGMENTS.length];
        vid.currentTime = duration * nextSegmentPercent;
      }
    }, 250);
  }, []);

  const handleMouseEnter = () => {
    // Skip hover preview on touch devices to avoid interfering with taps
    if (touchDeviceRef.current) return;
    if (!videoRef.current) return;
    setHovering(true);
    
    if (videoRef.current.readyState >= 1 && videoRef.current.duration) {
      startKeyScenePreview();
    } else {
      const handleLoaded = () => {
        startKeyScenePreview();
        videoRef.current.removeEventListener('loadedmetadata', handleLoaded);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoaded);
      videoRef.current.preload = 'metadata';
      videoRef.current.load();
    }
  };

  const handleMouseLeave = () => {
    if (touchDeviceRef.current) return;
    if (!videoRef.current) return;
    clearPreviewInterval();
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setProgress(0);
    setHovering(false);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(Number.isNaN(percentage) ? 0 : percentage);
  };

  const handleClick = () => {
    navigate(`/player/${video._id || video.id}`);
  };

  useEffect(() => {
    return () => clearPreviewInterval();
  }, []);

  return (
    <div
      className={`video-card ${variant}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="thumb-wrap">
        <img src={video.thumbnailUrl || video.thumb} alt={video.title} loading="lazy" />
        <video
          ref={videoRef}
          src={video.previewUrl || video.preview || video.videoUrl}
          muted
          loop={false}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          style={{ pointerEvents: 'none' }}
        />
        <div className="duration-badge">{formatDuration(video.duration)}</div>
        {video.premium && <div className="premium-ribbon">PREMIUM</div>}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="card-info">
        <div className="card-title">{video.title}</div>
        <div className="card-meta">
          <span className="card-views">{video.views?.toLocaleString?.() || 0} views · {video.date || ''}</span>
          {video.premium ? (
            <span className="card-cat premium-label">PREMIUM</span>
          ) : (
            <span className="free-tag">FREE</span>
          )}
        </div>
      </div>
    </div>
  );
}

