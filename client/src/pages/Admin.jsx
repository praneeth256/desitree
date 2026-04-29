import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { uploadToCloudinary, fetchContacts } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const initialForm = {
  title: '',
  description: '',
  category: 'indian',
};

const TABS = [
  { key: 'upload', label: 'Upload Video' },
  { key: 'messages', label: 'Messages / Reports' },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('upload');
  const [form, setForm] = useState(initialForm);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'messages') {
      loadContacts();
    }
  }, [activeTab]);

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setVideoFile(file);
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files[0];
    setThumbnailFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!videoFile) {
      setMessage('Please select a video file');
      return;
    }

    setIsUploading(true);
    try {
      await uploadToCloudinary(videoFile, form.title, form.description, form.category, thumbnailFile);
      setMessage('Video uploaded successfully!');
      setForm(initialForm);
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error) {
      setMessage('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={true} />
      <main className="admin-page">
        <div className="admin-panel">
          <div className="admin-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'admin-tab active' : 'admin-tab'}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'upload' && (
            <>
              <h1>Admin Upload</h1>
              <p>Upload video files to DesiTree. Videos will be stored on Cloudinary.</p>
              <form className="admin-form" onSubmit={handleSubmit}>
                <label>
                  Title
                  <input value={form.title} onChange={handleChange('title')} required />
                </label>
                <label>
                  Description
                  <textarea value={form.description} onChange={handleChange('description')} rows="4" />
                </label>
                <label>
                  Category
                  <select value={form.category} onChange={handleChange('category')} required>
                    <option value="indian">Indian</option>
                    <option value="nri">NRI</option>
                    <option value="videsi">Videsi</option>
                  </select>
                </label>
                <label>
                  Video File
                  <input type="file" accept="video/*" onChange={handleFileChange} required />
                </label>
                <label>
                  Thumbnail (optional)
                  <input type="file" accept="image/*" onChange={handleThumbnailChange} />
                </label>
                <button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </form>
              {message && <p className="message">{message}</p>}
            </>
          )}

          {activeTab === 'messages' && (
            <>
              <h1>Messages / Reports</h1>
              <button className="btn btn-ghost admin-logout" onClick={logout}>
                Logout
              </button>
              <p>All DMCA and contact submissions from users.</p>
              {contactsLoading ? (
                <div className="loading-block">Loading messages...</div>
              ) : contacts.length === 0 ? (
                <p className="no-messages">No messages yet.</p>
              ) : (
                <div className="contacts-list">
                  {contacts.map((c) => (
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
