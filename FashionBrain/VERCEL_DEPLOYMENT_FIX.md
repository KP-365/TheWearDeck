# 🚨 Vercel Deployment Fix - Sign In Issues

## Problem
If you deployed both frontend AND backend on Vercel, sign-in will fail because:
- Vercel serverless functions timeout after 10 seconds
- Your backend needs long-running processes (CLIP embeddings, file uploads)
- Backend must run on Render/Railway instead

## ✅ Correct Setup

### Frontend → Vercel
### Backend → Render (or Railway)

## Step-by-Step Fix

### 1. Deploy Backend on Render (if not already)

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: `fashionbrain-backend`
   - **Root Directory**: `.` (root of repo)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Environment**: `Python 3`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
6. Deploy and copy the URL (e.g., `https://fashionbrain-backend.onrender.com`)

### 2. Configure Vercel Frontend

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://your-backend.onrender.com` (your Render URL)
   - **Environment**: Production, Preview, Development
4. **IMPORTANT**: Redeploy after adding the variable
   - Go to **Deployments** tab
   - Click **...** on latest deployment → **Redeploy**

### 3. Verify It Works

1. Open your Vercel frontend URL
2. Open browser console (F12)
3. Try to sign in
4. Check console logs:
   - Should see: `✅ Using VITE_API_BASE: https://your-backend.onrender.com`
   - If you see: `⚠️ CRITICAL: VITE_API_BASE environment variable is not set!`
     → The env var isn't set or deployment needs refresh

## Quick Test

Open browser console and type:
```javascript
console.log('API URL:', window.location.origin);
```

Then check Network tab when signing in - requests should go to your Render URL, not Vercel.

## Still Having Issues?

1. **Check Render backend is running**
   - Go to Render dashboard
   - Verify service shows "Live"
   - Check logs for errors

2. **Check Vercel environment variable**
   - Make sure `VITE_API_BASE` is set
   - Value should NOT have trailing slash
   - Redeploy after adding

3. **Check CORS**
   - Backend should allow all origins: `allow_origins=["*"]`
   - Already configured in `app.py`

4. **Check browser console**
   - Look for specific error messages
   - Network tab shows failed requests

