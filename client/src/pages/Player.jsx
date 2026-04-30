import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import VideoCard from '../components/VideoCard';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import ShareModal from '../components/ShareModal';
import {
  fetchVideoById, fetchVideos, incrementVideoViews,
  deleteVideo, likeVideo, addComment, subscribeToComments
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatViews } from '../utils/formatViews';

export default function Player() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuth();

  const [video, setVideo]             = useState(null);
  const [allVideos, setAllVideos]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo]   = useState(null);
  const [isLiked, setIsLiked]         = useState(false);
  const [likes, setLikes]             = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setVideo(null);

    const loadVideo = async () => {
      try {
        const data = await fetchVideoById(id);
        setVideo(data);
        setLikes(data.likes || 0);
      } catch {
        navigate('/');
        return;
      }
      try { await incrementVideoViews(id); } catch {}
    };

    const loadAll = async () => {
      try { setAllVideos(await fetchVideos()); } catch {}
    };

    const unsubComments = subscribeToComments(id, setComments);
    loadVideo();
    loadAll();
    return () => { if (unsubComments) unsubComments(); };
  }, [id, navigate]);

  useEffect(() => {
    if (video && user) setIsLiked(video.likedBy?.includes(user.id));
    else setIsLiked(false);
  }, [video, user]);

  // Similar videos: keyword match first, then most-viewed fallback, max 8
  const similarVideos = useMemo(() => {
    if (!video || allVideos.length === 0) return [];
    const others = allVideos.filter(v => v.id !== id);

    // Extract keywords from title (words ≥4 chars)
    const titleWords = video.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 4);

    const scored = others.map(v => {
      const vTitle = v.title.toLowerCase();
      const score  = titleWords.reduce((acc, w) => acc + (vTitle.includes(w) ? 1 : 0), 0);
      return { ...v, _score: score };
    });

    const matched  = scored.filter(v => v._score > 0).sort((a, b) => b._score - a._score);
    const fallback = scored.filter(v => v._score === 0).sort((a, b) => (b.views || 0) - (a.views || 0));
    return [...matched, ...fallback].slice(0, 8);
  }, [video, allVideos, id]);

  const handleDeleteVideo = async () => {
    if (!window.confirm('Delete this video?')) return;
    try { await deleteVideo(id); navigate('/'); } catch { alert('Delete failed'); }
  };

  const handleLike = async () => {
    try {
      const result = await likeVideo(id);
      setLikes(result.likes);
      setIsLiked(result.liked);
    } catch (e) { console.error('Like failed:', e); }
  };

  const handleAddComment = async (e, parentCommentId = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!commentText.trim()) return;
    try {
      await addComment(id, commentText, parentCommentId);
      setCommentText('');
      setReplyingTo(null);
    } catch { alert('Failed to post comment. Please try again.'); }
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: video.title, url: window.location.href });
    else setShowShareModal(true);
  };

  // Back button: restore page user came from
  const handleBack = () => {
    const fromPage   = location.state?.fromPage   || 1;
    const fromFilter = location.state?.fromFilter || 'all';
    navigate('/', { state: { page: fromPage, filter: fromFilter } });
  };

  if (!video) return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
      <main className="player-page">
        <div className="loading-block">Loading video...</div>
      </main>
    </>
  );

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
      <main className="player-page">

        {/* Back button */}
        <button className="btn-back" onClick={handleBack}>
          ← Back
        </button>

        {/* Like reminder marquee */}
        <div className="marquee-wrap marquee-player">
          <div className="marquee-track">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="marquee-text marquee-neon-gold">
                Feel free to like the video&nbsp;&nbsp;·&nbsp;&nbsp;You don't have to sign in to like the video&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>

        <div className="video-info-block" style={{ marginBottom: '0.75rem' }}>
          <div className="video-header-row">
            <div>
              <div className="video-main-title">
                {video.title}
                {video.premium && <span className="premium-badge-big">PREMIUM</span>}
              </div>
              <div className="video-stats-row">
                <span className="stat">{formatViews(video.views)} views</span>
                <span className="stat">·</span>
                <span className="stat">
                  {video.uploadedAt
                    ? new Date(video.uploadedAt.seconds ? video.uploadedAt.toDate() : video.uploadedAt).toLocaleDateString()
                    : ''}
                </span>
              </div>
            </div>
            {user?.role === 'admin' && (
              <button className="btn btn-danger" onClick={handleDeleteVideo}>Delete Video</button>
            )}
          </div>
        </div>

        <div className="player-layout">
          <div className="player-main">
            <div className="player-wrap">
              {video.videoUrl
                ? <CustomVideoPlayer src={video.videoUrl} poster={video.thumbnailUrl || video.previewUrl} />
                : <div className="player-error">Video URL not available</div>
              }
            </div>
          </div>
          <aside className="player-aside">
            <div className="aside-announce">
              <span className="aside-announce-label">Announcements</span>
              <p className="aside-announce-text">Stay tuned for updates, promotions &amp; exclusive content from DesiTree!</p>
            </div>
          </aside>
        </div>

        <div className="video-info-block">
          <div className="action-buttons">
            <button className={isLiked ? 'btn-action liked' : 'btn-action'} onClick={handleLike} title="Like">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{likes}</span>
            </button>
            <button className="btn-action" onClick={handleShare} title="Share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          </div>

          <div className="tags-row">
            {(video.tags || []).map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
          <div className="desc-block"><p>{video.description}</p></div>

          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>
            <form onSubmit={handleAddComment} className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button type="submit" className="btn btn-primary">Comment</button>
            </form>

            <div className="comments-list">
              {comments.filter(c => !c.parentCommentId).map((comment, index) => (
                <div key={comment.id || index} className="comment">
                  <div className="comment-header">
                    <span className={`comment-user${comment.isAdmin ? ' comment-user--admin' : ''}`}>
                      {comment.isAdmin && <span className="admin-badge">ADMIN</span>}
                      {comment?.userName || comment?.user || 'Anonymous'}
                    </span>
                    <span className="comment-date">
                      {comment?.timestamp ? new Date(comment.timestamp.seconds ? comment.timestamp.toDate() : comment.timestamp).toLocaleDateString() : ''}
                    </span>
                    <button className="reply-btn" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                      {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                  </div>
                  <p className="comment-text">{comment?.text || ''}</p>

                  {comments.filter(r => r.parentCommentId === comment.id).map((reply, ri) => (
                    <div key={reply.id || ri} className="comment comment--reply">
                      <div className="comment-header">
                        <span className={`comment-user${reply.isAdmin ? ' comment-user--admin' : ''}`}>
                          {reply.isAdmin && <span className="admin-badge">ADMIN</span>}
                          {reply?.userName || 'Anonymous'}
                        </span>
                        <span className="comment-date">
                          {reply?.timestamp ? new Date(reply.timestamp.seconds ? reply.timestamp.toDate() : reply.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="comment-text">{reply?.text || ''}</p>
                    </div>
                  ))}

                  {replyingTo === comment.id && (
                    <form onSubmit={(e) => handleAddComment(e, comment.id)} className="reply-form">
                      <input
                        type="text" value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={`Replying to ${comment.userName || 'Anonymous'}...`}
                        className="comment-input" autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-small">Reply</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {similarVideos.length > 0 && (
          <div className="similar-section">
            <div className="section-title">Similar Videos</div>
            <div className="similar-grid">
              {similarVideos.map((item) => (
                <VideoCard key={item._id || item.id} video={item} variant="player" />
              ))}
            </div>
          </div>
        )}
      </main>

      {showShareModal && video && (
        <ShareModal url={window.location.href} title={video.title} onClose={() => setShowShareModal(false)} />
      )}
      <Footer />
    </>
  );
}
