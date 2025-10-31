#!/usr/bin/env python3
"""
Simple credential setup script - no interactive input required
"""

import os
import secrets
import sys

def create_env_file():
    """Create .env file with your credentials"""
    
    print("🔐 Setting up your environment credentials")
    print("=" * 50)
    
    # Get credentials from user input
    print("Please enter your credentials:")
    print()
    
    # Supabase credentials
    supabase_url = input("Supabase URL: ").strip()
    supabase_key = input("Supabase Key: ").strip()
    supabase_jwt_secret = input("Supabase JWT Secret: ").strip()
    
    print()
    
    # Cloudinary credentials
    cloudinary_cloud_name = input("Cloudinary Cloud Name: ").strip()
    cloudinary_api_key = input("Cloudinary API Key: ").strip()
    cloudinary_api_secret = input("Cloudinary API Secret: ").strip()
    
    print()
    
    # Generate secure secrets
    session_secret = secrets.token_urlsafe(32)
    admin_password = secrets.token_urlsafe(16)
    
    # Create .env content
    env_content = f"""# Supabase Configuration
SUPABASE_URL={supabase_url}
SUPABASE_KEY={supabase_key}
SUPABASE_JWT_SECRET={supabase_jwt_secret}

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME={cloudinary_cloud_name}
CLOUDINARY_API_KEY={cloudinary_api_key}
CLOUDINARY_API_SECRET={cloudinary_api_secret}

# Session Secret (auto-generated)
SESSION_SECRET={session_secret}

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD={admin_password}
"""
    
    # Write to .env file
    with open('.env', 'w') as f:
        f.write(env_content)
    
    # Set secure permissions
    os.chmod('.env', 0o600)
    
    print()
    print("✅ Environment file created successfully!")
    print("📁 File: .env (with secure permissions)")
    print("🔒 Admin password:", admin_password)
    print()
    print("Next steps:")
    print("1. Install dependencies: pip3 install -r requirements.txt")
    print("2. Start backend: python3 app.py")
    print("3. Start frontend: cd frontend && npm install && npm run dev")

def create_env_from_args():
    """Create .env file from command line arguments"""
    if len(sys.argv) != 7:
        print("Usage: python3 setup_credentials.py <supabase_url> <supabase_key> <supabase_jwt> <cloudinary_name> <cloudinary_key> <cloudinary_secret>")
        return
    
    supabase_url = sys.argv[1]
    supabase_key = sys.argv[2]
    supabase_jwt_secret = sys.argv[3]
    cloudinary_cloud_name = sys.argv[4]
    cloudinary_api_key = sys.argv[5]
    cloudinary_api_secret = sys.argv[6]
    
    # Generate secure secrets
    session_secret = secrets.token_urlsafe(32)
    admin_password = secrets.token_urlsafe(16)
    
    # Create .env content
    env_content = f"""# Supabase Configuration
SUPABASE_URL={supabase_url}
SUPABASE_KEY={supabase_key}
SUPABASE_JWT_SECRET={supabase_jwt_secret}

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME={cloudinary_cloud_name}
CLOUDINARY_API_KEY={cloudinary_api_key}
CLOUDINARY_API_SECRET={cloudinary_api_secret}

# Session Secret (auto-generated)
SESSION_SECRET={session_secret}

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD={admin_password}
"""
    
    # Write to .env file
    with open('.env', 'w') as f:
        f.write(env_content)
    
    # Set secure permissions
    os.chmod('.env', 0o600)
    
    print("✅ Environment file created successfully!")
    print("🔒 Admin password:", admin_password)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_env_from_args()
    else:
        create_env_file()

