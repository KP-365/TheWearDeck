from datetime import datetime

def log_user_action(user_id, product_id, action_type, supabase):
    data = {
        "user_id": user_id,
        "product_id": product_id,
        "action_type": action_type,
        "created_at": datetime.utcnow().isoformat()
    }
    
    response = supabase.table("user_actions").insert(data).execute()
    
    return {
        "success": True,
        "message": "Action logged successfully",
        "data": response.data
    }
