require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const videoRoutes = require('./routes/videos');
const { router: authRoutes, auth, adminAuth } = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    
    // Allow the configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    
    // In production, allow all origins for maximum compatibility
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Session middleware for passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use('/api/videos', videoRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send({ status: 'DesiTree backend is running' });
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/desitree';

mongoose
  .connect(MONGO_URI, {
    // Removed deprecated options
  })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
