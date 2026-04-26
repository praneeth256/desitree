const express = require('express');
const Video = require('../models/Video');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { auth, adminAuth } = require('./auth');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload video and thumbnail (Admin only)
router.post('/upload', auth, adminAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
    console.log('Body:', req.body);

    const { title, description, category, duration, tags } = req.body;

    let videoUrl = '';
    let thumbnailUrl = '';
    let previewUrl = '';
    let videoDuration = 0;

    // Upload video to Cloudinary
    if (req.files.video) {
      console.log('Uploading video file, size:', req.files.video[0].size);
      try {
        const videoResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'desitree/videos',
              public_id: `video_${Date.now()}`,
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary video upload error:', error);
                reject(error);
              } else {
                console.log('Video uploaded successfully:', result.secure_url);
                console.log('Video duration from Cloudinary:', result.duration);
                resolve(result);
              }
            }
          );
          uploadStream.end(req.files.video[0].buffer);
        });
        videoUrl = videoResult.secure_url;
        previewUrl = videoResult.secure_url;
        // Extract duration from Cloudinary metadata
        videoDuration = videoResult.duration || 0;
        console.log('Final video duration:', videoDuration);
      } catch (videoError) {
        console.error('Video upload failed:', videoError);
        return res.status(500).json({ error: 'Video upload failed', details: videoError.message });
      }
    }

    // Upload thumbnail to Cloudinary
    if (req.files.thumbnail) {
      console.log('Uploading thumbnail file, size:', req.files.thumbnail[0].size);
      try {
        const thumbnailResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'desitree/thumbnails',
              public_id: `thumb_${Date.now()}`,
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary thumbnail upload error:', error);
                reject(error);
              } else {
                console.log('Thumbnail uploaded successfully:', result.secure_url);
                resolve(result);
              }
            }
          );
          uploadStream.end(req.files.thumbnail[0].buffer);
        });
        thumbnailUrl = thumbnailResult.secure_url;
      } catch (thumbError) {
        console.error('Thumbnail upload failed:', thumbError);
        return res.status(500).json({ error: 'Thumbnail upload failed', details: thumbError.message });
      }
    }

    const video = new Video({
      title,
      description,
      category,
      duration: videoDuration || parseInt(duration) || 0,
      thumbnailUrl,
      previewUrl,
      videoUrl,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error('Upload error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch videos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch video' });
  }
});

router.post('/', async (req, res) => {
  try {
    const video = new Video(req.body);
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create video' });
  }
});

router.post('/:id/views', async (req, res) => {
  try {
    console.log('Update views for video:', req.params.id);
    const video = await Video.findById(req.params.id);
    if (!video) {
      console.log('Video not found:', req.params.id);
      return res.status(404).json({ error: 'Video not found' });
    }
    video.views += 1;
    await video.save();
    console.log('Views updated:', video.views);
    res.json({ views: video.views });
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({ error: 'Unable to update view count', details: error.message });
  }
});

// Delete video (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete video' });
  }
});

// Like/Unlike video
router.post('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const userId = req.user.userId;
    const likeIndex = video.likedBy.indexOf(userId);

    if (likeIndex > -1) {
      video.likedBy.splice(likeIndex, 1);
      video.likes -= 1;
    } else {
      video.likedBy.push(userId);
      video.likes += 1;
    }

    await video.save();
    res.json({ likes: video.likes, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update likes' });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const comment = {
      userId: req.user.userId,
      userName: req.user.name || 'Anonymous',
      text,
      createdAt: new Date(),
    };

    video.comments.push(comment);
    await video.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add comment' });
  }
});

// Get comments
router.get('/:id/comments', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch comments' });
  }
});

module.exports = router;
