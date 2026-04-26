# Custom Domain Deployment Guide - desitree.in

Complete steps to deploy DesiTree to your custom domain `desitree.in`.

## 🎯 Overview

After purchasing `desitree.in`, you'll:
1. Point the domain to your hosting services (Railway & Vercel)
2. Configure DNS records
3. Set up SSL/HTTPS (automatic with Vercel & Railway)
4. Update environment variables

---

## 📝 Step 1: Purchase Domain `desitree.in`

### Popular Domain Registrars:
- **GoDaddy** (godaddy.com) - Easy for beginners
- **Namecheap** (namecheap.com) - Affordable & reliable
- **Google Domains** (domains.google.com) - Simple interface
- **.in Registry** (registry.in) - Official India domain registrar
- **Hostinger** (hostinger.com) - Good pricing

### After Purchase:
- You'll get access to your registrar's control panel
- You can manage DNS records from there
- Keep your registrar login handy

---

## 🔗 Step 2: Deploy Backend to Railway with Custom Domain

### Deploy on Railway:
1. Go to [railway.app](https://railway.app)
2. Create project → Deploy from GitHub → Select DesiTree
3. Set all environment variables (MONGO_URI, CLOUDINARY keys, etc.)
4. Click Deploy

### Assign Custom Domain to Railway:
1. In Railway dashboard, go to your **DesiTree project**
2. Click **Settings** → **Domains**
3. Click **+ Add Domain**
4. Enter: `api.desitree.in` (or `backend.desitree.in`)
5. Click **Add Domain**
6. Railway shows you **DNS records** to add

### Add DNS Records to Your Registrar:
1. Go to your domain registrar control panel (GoDaddy, Namecheap, etc.)
2. Find **DNS Management** or **DNS Settings**
3. Railway will give you records like:
   ```
   Type: CNAME
   Name: api
   Value: cname.railway.app
   ```
4. Add this record to your registrar
5. Wait 15 minutes - 48 hours for DNS to propagate
6. Test: Visit `https://api.desitree.in` in browser (you should see JSON response)

### Update Environment Variables:
- In Railway Dashboard → Variables
- Change backend URL from `https://desitree-backend.railway.app` to `https://api.desitree.in`
- Redeploy

---

## 🌐 Step 3: Deploy Frontend to Vercel with Custom Domain

### Deploy on Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository → Select DesiTree
3. Root directory: `client/`
4. Deploy

### Assign Custom Domain to Vercel:
1. In Vercel dashboard, go to **DesiTree** project
2. Click **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `desitree.in` (main domain)
5. Click **Add** and choose "Add Domain"

### Option A: Point Domain Directly to Vercel (Recommended)

Vercel will show you **nameservers** to use:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
ns3.vercel-dns.com
ns4.vercel-dns.com
```

1. Go to your registrar control panel
2. Find **Nameservers** settings
3. Replace default nameservers with Vercel's nameservers
4. Save changes
5. Wait 24-48 hours for propagation

**Advantage**: Vercel manages all DNS automatically, including SSL

### Option B: Use CNAME Records (Alternative)

If your registrar doesn't allow full nameserver changes:
1. In Vercel, copy the **CNAME** value
2. In your registrar DNS settings, add:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. For `desitree.in` (without www), you may need:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19  (use Vercel's A record)
   ```
   
**Note**: Some registrars handle this differently. Check their documentation.

### Add www Subdomain:
In Vercel, add both:
- `desitree.in` (main)
- `www.desitree.in` (www subdomain)

---

## 📋 Step 4: Update Application Environment Variables

### For Backend (Railway):
1. Go to Railway Dashboard → DesiTree project → Variables
2. Update:
   ```
   FRONTEND_URL=https://desitree.in
   ```
3. Redeploy

### For Frontend (Vercel):
1. Go to Vercel Dashboard → DesiTree project → Settings → Environment Variables
2. Update:
   ```
   VITE_API_BASE=https://api.desitree.in
   ```
3. Redeploy

---

## 🔒 Step 5: SSL/HTTPS Certificate (Automatic)

✅ **Good news**: Both Vercel and Railway automatically provide free SSL certificates from Let's Encrypt.

- Your site will automatically redirect HTTP → HTTPS
- Certificates auto-renew every 90 days
- No manual configuration needed!

---

## ✅ Complete DNS Configuration Example

Once everything is set up, your DNS records should look like:

| Type | Name | Value |
|------|------|-------|
| NS | @ | ns1.vercel-dns.com |
| NS | @ | ns2.vercel-dns.com |
| NS | @ | ns3.vercel-dns.com |
| NS | @ | ns4.vercel-dns.com |
| CNAME | api | cname.railway.app |
| CNAME | www | cname.vercel-dns.com |
| A | @ | 76.76.19.19 |

(Exact values depend on your providers)

---

## 🧪 Step 6: Test Your Deployment

### Test Backend:
```bash
# Should return JSON
curl https://api.desitree.in
```

### Test Frontend:
1. Open https://desitree.in in browser
2. Should load your DesiTree app
3. Check browser console for any errors
4. Try uploading a video (as admin)
5. Try playing a video
6. Check Network tab in DevTools - API calls should go to `api.desitree.in`

### Verify SSL Certificate:
- Click the lock icon in browser address bar
- Should show "Secure" and "Issued by Let's Encrypt"

---

## 🚨 Common Issues & Fixes

### Issue: DNS records not propagating
**Fix**: Wait 24-48 hours. Check status at [whatsmydns.net](https://whatsmydns.net)

### Issue: "ERR_NAME_NOT_RESOLVED"
**Fix**: DNS hasn't propagated yet. Clear browser cache and try again.

### Issue: Mixed Content Warning (HTTPS/HTTP)
**Fix**: Ensure `VITE_API_BASE=https://api.desitree.in` (not http)

### Issue: "CORS error" after domain change
**Fix**: Update `FRONTEND_URL=https://desitree.in` in Railway variables and redeploy

### Issue: Vercel says domain already in use
**Fix**: Remove from any other Vercel projects first, then add to DesiTree

### Issue: Railway domain shows "No deployment"
**Fix**: Ensure your GitHub repo is connected and latest commit is deployed

---

## 🔄 Additional Subdomains (Optional)

Want separate subdomains for different services?

```
desitree.in          → Frontend (Vercel)
api.desitree.in      → Backend API (Railway)
admin.desitree.in    → Admin panel (optional separate app)
cdn.desitree.in      → CDN/static files (optional)
```

For each subdomain:
1. Add CNAME record in DNS
2. Add domain in respective platform (Railway/Vercel)
3. Point to the service

---

## 📊 Domain Configuration Checklist

- [ ] Domain purchased (desitree.in)
- [ ] Registrar account created
- [ ] Railway project deployed
- [ ] Vercel project deployed
- [ ] `api.desitree.in` added to Railway
- [ ] `desitree.in` & `www.desitree.in` added to Vercel
- [ ] DNS records added to registrar
- [ ] DNS propagation verified (wait 24-48h)
- [ ] Frontend environment variable updated
- [ ] Backend environment variable updated
- [ ] Both projects redeployed
- [ ] Frontend loads at desitree.in
- [ ] API responds at api.desitree.in
- [ ] HTTPS working (green lock in browser)

---

## 🎉 You're Live on desitree.in!

Your DesiTree app is now:
- ✅ Live on your custom domain
- ✅ Globally accessible
- ✅ Secure with HTTPS
- ✅ Auto-scaling (Railway & Vercel handle traffic)
- ✅ Production-ready

**Share your domain**: https://desitree.in 🚀

---

## 💡 Pro Tips

1. **Set up email forwarding** (many registrars offer free)
   - contact@desitree.in → your-email@gmail.com

2. **Monitor uptime** with [UptimeRobot](https://uptimerobot.com) (free)

3. **Enable analytics**:
   - Vercel → Analytics (built-in)
   - Railway → Metrics (built-in)

4. **Add a subdomain for admin**:
   - admin.desitree.in → separate Vercel deployment
   - Better security than mixing with public site

5. **Backup MongoDB regularly**:
   - MongoDB Atlas → Snapshots → Enable automated snapshots

---

**Questions?** Check registrar docs or Railway/Vercel support docs.
