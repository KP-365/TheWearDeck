from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme")
            user_id = self.verify_jwt(credentials.credentials)
            if not user_id:
                raise HTTPException(status_code=403, detail="Invalid or expired token")
            return user_id
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code")
    
    def verify_jwt(self, jwtoken: str) -> str:
        if not JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT secret not configured")
        
        try:
            payload = jwt.decode(
                jwtoken, 
                JWT_SECRET, 
                algorithms=[ALGORITHM],
                audience="authenticated"
            )
            return payload.get("sub")
        except JWTError:
            return None

def get_current_user(token: str):
    """Extract user ID from JWT token"""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret not configured")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated")
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
