## DesiTree Deployment to desitree.in - Progress Tracker

### ✅ Completed:
- [x] GitHub repo: https://github.com/praneeth256/desitree
- [x] Frontend deployed to Vercel: https://desitree4-orcin.vercel.app
- [x] Latest code pushed (003aea4)

### ⏳ In Progress / Next Steps:
1. **Railway Backend Deployment**
   - Create Railway project from GitHub repo
   - Add environment variables:
     ```
     NODE_ENV=production
     MONGO_URI=your_mongodb_atlas_uri
     JWT_SECRET=your_jwt_secret
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     FRONTEND_URL=https://desitree.in
     ```
   - Note Railway deploy URL (e.g., https://desitree-backend.railway.app)
   - Add domain `api.desitree.in` in Railway Settings → Domains
   - Copy CNAME record (e.g., api → cname.railway.app)

2. **Vercel Environment Variable**
   - Project Settings → Environment Variables
   - Add: `VITE_API_BASE=https://api.desitree.in` (or temp Railway URL)
   - Redeploy

3. **GoDaddy DNS Configuration**
   - Login GoDaddy → desitree.in → DNS Management
   - **Change Nameservers** to:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ns3.vercel-dns.com
     ns4.vercel-dns.com
     ```
   - **Add Record**:
     ```
     Type: CNAME | Name: api | Value: cname.railway.app | TTL: 1 Hour
     ```
   - Save (propagation 24-48 hours)

4. **Add Custom Domain to Vercel**
   - Project Settings → Domains → Add `desitree.in` and `www.desitree.in`
   - Verify (Invalid? Wait for nameservers)

5. **Final Updates**
   - Railway: Update FRONTEND_URL=https://desitree.in, redeploy
   - Vercel: Confirm VITE_API_BASE=https://api.desitree.in, redeploy

6. **Verification**
   ```
   # Run after 24h:
   nslookup desitree.in
   nslookup api.desitree.in
   curl https://desitree.in
   curl https://api.desitree.in
   # Use: https://whatsmydns.net/#A/desitree.in
   ```

### 🔍 Current Status Check:
- Vercel preview: https://desitree4-orcin.vercel.app (test functionality)
- Backend: Pending Railway
- Domain: Pending DNS

### ✅ Backend: Firebase + Cloudinary (No Railway/Server needed!)
- Uploads to Cloudinary (needs VITE_CLOUDINARY_CLOUD_NAME)
- Data in Firestore (needs Firebase env vars)
- Auth: Firebase Anonymous + Google OAuth?

### ⏳ Remaining Steps:
1. **Vercel Env Vars** (add to https://vercel.com dashboard):
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```
   Redeploy after adding.

2. **GoDaddy DNS** (key for custom domain):
   - Login → desitree.in → DNS → Nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ns3.vercel-dns.com
     ns4.vercel-dns.com
     ```
   - Propagation: 24-48h

3. **Vercel Custom Domain**:
   - Settings → Domains → Add `desitree.in` & `www.desitree.in`

4. **Verify** (after DNS):
   ```
   nslookup desitree.in
   Visit https://desitree.in
   Test: Upload video (needs Cloudinary preset 'desitree_videos')
   ```

### 📋 Firebase Setup (if needed):
- Create project at console.firebase.google.com
- Enable Firestore, Auth (Anonymous, Google)
- Add web app, copy config to Vercel env
- firestore.rules updated
