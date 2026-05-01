import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth();

async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

// Cloudinary upload function
export async function uploadToCloudinary(file, title, description, category, thumbnailFile = null, onProgress = null, frameDataUrl = null) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is missing. Please set VITE_CLOUDINARY_CLOUD_NAME in your Vercel environment variables.');
  }

  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks — stays well under limits
  const useChunked = file.size > 90 * 1024 * 1024; // chunk anything over 90MB

  let data;

  if (useChunked) {
    // ── Chunked upload for large files ──────────────────────────────
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let publicId = null;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end   = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const chunkForm = new FormData();
      chunkForm.append('file', chunk);
      chunkForm.append('upload_preset', 'desitree_videos');
      if (publicId) chunkForm.append('public_id', publicId);

      const rangeHeader = `bytes ${start}-${end - 1}/${file.size}`;

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        headers: { 'X-Unique-Upload-Id': `dt-${Date.now()}`, 'Content-Range': rangeHeader },
        body: chunkForm,
      });

      // 200 = done, 206 = chunk accepted, keep going
      if (res.status === 200) {
        data = await res.json();
        if (onProgress) onProgress(100);
        break;
      } else if (res.status === 206) {
        const partial = await res.json().catch(() => ({}));
        if (partial.public_id) publicId = partial.public_id;
        if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 95));
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Chunk upload failed at chunk ${i + 1}: ${err?.error?.message || res.status}`);
      }
    }

    if (!data) throw new Error('Chunked upload did not complete — no final response received.');
  } else {
    // ── Standard upload for files under 90MB ───────────────────────
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'desitree_videos');

    if (onProgress) onProgress(10);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown Cloudinary error' } }));
      throw new Error(`Cloudinary upload failed: ${errorData?.error?.message || JSON.stringify(errorData)}`);
    }

    data = await response.json();
    if (onProgress) onProgress(90);
  }

  let thumbnailUrl = data.thumbnail_url || data.secure_url.replace('.mp4', '.jpg');

  // Upload thumbnail: prefer file, then frame capture, else use Cloudinary auto-thumb
  const thumbSource = thumbnailFile || (frameDataUrl ? dataUrlToBlob(frameDataUrl) : null);
  if (thumbSource) {
    const thumbFormData = new FormData();
    thumbFormData.append('file', thumbSource);
    thumbFormData.append('upload_preset', 'desitree_videos');
    try {
      const thumbResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: thumbFormData,
      });
      if (thumbResponse.ok) {
        const thumbData = await thumbResponse.json();
        thumbnailUrl = thumbData.secure_url;
      }
    } catch (e) { console.warn('Thumbnail upload failed, using auto:', e); }
  }

  // Save video metadata to Firestore
  const videoData = {
    title,
    description,
    category,
    videoUrl: data.secure_url,
    thumbnailUrl,
    duration: data.duration,
    views: 0,
    likes: 0,
    likedBy: [],
    comments: [],
    uploadedAt: new Date(),
    uploadedBy: auth.currentUser?.email || 'admin'
  };

  const docRef = await addDoc(collection(db, 'videos'), videoData);
  return { id: docRef.id, ...videoData };
}

export async function fetchVideos(category = null) {
  let q;
  const specialFilters = ['most-viewed', 'most-liked'];
  if (category && category !== 'All' && !specialFilters.includes(category)) {
    // Firestore composite index not required when we don't use orderBy with where
    q = query(collection(db, 'videos'), where('category', '==', category));
  } else {
    q = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
  }

  const querySnapshot = await getDocs(q);
  const videos = [];
  querySnapshot.forEach((doc) => {
    videos.push({ id: doc.id, ...doc.data() });
  });
  return videos;
}

export async function fetchVideoById(id) {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error('Video not found');
  }
}

export async function incrementVideoViews(id) {
  await ensureAuth();

  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const currentViews = docSnap.data().views || 0;
    await updateDoc(docRef, { views: currentViews + 1 });
  }
}

export async function deleteVideo(id) {
  await deleteDoc(doc(db, 'videos', id));
}

export async function updateVideoMetadata(id, { title, description, category, thumbnailFile }) {
  const docRef = doc(db, 'videos', id);
  const updates = { title, description, category };

  if (thumbnailFile) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const formData = new FormData();
    formData.append('file', thumbnailFile);
    formData.append('upload_preset', 'desitree_videos');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Thumbnail upload failed');
    const data = await res.json();
    updates.thumbnailUrl = data.secure_url;
  }

  await updateDoc(docRef, updates);
  return updates;
}

export async function likeVideo(id) {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const currentLikes = data.likes || 0;
    const likedBy = data.likedBy || [];
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const alreadyLiked = likedBy.includes(userId);
    let newLikes;
    let newLikedBy;

    if (alreadyLiked) {
      newLikes = Math.max(0, currentLikes - 1);
      newLikedBy = likedBy.filter((uid) => uid !== userId);
    } else {
      newLikes = currentLikes + 1;
      newLikedBy = [...likedBy, userId];
    }

    await updateDoc(docRef, {
      likes: newLikes,
      likedBy: newLikedBy
    });

    return { likes: newLikes, liked: !alreadyLiked };
  }

  throw new Error('Video not found');
}

export async function addComment(id, text, parentCommentId = null) {
  await ensureAuth();
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentComments = docSnap.data().comments || [];

    // Use admin name if admin, else generate random name
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const isAdmin = auth.currentUser?.email === adminEmail;

    let userName;
    if (isAdmin) {
      userName = 'DesiTree Admin';
    } else {
      const adjectives = ['Quick', 'Shadow', 'Silent', 'Night', 'Mystery', 'Phantom', 'Star', 'Cloud', 'Void', 'Moon', 'Frost', 'Neon', 'Code', 'Pixel', 'Byte', 'Dark', 'Storm', 'Ice', 'Fire', 'Ghost'];
      const nouns = ['Ninja', 'Fox', 'Walker', 'Ghost', 'Owl', 'User', 'Viewer', 'Pilot', 'Gazer', 'Drifter', 'Coder', 'Spectre', 'Phantom', 'Byte', 'Pixel', 'Ninja', 'Coder', 'Pixel', 'Byte', 'Spectre'];
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      userName = `${adj}${noun}${randomNum}`;
    }

    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      userName,
      isAdmin,
      parentCommentId,
      timestamp: new Date()
    };
    await updateDoc(docRef, {
      comments: [...currentComments, newComment]
    });
    return newComment;
  }
  throw new Error('Video not found');
}

export function subscribeToComments(videoId, callback) {
  const docRef = doc(db, 'videos', videoId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().comments || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Comments snapshot error:', error);
    callback([]);
  });
}

export async function fetchComments(id) {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().comments || [];
  }
  return [];
}

export async function submitContactForm({ name, email, subject, message }) {
  await ensureAuth();
  const contactData = {
    name,
    email,
    subject,
    message,
    createdAt: new Date()
  };
  const docRef = await addDoc(collection(db, 'contacts'), contactData);
  return { id: docRef.id, ...contactData };
}

export function subscribeToVideos(category, callback) {
  let q;
  const specialFilters = ['most-viewed', 'most-liked'];
  if (category && category !== 'All' && !specialFilters.includes(category)) {
    q = query(collection(db, 'videos'), where('category', '==', category));
  } else {
    q = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const videos = [];
    querySnapshot.forEach((doc) => {
      videos.push({ id: doc.id, ...doc.data() });
    });
    callback(videos);
  }, (error) => {
    console.error('Snapshot error:', error);
    callback([]);
  });
}

export async function fetchContacts() {
  const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  const contacts = [];
  querySnapshot.forEach((doc) => {
    contacts.push({ id: doc.id, ...doc.data() });
  });
  return contacts;
}

// Convert base64 dataURL to Blob for upload
function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
