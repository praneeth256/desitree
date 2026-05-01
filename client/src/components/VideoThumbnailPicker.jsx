import { useRef, useState, useEffect, useCallback } from 'react';

const STRIP_FRAMES = 12; // number of frames shown in the filmstrip

export default function VideoThumbnailPicker({ videoFile, onCapture }) {
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const stripCanvasRefs = useRef([]);
  const [duration,      setDuration]      = useState(0);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [preview,       setPreview]       = useState(null);   // base64 of selected frame
  const [stripReady,    setStripReady]    = useState(false);
  const [dragging,      setDragging]      = useState(false);
  const [uploadedThumb, setUploadedThumb] = useState(null);   // manually uploaded image
  const [mode,          setMode]          = useState('frame'); // 'frame' | 'upload'
  const stripRef        = useRef(null);
  const objectUrlRef    = useRef(null);

  // Create object URL for the video file
  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    objectUrlRef.current = url;
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
    }
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Capture a frame at given time → returns base64 PNG
  const captureFrame = useCallback((time) => {
    return new Promise((resolve) => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);
      video.currentTime = time;
      const onSeeked = () => {
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
        video.removeEventListener('seeked', onSeeked);
      };
      video.addEventListener('seeked', onSeeked);
    });
  }, []);

  // Build filmstrip once video metadata loads
  const buildStrip = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const dur = video.duration;
    setDuration(dur);
    setStripReady(false);

    // Draw each strip thumbnail
    for (let i = 0; i < STRIP_FRAMES; i++) {
      const t      = (i / (STRIP_FRAMES - 1)) * dur;
      const frame  = await captureFrame(t);
      const el     = stripCanvasRefs.current[i];
      if (el && frame) {
        const img = new Image();
        img.onload = () => {
          el.width  = 60;
          el.height = 40;
          el.getContext('2d').drawImage(img, 0, 0, 60, 40);
        };
        img.src = frame;
      }
    }

    // Default: capture frame at 10% in
    const defaultFrame = await captureFrame(dur * 0.1);
    setPreview(defaultFrame);
    setCurrentTime(dur * 0.1);
    onCapture({ type: 'frame', dataUrl: defaultFrame });
    setStripReady(true);
  }, [captureFrame, onCapture]);

  const handleMetadata = () => { buildStrip(); };

  // Scrubber: click or drag on filmstrip
  const getTimeFromStripX = (clientX) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  };

  const handleStripInteraction = useCallback(async (clientX) => {
    if (!duration) return;
    const t = getTimeFromStripX(clientX);
    setCurrentTime(t);
    const frame = await captureFrame(t);
    if (frame) {
      setPreview(frame);
      onCapture({ type: 'frame', dataUrl: frame });
    }
  }, [duration, captureFrame, onCapture]);

  const handleStripMouseDown = (e) => { setDragging(true); handleStripInteraction(e.clientX); };
  const handleStripMouseMove = (e) => { if (dragging) handleStripInteraction(e.clientX); };
  const handleStripMouseUp   = ()  => setDragging(false);
  const handleStripTouchMove = (e) => { e.preventDefault(); handleStripInteraction(e.touches[0].clientX); };

  const handleUploadChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedThumb(url);
    setMode('upload');
    setPreview(url);
    onCapture({ type: 'file', file });
  };

  const switchToFrame = async () => {
    setMode('frame');
    const frame = await captureFrame(currentTime);
    if (frame) { setPreview(frame); onCapture({ type: 'frame', dataUrl: frame }); }
  };

  const scrubberPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="tnp-root">
      {/* Hidden video + canvas for frame capture */}
      <video ref={videoRef} style={{ display: 'none' }} onLoadedMetadata={handleMetadata} crossOrigin="anonymous" preload="auto" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Mode tabs */}
      <div className="tnp-tabs">
        <button type="button" className={`tnp-tab${mode === 'frame' ? ' tnp-tab--active' : ''}`} onClick={switchToFrame}>
          🎬 Choose from video
        </button>
        <button type="button" className={`tnp-tab${mode === 'upload' ? ' tnp-tab--active' : ''}`}
          onClick={() => document.getElementById('tnp-upload-input').click()}>
          📁 Upload image
        </button>
        <input id="tnp-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadChange} />
      </div>

      {mode === 'frame' && (
        <div className="tnp-frame-mode">
          {/* Preview */}
          <div className="tnp-preview-wrap">
            {preview
              ? <img src={preview} alt="Selected thumbnail" className="tnp-preview-img" />
              : <div className="tnp-preview-placeholder">{stripReady ? 'Drag the strip to select a frame' : 'Loading frames…'}</div>
            }
            {preview && <div className="tnp-preview-badge">Selected thumbnail</div>}
          </div>

          {/* Filmstrip */}
          <div className="tnp-strip-wrap">
            <div
              ref={stripRef}
              className="tnp-strip"
              onMouseDown={handleStripMouseDown}
              onMouseMove={handleStripMouseMove}
              onMouseUp={handleStripMouseUp}
              onMouseLeave={handleStripMouseUp}
              onTouchStart={(e) => handleStripInteraction(e.touches[0].clientX)}
              onTouchMove={handleStripTouchMove}
            >
              {Array.from({ length: STRIP_FRAMES }).map((_, i) => (
                <canvas
                  key={i}
                  ref={el => stripCanvasRefs.current[i] = el}
                  className="tnp-strip-frame"
                  width={60} height={40}
                />
              ))}
              {/* Scrubber indicator */}
              <div className="tnp-scrubber" style={{ left: `${scrubberPct}%` }}>
                <div className="tnp-scrubber-handle" />
              </div>
            </div>
            <div className="tnp-strip-hint">
              {stripReady ? '← Drag to pick a frame →' : 'Generating filmstrip…'}
            </div>
          </div>

          <div className="tnp-time-label">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {mode === 'upload' && uploadedThumb && (
        <div className="tnp-upload-preview">
          <img src={uploadedThumb} alt="Custom thumbnail" className="tnp-preview-img" />
          <div className="tnp-preview-badge">Custom thumbnail</div>
        </div>
      )}
    </div>
  );
}

function formatTime(t) {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
