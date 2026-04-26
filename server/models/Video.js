const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'all' },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  premium: { type: Boolean, default: false },
  thumbnailUrl: { type: String, default: '' },
  previewUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  tags: { type: [String], default: [] },
  likedBy: { type: [String], default: [] },
  comments: [
    {
      userId: String,
      userName: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', VideoSchema);
