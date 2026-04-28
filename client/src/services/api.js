import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

// Cloudinary upload function
export async function uploadToCloudinary(file, title, description, category, thumbnailFile = null) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is missing. Please set VITE_CLOUDINARY_CLOUD_NAME in your Vercel environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'desitree_videos'); // Must be an unsigned preset in Cloudinary

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown Cloudinary error' } }));
    const errorMessage = errorData?.error?.message || JSON.stringify(errorData);
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }

  const data = await response.json();

  let thumbnailUrl = data.thumbnail_url || data.secure_url.replace('.mp4', '.jpg');

  // Upload custom thumbnail if provided
  if (thumbnailFile) {
    const thumbFormData = new FormData();
    thumbFormData.append('file', thumbnailFile);
    thumbFormData.append('upload_preset', 'desitree_videos');

    const thumbResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: thumbFormData,
    });

    if (thumbResponse.ok) {
      const thumbData = await thumbResponse.json();
      thumbnailUrl = thumbData.secure_url;
    }
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
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentViews = docSnap.data().views || 0;
    await updateDoc(docRef, {
      views: currentViews + 1
    });
  }
}

export async function deleteVideo(id) {
  await deleteDoc(doc(db, 'videos', id));
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

export async function addComment(id, text) {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentComments = docSnap.data().comments || [];
    const newComment = {
      text,
      user: auth.currentUser?.email || 'Anonymous',
      timestamp: new Date()
    };
    await updateDoc(docRef, {
      comments: [...currentComments, newComment]
    });
  }
}

export async function fetchComments(id) {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().comments || [];
  }
  return [];
}

