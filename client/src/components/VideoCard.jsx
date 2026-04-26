import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VideoCard({ video, variant = 'grid' }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [hovering, setHovering] = useState(false);

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

  const handleMouseEnter = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setHovering(true);
  };

  const handleMouseLeave = () => {
    if (!videoRef.current) return;
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

  return (
    <div
      className={`video-card ${variant}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/player/${video._id || video.id}`)}
    >
      <div className="thumb-wrap">
        <img src={video.thumbnailUrl || video.thumb} alt={video.title} loading="lazy" />
        <video
          ref={videoRef}
          src={video.previewUrl || video.preview}
          muted
          loop
          playsInline
          preload="none"
          onTimeUpdate={handleTimeUpdate}
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
          <span className="card-views">{video.views.toLocaleString()} views · {video.date || ''}</span>
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
