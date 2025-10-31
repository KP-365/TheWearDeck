#!/usr/bin/env python3
"""
Secure Environment Variable Manager
Encrypts and decrypts environment variables using a master password
"""

import os
import base64
import getpass
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import json

class SecureEnvManager:
    def __init__(self, env_file='.env.encrypted', salt_file='.env.salt'):
        self.env_file = env_file
        self.salt_file = salt_file
        self.fernet = None
        
    def _get_key_from_password(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password and salt"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def _generate_salt(self) -> bytes:
        """Generate a random salt"""
        return os.urandom(16)
    
    def _load_salt(self) -> bytes:
        """Load salt from file or generate new one"""
        if os.path.exists(self.salt_file):
            with open(self.salt_file, 'rb') as f:
                return f.read()
        else:
            salt = self._generate_salt()
            with open(self.salt_file, 'wb') as f:
                f.write(salt)
            os.chmod(self.salt_file, 0o600)  # Secure permissions
            return salt
    
    def setup_master_password(self):
        """Set up master password and initialize encryption"""
        print("🔐 Setting up secure environment storage")
        print("=" * 50)
        
        # Get master password
        password = getpass.getpass("Enter master password: ")
        password_confirm = getpass.getpass("Confirm master password: ")
        
        if password != password_confirm:
            print("❌ Passwords don't match!")
            return False
        
        if len(password) < 8:
            print("❌ Password must be at least 8 characters long!")
            return False
        
        # Generate salt and key
        salt = self._load_salt()
        key = self._get_key_from_password(password, salt)
        self.fernet = Fernet(key)
        
        print("✅ Master password set up successfully!")
        print(f"📁 Salt file: {self.salt_file}")
        print(f"🔒 Encrypted env file: {self.env_file}")
        return True
    
    def encrypt_and_store(self, env_vars: dict):
        """Encrypt and store environment variables"""
        if not self.fernet:
            print("❌ Master password not set up!")
            return False
        
        # Convert to JSON and encrypt
        json_data = json.dumps(env_vars, indent=2)
        encrypted_data = self.fernet.encrypt(json_data.encode())
        
        # Store encrypted data
        with open(self.env_file, 'wb') as f:
            f.write(encrypted_data)
        
        # Set secure permissions
        os.chmod(self.env_file, 0o600)
        
        print(f"✅ Environment variables encrypted and stored in {self.env_file}")
        return True
    
    def decrypt_and_load(self) -> dict:
        """Decrypt and load environment variables"""
        if not os.path.exists(self.env_file):
            print("❌ No encrypted environment file found!")
            return {}
        
        # Get master password
        password = getpass.getpass("Enter master password: ")
        
        # Load salt and derive key
        salt = self._load_salt()
        key = self._get_key_from_password(password, salt)
        self.fernet = Fernet(key)
        
        try:
            # Decrypt data
            with open(self.env_file, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = self.fernet.decrypt(encrypted_data)
            env_vars = json.loads(decrypted_data.decode())
            
            print("✅ Environment variables decrypted successfully!")
            return env_vars
            
        except Exception as e:
            print(f"❌ Failed to decrypt: {e}")
            return {}
    
    def create_plain_env(self):
        """Create a plain .env file from encrypted data"""
        env_vars = self.decrypt_and_load()
        if not env_vars:
            return False
        
        # Create .env file
        with open('.env', 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        
        # Set secure permissions
        os.chmod('.env', 0o600)
        
        print("✅ Plain .env file created from encrypted data")
        return True
    
    def cleanup_plain_env(self):
        """Remove plain .env file for security"""
        if os.path.exists('.env'):
            os.remove('.env')
            print("✅ Plain .env file removed for security")
        else:
            print("ℹ️  No plain .env file to remove")

def main():
    manager = SecureEnvManager()
    
    print("🔐 Secure Environment Manager")
    print("=" * 40)
    print("1. Set up master password")
    print("2. Store encrypted credentials")
    print("3. Create plain .env file")
    print("4. Remove plain .env file")
    print("5. Exit")
    
    while True:
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == '1':
            manager.setup_master_password()
        
        elif choice == '2':
            print("\n📝 Enter your credentials:")
            env_vars = {}
            
            # Supabase
            env_vars['SUPABASE_URL'] = input("Supabase URL: ").strip()
            env_vars['SUPABASE_KEY'] = input("Supabase Key: ").strip()
            env_vars['SUPABASE_JWT_SECRET'] = input("Supabase JWT Secret: ").strip()
            
            # Cloudinary
            env_vars['CLOUDINARY_CLOUD_NAME'] = input("Cloudinary Cloud Name: ").strip()
            env_vars['CLOUDINARY_API_KEY'] = input("Cloudinary API Key: ").strip()
            env_vars['CLOUDINARY_API_SECRET'] = input("Cloudinary API Secret: ").strip()
            
            # Session and Admin
            import secrets
            env_vars['SESSION_SECRET'] = secrets.token_urlsafe(32)
            env_vars['ADMIN_USERNAME'] = 'admin'
            env_vars['ADMIN_PASSWORD'] = secrets.token_urlsafe(16)
            
            manager.encrypt_and_store(env_vars)
        
        elif choice == '3':
            manager.create_plain_env()
        
        elif choice == '4':
            manager.cleanup_plain_env()
        
        elif choice == '5':
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid option!")

if __name__ == "__main__":
    main()

