import numpy as np
from supabase import create_client
import os
import json
import traceback
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client():
    """Create and return Supabase client"""
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )

def search_products(embedding, top_k=5):
    """
    Search for similar products using Supabase's native pgvector similarity search.
    Uses the <-> operator for L2 distance calculation directly in the database.
    
    Args:
        embedding: Query embedding as numpy array or list
        top_k: Number of top results to return
        
    Returns:
        List of products with similarity scores
    """
    supabase = get_supabase_client()
    
    # Convert embedding to list if it's a numpy array
    if isinstance(embedding, np.ndarray):
        embedding_list = embedding.tolist()
    else:
        embedding_list = embedding
    
    # Format embedding as PostgreSQL array string
    embedding_str = "[" + ",".join(str(x) for x in embedding_list) + "]"
    
    # Use Supabase RPC to perform vector similarity search
    # The <-> operator calculates L2 distance between vectors
    try:
        response = supabase.rpc(
            'match_products',
            {
                'query_embedding': embedding_str,
                'match_threshold': 0.8,  # Optional similarity threshold
                'match_count': top_k
            }
        ).execute()
        
        if response.data:
            results = []
            for item in response.data:
                # Calculate similarity score from distance
                distance = item.get('distance', 1.0)
                similarity_score = 1 / (1 + distance)
                
                results.append({
                    "product": item,
                    "distance": float(distance),
                    "similarity_score": float(similarity_score)
                })
            return results
    except Exception as e:
        # Fallback to direct SQL query if RPC function doesn't exist
        print(f"RPC search failed, using direct SQL query: {e}")
        pass
    
    # Fallback: Use direct SQL query with manual distance calculation
    # This works if the RPC function isn't set up
    try:
        # Query using PostgREST to get all products
        response = supabase.table("products").select("*").execute()
        
        if not response.data:
            print("No products found in database")
            return []
        
        # Calculate distances manually and sort
        products_with_distance = []
        query_embedding = np.array(embedding_list, dtype=np.float32)
        
        for product in response.data:
            if product.get("embedding"):
                # Supabase may return embeddings as strings, lists, or already as arrays
                embedding_data = product["embedding"]
                
                # Parse embedding if it's a string (JSON or PostgreSQL array format)
                if isinstance(embedding_data, str):
                    # Try JSON parsing first
                    try:
                        embedding_data = json.loads(embedding_data)
                    except json.JSONDecodeError:
                        # Handle PostgreSQL array format: "{1.0,2.0,3.0}"
                        if embedding_data.startswith("{") and embedding_data.endswith("}"):
                            embedding_data = [float(x) for x in embedding_data.strip("{}").split(",")]
                        else:
                            print(f"Failed to parse embedding for product {product.get('id')}")
                            continue
                
                # Convert to numpy array
                try:
                    product_embedding = np.array(embedding_data, dtype=np.float32)
                    # Calculate L2 distance
                    distance = np.linalg.norm(query_embedding - product_embedding)
                    products_with_distance.append({
                        "product": product,
                        "distance": float(distance),
                        "similarity_score": float(1 / (1 + distance))
                    })
                except (ValueError, TypeError) as e:
                    print(f"Error converting embedding to array for product {product.get('id')}: {e}")
                    continue
        
        if not products_with_distance:
            print("No valid embeddings found in products")
            return []
        
        # Sort by distance (ascending) and return top_k
        products_with_distance.sort(key=lambda x: x["distance"])
        return products_with_distance[:top_k]
        
    except Exception as e:
        print(f"Vector search error: {e}")
        traceback.print_exc()
        return []
