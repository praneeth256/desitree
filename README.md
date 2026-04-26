# DesiTree - Video Streaming Platform

A modern React + Node.js full-stack video streaming platform with admin uploads, user authentication, and global cloud hosting.

## 🎬 Features

✨ User authentication (email/password + Google OAuth 2.0)
🎥 Admin video upload to Cloudinary
🎮 Custom video player (mute, volume, fullscreen, no-download)
📺 Video categories (Indian, NRI, Videsi)
❤️ Likes, comments, and share functionality
🛡️ Admin deletion & moderation
📊 View count tracking
🔒 Download protection

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router DOM
- **Backend**: Node.js, Express 5, Mongoose
- **Database**: MongoDB (Atlas for cloud)
- **Storage**: Cloudinary (video & thumbnails)
- **Authentication**: JWT + Passport.js (Google OAuth 2.0)
- **Cloud Hosting**: Vercel (frontend) + Railway (backend)

## 🚀 Deploy Globally (Railway + Vercel)

### Quick Deployment Steps:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy Backend on Railway** (Free tier available)
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select DesiTree repo
   - Add environment variables (MONGO_URI, CLOUDINARY keys, etc.)
   - Deploy → Get your backend URL (e.g., `https://desitree-backend.railway.app`)

3. **Deploy Frontend on Vercel** (Free tier available)
   - Go to [vercel.com](https://vercel.com)
   - New Project → Import Git repo
   - Root directory: `client/`
   - Add env var: `VITE_API_BASE=<railway-backend-url>`
   - Deploy → Get your frontend URL (e.g., `https://desitree.vercel.app`)

**Full guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Google OAuth credentials

### Setup

1. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Backend (.env)**
   ```
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/desitree
   JWT_SECRET=your_secret
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```

3. **Frontend (.env.local)**
   ```
   VITE_API_BASE=http://localhost:5000
   ```

4. **Start servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

5. **Create admin user**
   ```bash
   cd server && node create-admin.js
   ```

## 📖 API Routes

**Auth**:
- `POST /api/auth/signup` - Register
- `POST /api/auth/signin` - Login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - OAuth callback

**Videos**:
- `GET /api/videos` - List all
- `GET /api/videos/:id` - Get single
- `POST /api/videos/upload` - Upload (admin only)
- `POST /api/videos/:id/views` - Increment views
- `POST /api/videos/:id/like` - Toggle like
- `DELETE /api/videos/:id` - Delete (admin only)
- `POST /api/videos/:id/comments` - Add comment

## 🌍 Custom Domain Deployment

Deploy to your own domain (e.g., `desitree.in`):

1. Purchase domain from any registrar (GoDaddy, Namecheap, etc.)
2. Deploy backend to Railway with subdomain `api.desitree.in`
3. Deploy frontend to Vercel with domain `desitree.in`
4. Update DNS records (CNAME for API, Nameservers for frontend)
5. SSL/HTTPS automatically configured

**Complete guide**: See [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md)

**Quick check**: Run `bash check-domain.sh` after DNS propagates (24-48h)

## 🌍 Now Live Worldwide!

Your DesiTree platform is ready to serve users from anywhere on Earth! 🎉
env
MONGO_URI=mongodb://localhost:27017/desitree
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_secure_random_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Client Secret to your `.env` file

### 3. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add them to your `.env` file

## Run locally

1. **Start the backend:**
   - Open a terminal in `server`
   - Create/update `.env` file with your credentials
   - Run `npm install`
   - Run `node index.js`

2. **Start the frontend:**
   - Open a terminal in `client`
   - Run `npm install`
   - Run `npm run dev`

3. **Create admin user:**
   - In server directory: `node create-admin.js`
   - Admin login: `admin@desitree.com` / `admin123`

## Features

- ✅ **Video Streaming**: Cloudinary-powered video delivery
- ✅ **User Authentication**: Email/password + Google OAuth
- ✅ **Admin Panel**: Secure video upload interface
- ✅ **Responsive Design**: Mobile-friendly layout
- ✅ **Search Functionality**: Find videos by title/tags
- ✅ **Video Categories**: Organized content browsing
- ✅ **View Counting**: Track video popularity
- ✅ **Similar Videos**: Recommendations on player page

## API Endpoints

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos/upload` - Upload video (admin only)
- `POST /api/videos/:id/views` - Increment view count

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - OAuth callback

## Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT, Passport.js, Google OAuth
- **File Storage**: Cloudinary
- **Styling**: Custom CSS with CSS Variables

## Notes

- MongoDB is used for metadata and user management
- Cloudinary handles video storage and streaming
- Google OAuth provides seamless social login
- Admin role required for video uploads
- JWT tokens expire after 7 days
