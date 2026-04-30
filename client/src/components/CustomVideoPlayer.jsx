import { useRef, useState, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITIES = ['Auto', '144p', '240p', '360p', '480p', '720p', '1080p'];

export default function CustomVideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('speed'); // 'speed' | 'quality'
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [buffered, setBuffered] = useState(0);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const lastTapRef = useRef(0);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isEnded) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsEnded(false);
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isEnded]);

  const skip = (secs) => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + secs));
    showCtrl();
  };

  const handleVideoClick = useCallback((e) => {
    const isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobileDevice) { togglePlayPause(); return; }
    const now  = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    if (now - lastTapRef.current < 300) {
      if (pct < 0.4)      skip(-10);
      else if (pct > 0.6) skip(10);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 290) togglePlayPause();
      }, 310);
    }
  }, [togglePlayPause]);

  const handleTimeChange = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = e.target.value;
      setCurrentTime(Number(e.target.value));
    }
  };

  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (vol === 0) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      setIsMuted(false);
      setLastVolume(vol);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = vol;
      }
    }
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      setLastVolume(volume > 0 ? volume : lastVolume);
      videoRef.current.muted = true;
    } else {
      videoRef.current.muted = false;
      const restore = lastVolume || 0.5;
      setVolume(restore);
      videoRef.current.volume = restore;
    }
  };

  const handleContextMenu = (e) => e.preventDefault();

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      else if (videoRef.current?.webkitEnterFullscreen) videoRef.current.webkitEnterFullscreen();
    } catch (err) {}
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
    } catch (err) {}
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!el) enterFullscreen(); else exitFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  const changeSpeed = (s) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSettings(false);
  };

  const changeQuality = (q) => {
    setQuality(q);
    setShowSettings(false);
  };

  const showCtrl = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => setDuration(video.duration);
    const onTime = () => {
      setCurrentTime(video.currentTime);
      // Update buffered
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };
    const onEnded = () => { setIsPlaying(false); setIsEnded(true); setShowControls(true); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      setIsFullscreen(!!el);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('msfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('msfullscreenchange', onFsChange);
    };
  }, []);

  // Close settings on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e) => {
      if (!e.target.closest('.vp-settings-wrap')) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    );
    if (volume < 0.5) return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
      </svg>
    );
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`vp-root${isFullscreen ? ' vp-fullscreen' : ''}`}
      onMouseMove={showCtrl}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchStart={showCtrl}
      onContextMenu={handleContextMenu}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="vp-video"
        onClick={handleVideoClick}
        onContextMenu={handleContextMenu}
        disablePictureInPicture
        playsInline
        muted={isMuted}
        controlsList="nodownload nofullscreen noremoteplayback"
      />

      {/* Replay overlay */}
      {isEnded && (
        <div className="vp-overlay vp-ended-overlay" onClick={togglePlayPause}>
          <button className="vp-replay-btn" type="button" aria-label="Replay">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="white">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span>Replay</span>
          </button>
        </div>
      )}

      {/* Big play button when paused */}
      {!isPlaying && !isEnded && (
        <div className="vp-overlay vp-pause-overlay" onClick={togglePlayPause}>
          <button className="vp-big-play-btn" type="button" aria-label="Play">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="26" fill="rgba(0,0,0,0.55)"/>
              <circle cx="26" cy="26" r="25" stroke="rgba(240,192,64,0.6)" strokeWidth="1.5"/>
              <path d="M21 17l16 9-16 9V17z" fill="#f0c040"/>
            </svg>
          </button>
        </div>
      )}

      {/* Controls bar */}
      <div className={`vp-controls${showControls ? ' vp-controls--visible' : ''}`}>

        {/* Progress bar */}
        <div className="vp-progress-wrap">
          <div className="vp-progress-track">
            <div className="vp-buffered" style={{ width: `${buffered}%` }} />
            <div className="vp-played" style={{ width: `${progress}%` }} />
            <input
              ref={progressRef}
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleTimeChange}
              className="vp-range vp-progress-range"
              aria-label="Seek"
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="vp-bottom">
          <div className="vp-left">
            {/* Play/Pause */}
            <button className="vp-btn" onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="4" width="4" height="16" rx="1"/>
                  <rect x="15" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Rewind 10s */}
            <button className="vp-btn vp-skip-btn" onClick={() => skip(-10)} title="Rewind 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="14" text-anchor="middle" font-size="6" fill="white" font-weight="bold">10</text>
              </svg>
            </button>

            {/* Forward 10s */}
            <button className="vp-btn vp-skip-btn" onClick={() => skip(10)} title="Forward 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm-11.58.59L12 13.17l5.59-5.58L19 9l-7 7-7-7 1.42-1.41z" style="display:none"/>
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="12" y="14" text-anchor="middle" font-size="6" fill="white" font-weight="bold">10</text>
              </svg>
            </button>

            {/* Volume */}
            <div className="vp-volume-wrap">
              <button className="vp-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                <VolumeIcon />
              </button>
              <div className="vp-volume-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="vp-range vp-volume-range"
                  title="Volume"
                />
              </div>
            </div>

            {/* Time */}
            <span className="vp-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="vp-right">
            {/* Speed badge */}
            {speed !== 1 && (
              <span className="vp-speed-badge">{speed}x</span>
            )}

            {/* Settings */}
            <div className="vp-settings-wrap">
              <button
                className={`vp-btn${showSettings ? ' vp-btn--active' : ''}`}
                onClick={() => setShowSettings(s => !s)}
                title="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ transition: 'transform 0.3s', transform: showSettings ? 'rotate(45deg)' : 'none' }}>
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
              </button>

              {showSettings && (
                <div className="vp-settings-panel">
                  <div className="vp-settings-tabs">
                    <button
                      className={`vp-stab${settingsTab === 'speed' ? ' vp-stab--active' : ''}`}
                      onClick={() => setSettingsTab('speed')}
                    >Speed</button>
                    <button
                      className={`vp-stab${settingsTab === 'quality' ? ' vp-stab--active' : ''}`}
                      onClick={() => setSettingsTab('quality')}
                    >Quality</button>
                  </div>
                  <div className="vp-settings-list">
                    {settingsTab === 'speed' && SPEEDS.map(s => (
                      <button
                        key={s}
                        className={`vp-sitem${speed === s ? ' vp-sitem--active' : ''}`}
                        onClick={() => changeSpeed(s)}
                      >
                        {s === 1 ? 'Normal (1x)' : `${s}x`}
                        {speed === s && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                      </button>
                    ))}
                    {settingsTab === 'quality' && QUALITIES.map(q => (
                      <button
                        key={q}
                        className={`vp-sitem${quality === q ? ' vp-sitem--active' : ''}`}
                        onClick={() => changeQuality(q)}
                      >
                        {q}
                        {quality === q && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button className="vp-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
