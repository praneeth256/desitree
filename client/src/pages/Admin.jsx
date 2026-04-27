import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { uploadToCloudinary } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const initialForm = {
  title: '',
  description: '',
  category: 'indian',
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
        </div>
      </main>
    </>
  );
}

