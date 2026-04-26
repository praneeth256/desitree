# DesiTree Video Platform - Deployment Guide

## ⚡ Global Hosting Setup

Your app is now ready for **worldwide deployment** on **Railway** (backend) and **Vercel** (frontend).

### 🚀 Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up (free tier available)
2. Create a new project → Select "Deploy from GitHub"
3. Connect your GitHub account and select the DesiTree repository
4. Railway will auto-detect the Node.js backend
5. In **Variables**, add your environment variables:
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...  (MongoDB Atlas URI)
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_secret
   FRONTEND_URL=https://desitree.vercel.app (add after frontend deployment)
   ```
6. Click **Deploy** → Railway generates a public URL (e.g., `https://desitree-backend.railway.app`)
7. Copy this URL for the frontend configuration

### 🚀 Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free tier available)
2. Click **Add New Project** → Import Git Repository
3. Select the DesiTree repo
4. **Root Directory**: `client/`
5. **Framework Preset**: Vite
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Add **Environment Variables**:
   ```
   VITE_API_BASE=https://desitree-backend.railway.app
   ```
   (Replace with your actual Railway backend URL)
9. Click **Deploy** → Vercel generates a public URL (e.g., `https://desitree.vercel.app`)

### 🔗 Step 3: Connect Backend & Frontend

1. Go back to **Railway Dashboard**
2. Add/update the **FRONTEND_URL** variable:
   ```
   FRONTEND_URL=https://desitree.vercel.app
   ```
3. Redeploy the backend by pushing a new commit or clicking the redeploy button

### 🗄️ Step 4: Set Up MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create a free cluster
3. Add a Database User with username/password
4. Get the connection string (should look like: `mongodb+srv://user:pass@cluster.mongodb.net/desitree`)
5. Add to Railway's **MONGO_URI** variable
6. Whitelist your IP (or allow all: `0.0.0.0/0`)

### 🔐 Step 5: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (OAuth consent screen):
   - **Authorized JavaScript origins**: `https://desitree.vercel.app`
   - **Authorized redirect URIs**: 
     - `https://desitree-backend.railway.app/api/auth/google/callback`
     - `https://desitree.vercel.app/auth/callback`
5. Copy **Client ID** and **Client Secret** to Railway variables

### 📝 Step 6: Update API URLs (if needed)

Frontend automatically reads from `VITE_API_BASE` environment variable.

If needed, update `client/src/services/api.js`:
```javascript
const BASE_URL = import.meta.env.VITE_API_BASE || 'https://desitree-backend.railway.app';
```

### ✅ Verification

After deployment:
1. Visit your Vercel frontend URL: `https://desitree.vercel.app`
2. Test user signup → should create account in MongoDB Atlas
3. Test video upload → should upload to Cloudinary
4. Test video player → should load video and play with controls

### 📊 Monitoring & Scaling

- **Railway**: Dashboard shows logs, CPU/memory usage, and auto-scaling
- **Vercel**: Analytics shows build history, deployment status, and page insights
- **MongoDB Atlas**: Monitor database performance and storage

### 🎉 You're Live!

Your DesiTree platform is now **hosted globally** and accessible from anywhere in the world! 🌍

---

**Note**: Keep your `.env` file with secrets locally. Never commit real credentials to GitHub. Railway and Vercel have secure secret management.
