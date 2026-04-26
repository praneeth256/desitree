import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { uploadVideo } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const initialForm = {
  title: '',
  description: '',
  category: 'indian',
  duration: '',
  tags: '',
};

export default function Admin() {
  const [form, setForm] = useState(initialForm);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files[0];
    if (field === 'video') setVideoFile(file);
    if (field === 'thumbnail') setThumbnailFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!videoFile) {
      setMessage('Please select a video file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('duration', form.duration);
      formData.append('tags', form.tags);
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      await uploadVideo(formData);
      setMessage('Video uploaded successfully!');
      setForm(initialForm);
      setVideoFile(null);
      setThumbnailFile(null);
    } catch {
      setMessage('Upload failed. Please check your authentication and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null; // or a loading spinner
  }

  return (
    <>
      <Navigation search={searchTerm} onSearch={setSearchTerm} showAdmin={true} />
      <main className="admin-page">
        <div className="admin-panel">
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
              Duration (e.g. 42:18)
              <input value={form.duration} onChange={handleChange('duration')} placeholder="42:18" />
            </label>
            <label>
              Video File
              <input type="file" accept="video/*" onChange={handleFileChange('video')} required />
            </label>
            <label>
              Thumbnail Image (optional)
              <input type="file" accept="image/*" onChange={handleFileChange('thumbnail')} />
            </label>
            <label>
              Tags (comma separated)
              <input value={form.tags} onChange={handleChange('tags')} placeholder="JavaScript, Programming" />
            </label>
            <button className="btn-premium" type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
            {message && <div className="admin-message">{message}</div>}
          </form>
        </div>
      </main>
    </>
  );
}
