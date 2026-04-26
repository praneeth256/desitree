# DesiTree - Video Streaming Platform

DesiTree is a React + Vite frontend with a Node.js + Express backend for video streaming, user authentication, and admin management.

## Setup Instructions

### 1. Environment Variables

Update the `server/.env` file with your credentials:

```env
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
