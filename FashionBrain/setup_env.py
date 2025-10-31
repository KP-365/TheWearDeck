#!/usr/bin/env python3
"""
Setup script to help configure environment variables for FashionBrain
"""

import os
import secrets

def generate_secret():
    """Generate a secure random secret"""
    return secrets.token_urlsafe(32)

def create_env_file():
    """Create .env file with template values"""
    env_content = f"""# Supabase Configuration
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# Cloudinary Configuration  
# Get these from your Cloudinary dashboard: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Session Secret (auto-generated)
SESSION_SECRET={generate_secret()}

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD={generate_secret()[:16]}
"""

    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file with template values")
    print("\n📝 Next steps:")
    print("1. Get your Supabase credentials from https://supabase.com/dashboard")
    print("2. Get your Cloudinary credentials from https://cloudinary.com/console")
    print("3. Update the .env file with your actual credentials")
    print("4. Run: pip install -r requirements.txt")
    print("5. Run: python app.py")

def check_env_file():
    """Check if .env file exists and has required variables"""
    if not os.path.exists('.env'):
        print("❌ .env file not found")
        return False
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_KEY', 
        'SUPABASE_JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ]
    
    missing_vars = []
    with open('.env', 'r') as f:
        content = f.read()
        for var in required_vars:
            if f"{var}=your_" in content or f"{var}=https://your-" in content:
                missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing or placeholder values for: {', '.join(missing_vars)}")
        return False
    
    print("✅ .env file looks good!")
    return True

if __name__ == "__main__":
    print("🚀 FashionBrain Environment Setup")
    print("=" * 40)
    
    if check_env_file():
        print("Your environment is already configured!")
    else:
        create_env_file()

