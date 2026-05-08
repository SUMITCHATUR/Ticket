# 🚀 Project Deployment Guide

## 📋 Prerequisites
- ✅ Code pushed to GitHub (Done!)
- GitHub Repo: https://github.com/SUMITCHATUR/Ticket

---

## 🎯 Frontend Deployment (Vercel)

### Step 1: Sign up on Vercel
1. Go to **vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your **Ticket** repository
3. Click **"Import"**

### Step 3: Configure Settings
1. **Framework Preset**: Vercel will auto-detect React
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your frontend will be live at: `https://your-project-name.vercel.app`

---

## 🎯 Backend Deployment (Render)

### Step 1: Sign up on Render
1. Go to **render.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Render to access your GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Find your **Ticket** repository
3. Click **"Connect"**

### Step 3: Configure Settings
1. **Name**: `ticket-backend`
2. **Root Directory**: `backend`
3. **Runtime**: `Python 3`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `python main.py`
6. **Instance Type**: `Free`

### Step 4: Environment Variables
Add these environment variables:
```
DATABASE_URL=sqlite:///./ticket.db
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your backend will be live at: `https://your-project-name.onrender.com`

---

## 🔧 Important Configuration

### Update Frontend API URL
After backend deployment, update frontend API URL:

1. Go to `frontend/src/services/api.js`
2. Change backend URL to your Render URL:
```javascript
const API_BASE_URL = 'https://your-backend-name.onrender.com';
```

### CORS Configuration
Backend already configured for CORS, but if needed:
- Your Render URL will be automatically added to allowed origins

---

## 🌐 Final URLs Structure

**Frontend**: `https://your-ticket-app.vercel.app`
**Backend**: `https://your-ticket-backend.onrender.com`
**API Docs**: `https://your-ticket-backend.onrender.com/docs`

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Vercel**: No limits on projects
- **Render**: Free tier sleeps after 15min inactivity
  - Wakes up on next request (takes 30-60 seconds)
  - Limited to 750 hours/month

### Database
- SQLite database included in repository
- For production, consider PostgreSQL (available on Render free tier)

### Custom Domain (Optional)
- Both Vercel and Render support custom domains
- Free SSL certificates included

---

## 🔄 Auto-Deploy Setup

### Frontend (Vercel)
- Auto-deploys on every push to main branch
- No configuration needed

### Backend (Render)
- Auto-deploys on every push to main branch
- No configuration needed

---

## 🛠️ Troubleshooting

### Common Issues
1. **Backend not starting**: Check logs in Render dashboard
2. **CORS errors**: Verify frontend URL added to backend CORS
3. **Database issues**: Ensure database file is committed to repo

### Getting Help
- Vercel docs: vercel.com/docs
- Render docs: render.com/docs
- GitHub issues: Check your repository Actions tab

---

## 🎉 Deployment Complete!

Once both services are deployed:
1. Test your frontend at Vercel URL
2. Test backend API at Render URL + `/docs`
3. Verify all features work correctly

Your ticket booking system is now live! 🎊
