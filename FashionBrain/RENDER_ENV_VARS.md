# 🔐 Environment Variables for Render Backend

Copy these **exact variable names** and values from your `.env` file into Render:

## Required Environment Variables

### 1. Supabase Configuration
```
SUPABASE_URL=https://hodrwyynqbhqduolcmud.supabase.co
SUPABASE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

**Where to find:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
- **SUPABASE_URL**: Project URL
- **SUPABASE_KEY**: Use the `service_role` key (not incoming `anon` key) - this is the secret key you provided earlier
- **SUPABASE_JWT_SECRET**: JWT Secret

### 2. Cloudinary Configuration
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Where to find:**
- Go to [Cloudinary Dashboard](https://cloudinary.com/console)
- Click on "Dashboard" → Your account details are shown

### 3. Session & Security
```
SESSION_SECRET=any_random_long_string_here
```

**CYPTION:**
- This can be any long random string
- Generate one with: `openssl rand -hex 32`
- Or use: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

### 4. Admin Credentials
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

**Note:**
- These are for the admin panel login
- Use a strong password!
- Don't share these publicly

---

## 📋 Quick Copy Checklist

Copy each of these from your `.env` file:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY` (service_role key)
-ضح [ ] `SUPABASE_JWT_SECRET`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `ADMIN_USERNAME`
- [ ] `ADMIN_PASSWORD`

---

## 🚀 How to Add in Render

1. Go to your Render dashboard
2. Click on your service (or create new one)
3. Click **"Environment"** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add each variable one by one:
   - **Key**: `SUPABASE_URL`
   - **Value**: `https://hodrwyynqbhqduolcmud.supabase.co`
   - Click **"Save Changes"**
6. Repeat for each variable above

---

## ✅ Verification

After adding all variables:
1. Click **"Manual Deploy"** or wait for auto-deploy
2. Check the logs - should see "Application startup complete"
3. Test: `https://your-backend.onrender.com/` should show API status

---

## 🔍 Optional Variables

These are optional (not required for basic functionality):

```
HF_TOKEN=your_huggingface_token
PORT=$PORT  (automatically set by Render)
```

---

## ⚠️ Important Notes

1. **SUPABASE_KEY**: Must be the `service_role` key, NOT the `anon` public key
2. **No quotes needed**: Don't add quotes around values in Render
3. **No spaces**: Make sure no leading/trailing spaces
4. **Case sensitive**: Variable names are case-sensitive
5. **Secret values**: Never commit these to GitHub!

