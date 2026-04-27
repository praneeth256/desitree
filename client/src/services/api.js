import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

// Cloudinary upload function
export async function uploadToCloudinary(file, title, description, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'desitree_videos'); // You'll need to create this preset in Cloudinary
  formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload to Cloudinary failed');
  }

  const data = await response.json();

  // Save video metadata to Firestore
  const videoData = {
    title,
    description,
    category,
    videoUrl: data.secure_url,
    thumbnailUrl: data.thumbnail_url || data.secure_url.replace('.mp4', '.jpg'),
    duration: data.duration,
    views: 0,
    likes: 0,
    comments: [],
    uploadedAt: new Date(),
    uploadedBy: auth.currentUser?.email || 'admin'
  };

  const docRef = await addDoc(collection(db, 'videos'), videoData);
  return { id: docRef.id, ...videoData };
}

export async function fetchVideos(category = null) {
  let q;
  if (category && category !== 'All') {
    q = query(collection(db, 'videos'), where('category', '==', category), orderBy('uploadedAt', 'desc'));
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
    const currentLikes = docSnap.data().likes || 0;
    await updateDoc(docRef, {
      likes: currentLikes + 1
    });
  }
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
  const response = await fetch(`${BASE_URL}/api/videos/${id}/comments`);
  if (!response.ok) throw new Error('Unable to fetch comments');
  return response.json();
}
