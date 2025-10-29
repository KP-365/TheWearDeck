## Deploying FashionBrain

### Backend (FastAPI) on Render
1. Push this repo to GitHub.
2. Create a new Web Service in Render, connect the repo.
3. Root directory: project root (contains `app.py`).
4. Build command:
   `pip install -r requirements.txt`
5. Start command:
   `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Environment variables:
   - `SUPABASE_URL`: https://<your-project>.supabase.co
   - `SUPABASE_KEY`: service_role key
   - `CLOUDINARY_URL` or `CLOUDINARY_*` keys
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`

After deploy, note the backend URL, e.g. `https://fashionbrain.onrender.com`.

### Frontend (Vite + React) on Vercel
1. From the `frontend/` folder, connect the project in Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables (Vercel Project → Settings → Environment Variables):
   - `VITE_API_BASE`: your backend URL, e.g. `https://fashionbrain.onrender.com`

### Local development override
The frontend now reads the API base from `VITE_API_BASE` when present. If not set, it falls back to `http://localhost:8000`.

# FashionBrain Setup Guide

## Quick Fix for Authentication Issues

Your login/signup issues are likely due to missing environment variables. Follow these steps:

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
Run the setup script:
```bash
python3 setup_env.py
```

This will create a `.env` file with template values. You need to replace the placeholder values with your actual credentials.

### 3. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

### 4. Get Your Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy these values:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### 5. Update Your .env File

Edit the `.env` file and replace the placeholder values:

```env
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_KEY=your_actual_anon_key
SUPABASE_JWT_SECRET=your_actual_jwt_secret
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 6. Set Up Supabase Database

Run the SQL script to create required tables:
```bash
# Connect to your Supabase project and run:
psql -h your-db-host -U postgres -d postgres -f setup_pgvector.sql
```

Or manually create these tables in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    min_price DECIMAL,
    max_price DECIMAL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    embedding VECTOR(512),
    description TEXT,
    category TEXT,
    brand TEXT,
    size TEXT,
    color TEXT,
    affiliate_link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User actions table
CREATE TABLE user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('save', 'skip', 'shop')),
    outfit_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inspiration images table
CREATE TABLE inspo_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    embedding VECTOR(512),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Start the Application

Backend:
```bash
python3 app.py
```

Frontend (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

## Common Issues & Solutions

### "Supabase credentials not configured"
- Make sure your `.env` file exists and has correct values
- Check that environment variables are loaded properly

### "Email confirmation required"
- Check your email for a confirmation link
- Or disable email confirmation in Supabase Auth settings

### "Invalid credentials"
- Verify your Supabase URL and keys are correct
- Check that the user exists in your Supabase auth

### CORS errors
- The backend is configured to allow all origins
- If you still get CORS errors, check the frontend API URL configuration

### Port issues
- Backend runs on port 5000
- Frontend runs on port 3000 (or 5000 in some setups)
- The API configuration has been updated to handle this correctly

## Testing Authentication

1. Start both backend and frontend
2. Go to the signup page
3. Create a new account
4. Check your email for confirmation (if required)
5. Try logging in

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check the backend terminal for error messages
3. Verify all environment variables are set correctly
4. Make sure your Supabase project is active and accessible

