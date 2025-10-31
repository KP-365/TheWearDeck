from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Cookie, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse
from supabase import create_client
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os
from typing import Optional
import io
from PIL import Image
from itsdangerous import URLSafeTimedSerializer
import secrets
from cloudinary_config import *
from clip_model import generate_embedding
from vector_search import search_products
from feedback import log_user_action
from auth import JWTBearer
from pydantic import BaseModel
from outfit_generator import generate_outfits, generate_outfits_with_advanced_filter

# Force-load .env from project root and allow overriding process env
load_dotenv(dotenv_path=".env", override=True)

app = FastAPI()

SECRET_KEY = os.getenv("SESSION_SECRET", secrets.token_hex(32))
serializer = URLSafeTimedSerializer(SECRET_KEY)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

supabase = None

def get_supabase_client():
    global supabase
    if supabase is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables."
            )
        
        # Ensure URL is properly formatted
        if not supabase_url.startswith('http'):
            supabase_url = f'https://{supabase_url}'
        
        try:
            supabase = create_client(supabase_url, supabase_key)
        except Exception as e:
            error_str = str(e).lower()
            if "nodename" in error_str or "servname" in error_str or "getaddrinfo" in error_str:
                raise HTTPException(
                    status_code=503,
                    detail="Database connection failed. Please check your SUPABASE_URL in .env file and internet connection."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize database connection: {str(e)}"
            )
    return supabase

def verify_admin(session_token: Optional[str] = Cookie(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = serializer.loads(session_token, max_age=86400)
        if data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return data
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

@app.post("/admin/login")
async def admin_login(
    response: Response,
    username: str = Form(...),
    password: str = Form(...)
):
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_username or not admin_password:
        raise HTTPException(
            status_code=500,
            detail="Admin credentials not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables."
        )
    
    if username == admin_username and password == admin_password:
        token = serializer.dumps({"username": username, "role": "admin"})
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            max_age=86400,
            samesite="lax"
        )
        return {"success": True, "message": "Login successful"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/admin/logout")
async def admin_logout(response: Response):
    response.delete_cookie("session_token")
    return {"success": True, "message": "Logged out successfully"}

@app.get("/admin/verify")
async def verify_session(admin_data: dict = Depends(verify_admin)):
    return {"authenticated": True, "username": admin_data.get("username")}

@app.get("/admin", response_class=HTMLResponse)
async def admin_page():
    with open("admin.html", "r") as f:
        return f.read()

class AuthCredentials(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserBudget(BaseModel):
    min_price: float
    max_price: float

@app.get("/")
def read_root():
    return {
        "status": "AI Fashion App API is running",
        "version": "1.0",
        "endpoints": ["/recommend", "/feed", "/action", "/saved", "/auth/signup", "/auth/login", "/admin"]
    }

@app.get("/debug/env")
def debug_env():
    # Only expose booleans; do NOT leak secrets
    return {
        "HF_TOKEN_set": bool(os.getenv("HF_TOKEN")),
        "SUPABASE_URL_set": bool(os.getenv("SUPABASE_URL")),
        "SUPABASE_KEY_set": bool(os.getenv("SUPABASE_KEY"))
    }

@app.post("/auth/signup")
async def signup(credentials: AuthCredentials):
    try:
        supabase = get_supabase_client()
        
        # Try to sign up with Supabase Auth
        try:
            res = supabase.auth.sign_up({
                "email": credentials.email,
                "password": credentials.password
            })
        except Exception as auth_error:
            error_msg = str(auth_error)
            # If it's a network/DNS error, provide helpful message
            if "nodename" in error_msg.lower() or "servname" in error_msg.lower() or "getaddrinfo" in error_msg.lower():
                raise HTTPException(
                    status_code=503,
                    detail="Database connection error. Please check your Supabase configuration."
                )
            raise
        
        if not res.user:
            raise HTTPException(status_code=400, detail="Signup failed - no user returned")
        
        # Handle email confirmation requirement
        if not res.session:
            # User created but needs email confirmation
            # Return 200 status with confirmation message
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Account created! Please check your email to confirm your account.",
                    "user": {
                        "id": res.user.id,
                        "email": credentials.email,
                        "name": credentials.name or credentials.email.split('@')[0]
                    },
                    "requires_confirmation": True
                }
            )
        
        # User created and confirmed immediately
        user_data = {
            "id": res.user.id,
            "email": credentials.email,
            "name": credentials.name or credentials.email.split('@')[0]
        }
        
        try:
            supabase.table("users").insert(user_data).execute()
        except Exception as db_error:
            print(f"Warning: Could not insert user data: {db_error}")
            # Continue anyway - user is created in auth, just not in our users table
        
        return {
            "success": True,
            "user": user_data,
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        # Check if this is an email confirmation case
        error_msg = str(e)
        if "email confirmation" in error_msg.lower() or "confirmation" in error_msg.lower():
            # This is actually a success case - user created but needs confirmation
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Account created! Please check your email to confirm your account.",
                    "user": {
                        "id": "pending",
                        "email": credentials.email,
                        "name": credentials.name or credentials.email.split('@')[0]
                    },
                    "requires_confirmation": True
                }
            )
        
        # Provide more helpful error messages for actual errors
        if "invalid" in error_msg.lower():
            error_msg = "Please use a valid email address (Gmail, Yahoo, etc.)"
        elif "already" in error_msg.lower():
            error_msg = "An account with this email already exists"
        else:
            error_msg = f"Signup failed: {error_msg}"
        
        raise HTTPException(status_code=400, detail=error_msg)

@app.post("/auth/login")
async def login(credentials: AuthCredentials):
    try:
        supabase = get_supabase_client()
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not res.user or not res.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_data = supabase.table("users").select("*").eq("id", res.user.id).execute()
        
        user = user_data.data[0] if user_data.data else {
            "id": res.user.id,
            "email": credentials.email,
            "name": credentials.email.split('@')[0]
        }
        
        return {
            "success": True,
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.post("/auth/logout")
async def logout():
    return {"success": True, "message": "Logged out successfully"}

@app.get("/auth/me")
async def get_current_user_info(user_id: str = Depends(JWTBearer())):
    try:
        supabase = get_supabase_client()
        user_data = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if user_data.data:
            return {"user": user_data.data[0]}
        else:
            return {"user": {"id": user_id}}
    except Exception as e:
        return {"user": {"id": user_id}}

@app.post("/onboarding/inspo-image")
async def upload_inspo_image(
    image: UploadFile = File(...),
    user_id: str = Depends(JWTBearer())
):
    try:
        contents = await image.read()
        
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="inspo_images"
        )
        
        img = Image.open(io.BytesIO(contents))
        embedding = generate_embedding(image=img)

        supabase = get_supabase_client()
        inspo_data = {
            "user_id": user_id,
            "image_url": upload_result["secure_url"],
            "cloudinary_public_id": upload_result["public_id"],
            "embedding": embedding
        }
        
        result = supabase.table("inspo_images").insert(inspo_data).execute()
        
        return {
            "success": True,
            "inspo_image": result.data[0] if result.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/onboarding/budget")
async def save_budget(
    budget: UserBudget,
    user_id: str = Depends(JWTBearer())
):
    try:
        supabase = get_supabase_client()
        
        user_check = supabase.table("users").select("id").eq("id", user_id).execute()
        
        if user_check.data:
            result = supabase.table("users").update({
                "min_price": budget.min_price,
                "max_price": budget.max_price
            }).eq("id", user_id).execute()
        else:
            result = supabase.table("users").insert({
                "id": user_id,
                "min_price": budget.min_price,
                "max_price": budget.max_price
            }).execute()
        
        return {
            "success": True,
            "user": result.data[0] if result.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OnboardingData(BaseModel):
    gender: Optional[str] = None
    preferred_styles: Optional[list] = None
    budget_range: Optional[str] = None
    onboarding_completed: bool = False

@app.post("/onboarding/complete")
async def complete_onboarding(
    data: OnboardingData,
    user_id: str = Depends(JWTBearer())
):
    try:
        supabase = get_supabase_client()
        
        # Prepare update data
        update_data = {
            "onboarding_completed": data.onboarding_completed
        }
        
        if data.gender:
            update_data["gender"] = data.gender
        if data.preferred_styles:
            update_data["preferred_styles"] = data.preferred_styles
        if data.budget_range:
            update_data["budget_range"] = data.budget_range
        
        # Check if user exists
        user_check = supabase.table("users").select("id").eq("id", user_id).execute()
        
        if user_check.data:
            result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        else:
            update_data["id"] = user_id
            result = supabase.table("users").insert(update_data).execute()
        
        return {
            "success": True,
            "user": result.data[0] if result.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RecommendRequest(BaseModel):
    query: Optional[str] = None
    image_url: Optional[str] = None
    top_k: int = 5

@app.post("/recommend")
async def recommend(
    request: RecommendRequest,
    user_id: str = Depends(JWTBearer())
):
    try:
        if request.query is None and request.image_url is None:
            raise HTTPException(
                status_code=400,
                detail="Either query or image_url must be provided"
            )
        
        embedding = None
        
        if request.image_url is not None:
            # For now, we'll use a simple text-based approach
            # In production, you'd want to download and process the image
            embedding = generate_embedding(text=f"outfit similar to image at {request.image_url}")
        elif request.query is not None:
            embedding = generate_embedding(text=request.query)
        
        if embedding is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate embedding"
            )
        
        results = search_products(embedding, top_k=request.top_k)
        
        # Generate outfit recommendations from the products
        recommendations = []
        if results:
            # Group products by category and create outfit combinations
            outfits = generate_outfits(results, user_id)
            recommendations = outfits[:request.top_k]
        
        return {
            "success": True,
            "query_type": "image" if request.image_url else "text",
            "recommendations": recommendations,
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feed")
async def get_personalized_feed(
    user_id: str = Depends(JWTBearer()),
    num_outfits: int = 10,
    use_advanced_filter: bool = False
):
    try:
        supabase = get_supabase_client()
        import numpy as np
        
        # Get user budget
        user_data = supabase.table("users").select("*").eq("id", user_id).execute()
        user_budget = None
        if user_data.data and len(user_data.data) > 0:
            user = user_data.data[0]
            if user.get('min_price') is not None and user.get('max_price') is not None:
                user_budget = {
                    'min_price': float(user['min_price']),
                    'max_price': float(user['max_price'])
                }
        
        # Get inspiration images
        inspo_images = supabase.table("inspo_images").select("embedding").eq("user_id", user_id).execute()
        
        if inspo_images.data and len(inspo_images.data) > 0:
            embeddings = [np.array(img["embedding"]) for img in inspo_images.data]
            combined_embedding = np.mean(embeddings, axis=0)
            
            results = search_products(combined_embedding, top_k=50)
            products = [r["product"] for r in results]
        else:
            # Only select necessary fields for faster queries
            all_products = supabase.table("products").select("id,name,price,image_url,category,brand,size,color,affiliate_link").limit(50).execute()
            products = all_products.data
        
        # Generate outfits based on filter type
        if use_advanced_filter:
            # Advanced filter with per-category budgets
            category_budgets = None
            if user_data.data and len(user_data.data) > 0:
                user = user_data.data[0]
                # Check if user has category-specific budgets set
                if user.get('tops_max_price') or user.get('bottoms_max_price'):
                    category_budgets = {}
                    if user.get('tops_max_price'):
                        category_budgets['tops'] = {'min': 0, 'max': float(user['tops_max_price'])}
                    if user.get('bottoms_max_price'):
                        category_budgets['bottoms'] = {'min': 0, 'max': float(user['bottoms_max_price'])}
                    if user.get('shoes_max_price'):
                        category_budgets['shoes'] = {'min': 0, 'max': float(user['shoes_max_price'])}
                    if user.get('accessories_max_price'):
                        category_budgets['accessories'] = {'min': 0, 'max': float(user['accessories_max_price'])}
            
            outfits = generate_outfits_with_advanced_filter(
                products, 
                total_budget=user_budget,
                category_budgets=category_budgets,
                num_outfits=num_outfits
            )
        else:
            # Simple total outfit price filter
            outfits = generate_outfits(products, user_budget=user_budget, num_outfits=num_outfits)
        
        return {
            "success": True,
            "outfits": outfits,
            "count": len(outfits)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/saved")
async def get_saved_items(user_id: str = Depends(JWTBearer())):
    try:
        supabase = get_supabase_client()
        
        saved_actions = supabase.table("user_actions").select("*").eq("user_id", user_id).eq("action", "like").execute()
        
        if not saved_actions.data:
            return {"success": True, "saved_outfits": [], "count": 0}
        
        # Group by outfit_id
        outfits_dict = {}
        for action in saved_actions.data:
            outfit_id = action.get("outfit_id", action["product_id"])  # Fallback to product_id if no outfit_id
            
            if outfit_id not in outfits_dict:
                outfits_dict[outfit_id] = []
            
            outfits_dict[outfit_id].append(action["product_id"])
        
        # Fetch products for each outfit
        saved_outfits = []
        for outfit_id, product_ids in outfits_dict.items():
            products = supabase.table("products").select("*").in_("id", product_ids).execute()
            
            total_price = sum(float(p.get('price', 0)) for p in products.data)
            
            saved_outfits.append({
                "outfit_id": outfit_id,
                "items": products.data,
                "total_price": total_price,
                "item_count": len(products.data)
            })
        
        return {
            "success": True,
            "saved_outfits": saved_outfits,
            "count": len(saved_outfits)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/action")
async def user_action(
    action_type: str = Form(...),
    user_id: str = Depends(JWTBearer()),
    product_ids: str = Form(None),
    product_id: str = Form(None),
    outfit_id: str = Form(None)
):
    try:
        if action_type not in ["like", "skip", "shop"]:
            raise HTTPException(
                status_code=400,
                detail="action_type must be one of: like, skip, shop"
            )
        
        supabase = get_supabase_client()
        
        # Handle outfit actions (multiple products) OR single product (backwards compatibility)
        if product_ids:
            product_id_list = product_ids.split(',')
        elif product_id:
            product_id_list = [product_id]
        else:
            raise HTTPException(status_code=400, detail="Either product_id or product_ids required")
        
        # Generate outfit_id if not provided
        if not outfit_id:
            import uuid
            outfit_id = str(uuid.uuid4())
        
        results = []
        for pid in product_id_list:
            pid = pid.strip()
            result = log_user_action(user_id, pid, action_type, supabase)
            
            # Also store outfit_id for grouping (only for likes with multiple items)
            if action_type == "like" and len(product_id_list) > 1:
                supabase.table("user_actions").update({
                    "outfit_id": outfit_id
                }).eq("user_id", user_id).eq("product_id", pid).eq("action", "like").execute()
            
            results.append(result)
        
        return {
            "success": True,
            "message": f"{'Outfit' if len(product_id_list) > 1 else 'Item'} {action_type}d successfully",
            "outfit_id": outfit_id if len(product_id_list) > 1 else None,
            "actions": results
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-product")
async def add_product(
    image: UploadFile = File(...),
    name: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    brand: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    affiliate_link: Optional[str] = Form(None),
    admin_data: dict = Depends(verify_admin)
):
    try:
        contents = await image.read()
        
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="fashion_app/products"
        )
        
        img = Image.open(io.BytesIO(contents))
        embedding = generate_embedding(image=img)  
        
        if embedding is None:
            print("Warning: Embedding generation disabled due to disk space")
           
        product_data = {
            "name": name,
            "price": price,
            "image_url": upload_result["secure_url"],
            "cloudinary_public_id": upload_result["public_id"],
            "embedding": embedding,  
            "description": description,
            "category": category,
            "brand": brand,
            "size": size,
            "color": color,
            "affiliate_link": affiliate_link
        }
        
        supabase_client = get_supabase_client()
        response = supabase_client.table("products").insert(product_data).execute()
        
        return {
            "success": True,
            "message": "Product added successfully",
            "product": response.data[0] if response.data else product_data,
            "image_url": upload_result["secure_url"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list-products")
async def list_products(admin_data: dict = Depends(verify_admin)):
    try:
        supabase_client = get_supabase_client()
        # Limit to 100 products and exclude embeddings for faster response
        response = supabase_client.table("products").select("id,name,price,description,category,brand,size,color,image_url,affiliate_link,created_at").limit(100).execute()
        
        return {
            "success": True,
            "products": response.data,
            "count": len(response.data) if response.data else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-product/{product_id}")
async def delete_product(product_id: str, admin_data: dict = Depends(verify_admin)):
    try:
        supabase_client = get_supabase_client()
        
        product_response = supabase_client.table("products").select("cloudinary_public_id").eq("id", product_id).execute()
        
        if product_response.data and len(product_response.data) > 0:
            public_id = product_response.data[0].get("cloudinary_public_id")
            if public_id:
                try:
                    cloudinary.uploader.destroy(public_id)
                except:
                    pass
        
        response = supabase_client.table("products").delete().eq("id", product_id).execute()
        
        return {
            "success": True,
            "message": "Product deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
