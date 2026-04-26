const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  name: { type: String, required: true },
  googleId: { type: String, required: false, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);