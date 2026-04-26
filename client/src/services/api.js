const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

export async function fetchVideos() {
  const response = await fetch(`${BASE_URL}/api/videos`);
  if (!response.ok) throw new Error('Unable to fetch videos');
  return response.json();
}

export async function fetchVideoById(id) {
  const response = await fetch(`${BASE_URL}/api/videos/${id}`);
  if (!response.ok) throw new Error('Unable to fetch video');
  return response.json();
}

export async function incrementVideoViews(id) {
  const response = await fetch(`${BASE_URL}/api/videos/${id}/views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Unable to update views');
  return response.json();
}

export async function uploadVideo(formData) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/videos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
}

export async function deleteVideo(id) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/videos/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Delete failed');
  return response.json();
}

export async function likeVideo(id) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/videos/${id}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Like failed');
  return response.json();
}

export async function addComment(id, text) {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/videos/${id}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Comment failed');
  return response.json();
}

export async function fetchComments(id) {
  const response = await fetch(`${BASE_URL}/api/videos/${id}/comments`);
  if (!response.ok) throw new Error('Unable to fetch comments');
  return response.json();
}
