import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { uploadToCloudinary, fetchContacts, fetchVideos, deleteVideo, updateVideoMetadata } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const initialForm = { title: '', description: '', category: 'indian' };

const TABS = [
  { key: 'upload',  label: 'Upload Video' },
  { key: 'manage',  label: 'Manage Videos' },
  { key: 'messages', label: 'Messages / Reports' },
];

export default function Admin() {
  const [activeTab, setActiveTab]       = useState('upload');
  const [form, setForm]                 = useState(initialForm);
  const [videoFile, setVideoFile]       = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [message, setMessage]           = useState('');
  const [isUploading, setIsUploading]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');

  // Manage tab
  const [videos, setVideos]             = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [editThumb, setEditThumb]       = useState(null);
  const [editThumbPreview, setEditThumbPreview] = useState(null);
  const [editSaving, setEditSaving]     = useState(false);
  const [editMsg, setEditMsg]           = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const editThumbRef = useRef(null);

  // Messages tab
  const [contacts, setContacts]         = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'messages') loadContacts();
    if (activeTab === 'manage')   loadVideos();
  }, [activeTab]);

  const loadContacts = async () => {
    setContactsLoading(true);
    try { setContacts(await fetchContacts()); }
    catch (e) { console.error(e); }
    finally { setContactsLoading(false); }
  };

  const loadVideos = async () => {
    setVideosLoading(true);
    try { setVideos(await fetchVideos()); }
    catch (e) { console.error(e); }
    finally { setVideosLoading(false); }
  };

  // ---- Upload tab ----
  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) { setMessage('Please select a video file'); return; }
    setIsUploading(true);
    setMessage('');
    try {
      await uploadToCloudinary(videoFile, form.title, form.description, form.category, thumbnailFile);
      setMessage('✅ Video uploaded successfully!');
      setForm(initialForm);
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (err) {
      setMessage('❌ Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Manage tab ----
  const startEdit = (video) => {
    setEditingId(video.id);
    setEditForm({ title: video.title, description: video.description || '', category: video.category });
    setEditThumb(null);
    setEditThumbPreview(video.thumbnailUrl || null);
    setEditMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditThumb(null);
    setEditThumbPreview(null);
    setEditMsg('');
  };

  const handleEditThumb = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditThumb(file);
    setEditThumbPreview(URL.createObjectURL(file));
  };

  const saveEdit = async (id) => {
    if (!editForm.title.trim()) { setEditMsg('Title is required'); return; }
    setEditSaving(true);
    setEditMsg('');
    try {
      await updateVideoMetadata(id, { ...editForm, thumbnailFile: editThumb });
      setVideos(vs => vs.map(v => v.id === id
        ? { ...v, ...editForm, ...(editThumb ? { thumbnailUrl: editThumbPreview } : {}) }
        : v
      ));
      setEditMsg('✅ Saved!');
      setTimeout(() => { setEditingId(null); setEditMsg(''); }, 1200);
    } catch (err) {
      setEditMsg('❌ Save failed: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await deleteVideo(id);
      setVideos(vs => vs.filter(v => v.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={true} />
      <main className="admin-page">
        <div className="admin-panel">

          <div className="admin-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'admin-tab active' : 'admin-tab'}
                onClick={() => setActiveTab(tab.key)}
              >{tab.label}</button>
            ))}
            <button className="btn btn-ghost admin-logout-btn" onClick={logout}>Logout</button>
          </div>

          {/* ====== UPLOAD TAB ====== */}
          {activeTab === 'upload' && (
            <>
              <h1>Upload Video</h1>
              <p>Videos are stored on Cloudinary, metadata in Firestore.</p>
              <form className="admin-form" onSubmit={handleSubmit}>
                <label>
                  Title *
                  <input value={form.title} onChange={handleChange('title')} placeholder="Enter video title" required />
                </label>
                <label>
                  Description
                  <textarea value={form.description} onChange={handleChange('description')} rows="4" placeholder="Optional description" />
                </label>
                <label>
                  Category *
                  <select value={form.category} onChange={handleChange('category')} required>
                    <option value="indian">Indian</option>
                    <option value="nri">NRI</option>
                    <option value="videsi">Videsi</option>
                  </select>
                </label>
                <label>
                  Video File *
                  <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} required />
                </label>
                <label>
                  Thumbnail (optional)
                  <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} />
                </label>
                <button type="submit" disabled={isUploading} className="btn-upload">
                  {isUploading ? (
                    <><span className="upload-spinner" /> Uploading...</>
                  ) : 'Upload Video'}
                </button>
              </form>
              {message && <p className={`admin-msg ${message.startsWith('✅') ? 'admin-msg--ok' : 'admin-msg--err'}`}>{message}</p>}
            </>
          )}

          {/* ====== MANAGE TAB ====== */}
          {activeTab === 'manage' && (
            <>
              <div className="manage-header">
                <h1>Manage Videos</h1>
                <span className="manage-count">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
              </div>

              {videosLoading ? (
                <div className="loading-block">Loading videos...</div>
              ) : videos.length === 0 ? (
                <p className="no-messages">No videos uploaded yet.</p>
              ) : (
                <div className="manage-list">
                  {videos.map(video => (
                    <div key={video.id} className={`manage-card ${editingId === video.id ? 'manage-card--editing' : ''}`}>

                      {/* ---- View mode ---- */}
                      {editingId !== video.id ? (
                        <div className="manage-card-view">
                          <img
                            src={video.thumbnailUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="68"><rect width="120" height="68" fill="%23222"/><text x="60" y="38" text-anchor="middle" fill="%23666" font-size="11">No thumb</text></svg>'}
                            alt={video.title}
                            className="manage-thumb"
                          />
                          <div className="manage-meta">
                            <div className="manage-title">{video.title}</div>
                            <div className="manage-sub">
                              <span className="manage-cat">{video.category}</span>
                              <span className="manage-views">{video.views || 0} views</span>
                              <span className="manage-likes">{video.likes || 0} likes</span>
                            </div>
                            {video.description && (
                              <div className="manage-desc">{video.description.slice(0, 100)}{video.description.length > 100 ? '…' : ''}</div>
                            )}
                          </div>
                          <div className="manage-actions">
                            <button className="btn-manage-edit" onClick={() => startEdit(video)}>
                              ✏️ Edit
                            </button>
                            {deleteConfirmId === video.id ? (
                              <div className="delete-confirm">
                                <span>Sure?</span>
                                <button className="btn-manage-delete-confirm" onClick={() => confirmDelete(video.id)}>Yes, Delete</button>
                                <button className="btn-manage-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                              </div>
                            ) : (
                              <button className="btn-manage-delete" onClick={() => setDeleteConfirmId(video.id)}>
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* ---- Edit mode ---- */
                        <div className="manage-card-edit">
                          <div className="edit-thumb-section">
                            <img
                              src={editThumbPreview || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="%23222"/><text x="80" y="49" text-anchor="middle" fill="%23666" font-size="11">No thumbnail</text></svg>'}
                              alt="Thumbnail preview"
                              className="edit-thumb-preview"
                            />
                            <button
                              type="button"
                              className="btn-change-thumb"
                              onClick={() => editThumbRef.current?.click()}
                            >
                              📷 Change Thumbnail
                            </button>
                            <input
                              ref={editThumbRef}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleEditThumb}
                            />
                            {editThumb && <span className="thumb-new-badge">New thumbnail selected</span>}
                          </div>

                          <div className="edit-fields">
                            <label className="edit-label">
                              Title *
                              <input
                                className="edit-input"
                                value={editForm.title}
                                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Video title"
                              />
                            </label>
                            <label className="edit-label">
                              Category
                              <select
                                className="edit-input"
                                value={editForm.category}
                                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                              >
                                <option value="indian">Indian</option>
                                <option value="nri">NRI</option>
                                <option value="videsi">Videsi</option>
                              </select>
                            </label>
                            <label className="edit-label">
                              Description
                              <textarea
                                className="edit-input"
                                rows="3"
                                value={editForm.description}
                                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Optional description"
                              />
                            </label>

                            {editMsg && (
                              <p className={`admin-msg ${editMsg.startsWith('✅') ? 'admin-msg--ok' : 'admin-msg--err'}`}>{editMsg}</p>
                            )}

                            <div className="edit-btns">
                              <button
                                className="btn-manage-save"
                                onClick={() => saveEdit(video.id)}
                                disabled={editSaving}
                              >
                                {editSaving ? 'Saving…' : '💾 Save Changes'}
                              </button>
                              <button className="btn-manage-cancel" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ====== MESSAGES TAB ====== */}
          {activeTab === 'messages' && (
            <>
              <h1>Messages / Reports</h1>
              <p>All DMCA and contact submissions from users.</p>
              {contactsLoading ? (
                <div className="loading-block">Loading messages...</div>
              ) : contacts.length === 0 ? (
                <p className="no-messages">No messages yet.</p>
              ) : (
                <div className="contacts-list">
                  {contacts.map(c => (
                    <div key={c.id} className="contact-card-admin">
                      <div className="contact-header">
                        <span className="contact-name">{c.name}</span>
                        <span className="contact-email">{c.email}</span>
                        <span className="contact-subject">{c.subject}</span>
                        <span className="contact-date">
                          {c.createdAt ? new Date(c.createdAt.seconds ? c.createdAt.toDate() : c.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="contact-message">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
