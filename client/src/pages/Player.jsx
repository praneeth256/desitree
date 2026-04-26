import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import VideoCard from '../components/VideoCard';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { fetchVideoById, fetchVideos, incrementVideoViews, deleteVideo, likeVideo, addComment, fetchComments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { sampleVideos } from '../data/videos';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [similarVideos, setSimilarVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    console.log('Loading video:', id);
    fetchVideoById(id)
      .then((data) => {
        console.log('Video data received:', data);
        setVideo(data);
        setLikes(data.likes || 0);
        setIsLiked(user && data.likedBy?.includes(user.id));
        return incrementVideoViews(id);
      })
      .then((update) => {
        console.log('Views updated:', update);
        setVideo((current) => (current ? { ...current, views: update.views } : current));
      })
      .catch((err) => {
        console.error('Error loading video:', err);
        const fallback = sampleVideos.find((item) => String(item.id) === String(id));
        if (fallback) {
          setVideo({ ...fallback, views: fallback.views + 1 });
        }
      });

    fetchComments(id)
      .then(setComments)
      .catch(console.error);

    fetchVideos()
      .then((allVideos) => {
        const currentVideo = allVideos.find((item) => String(item._id || item.id) === String(id));
        const similar = allVideos.filter((item) => String(item._id || item.id) !== String(id));
        if (currentVideo) {
          setSimilarVideos(similar.slice(0, 10));
        } else {
          setSimilarVideos(allVideos.filter((item) => String(item._id || item.id) !== String(id)).slice(0, 10));
        }
      })
      .catch(() => {
        const fallback = sampleVideos.filter((item) => String(item.id) !== String(id));
        setSimilarVideos(fallback.slice(0, 10));
      });
  }, [id, user]);

  const filteredSimilar = useMemo(() => similarVideos.slice(0, 10), [similarVideos]);

  const handleDeleteVideo = async () => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id);
        navigate('/');
      } catch (error) {
        alert('Failed to delete video');
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like videos');
      return;
    }
    try {
      const result = await likeVideo(id);
      setLikes(result.likes);
      setIsLiked(result.liked);
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      const newComment = await addComment(id, commentText);
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Comment failed:', error);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (!video) {
    return (
      <>
        <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
        <main className="player-page">
          <div className="loading-block">Loading video...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={false} />
      <main className="player-page">
        <div className="player-wrap">
          {video.videoUrl ? (
            <CustomVideoPlayer src={video.videoUrl} poster={video.thumbnailUrl || video.previewUrl} />
          ) : (
            <div className="player-error">Video URL not available</div>
          )}
        </div>

        <div className="video-info-block">
          <div className="video-header-row">
            <div>
              <div className="video-main-title">
                {video.title}
                {video.premium && <span className="premium-badge-big">PREMIUM</span>}
              </div>
              <div className="video-stats-row">
                <span className="stat">{video.views?.toLocaleString?.() || 0} views</span>
                <span className="stat">·</span>
                <span className="stat">{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {user?.role === 'admin' && (
              <button className="btn btn-danger" onClick={handleDeleteVideo}>
                Delete Video
              </button>
            )}
          </div>

          <div className="action-buttons">
            <button
              className={`btn-action ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              title="Like"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{likes}</span>
            </button>
            <button className="btn-action" onClick={handleShare} title="Share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          </div>

          <div className="tags-row">
            {(video.tags || []).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <div className="desc-block">
            <p>{video.description}</p>
          </div>

          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>
            {user ? (
              <form onSubmit={handleAddComment} className="comment-form">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="comment-input"
                />
                <button type="submit" className="btn btn-primary">
                  Comment
                </button>
              </form>
            ) : (
              <p className="login-prompt">Please <a href="/signin">sign in</a> to comment</p>
            )}

            <div className="comments-list">
              {comments.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-header">
                    <span className="comment-user">{comment.userName}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="similar-section">
          <div className="section-title">Similar Videos</div>
          <div className="similar-grid">
            {filteredSimilar.map((item) => (
              <VideoCard key={item._id || item.id} video={item} variant="player" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
