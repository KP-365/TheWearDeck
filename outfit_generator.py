import numpy as np
from typing import List, Dict, Optional
import random

def generate_outfits(products: List[Dict], user_budget: Optional[Dict] = None, num_outfits: int = 10) -> List[Dict]:
    """
    Generate outfit combinations from products.
    
    Args:
        products: List of product dictionaries with category, price, etc.
        user_budget: Dict with min_price and max_price for total outfit
        num_outfits: Number of outfits to generate
    
    Returns:
        List of outfit dictionaries, each containing multiple products
    """
    
    # Categorize products
    tops = [p for p in products if p.get('category', '').lower() in ['top', 'tops', 'shirt', 'blouse', 'sweater', 't-shirt']]
    bottoms = [p for p in products if p.get('category', '').lower() in ['bottom', 'bottoms', 'pants', 'jeans', 'shorts', 'skirt']]
    dresses = [p for p in products if p.get('category', '').lower() in ['dress', 'dresses', 'jumpsuit', 'romper']]
    shoes = [p for p in products if p.get('category', '').lower() in ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'heels']]
    accessories = [p for p in products if p.get('category', '').lower() in ['accessory', 'accessories', 'bag', 'jewelry', 'hat', 'belt', 'scarf']]
    
    outfits = []
    min_price = user_budget.get('min_price', 0) if user_budget else 0
    max_price = user_budget.get('max_price', float('inf')) if user_budget else float('inf')
    
    # Generate dress-based outfits
    for dress in dresses:
        if len(outfits) >= num_outfits:
            break
            
        for shoe in (shoes if shoes else [None]):
            if len(outfits) >= num_outfits:
                break
                
            outfit_items = [dress]
            outfit_price = float(dress.get('price', 0))
            
            if shoe:
                outfit_items.append(shoe)
                outfit_price += float(shoe.get('price', 0))
            
            # Try with and without accessory
            accessory_options = [None] + (accessories[:3] if accessories else [])
            for accessory in accessory_options:
                temp_items = outfit_items.copy()
                temp_price = outfit_price
                
                if accessory:
                    temp_items.append(accessory)
                    temp_price += float(accessory.get('price', 0))
                
                # Check budget constraints
                if min_price <= temp_price <= max_price:
                    outfits.append({
                        'items': temp_items,
                        'total_price': temp_price,
                        'outfit_type': 'dress'
                    })
                    break
    
    # Generate top + bottom outfits
    for top in tops:
        if len(outfits) >= num_outfits:
            break
            
        for bottom in bottoms:
            if len(outfits) >= num_outfits:
                break
                
            base_price = float(top.get('price', 0)) + float(bottom.get('price', 0))
            
            for shoe in (shoes if shoes else [None]):
                if len(outfits) >= num_outfits:
                    break
                    
                outfit_items = [top, bottom]
                outfit_price = base_price
                
                if shoe:
                    outfit_items.append(shoe)
                    outfit_price += float(shoe.get('price', 0))
                
                # Try with and without accessory
                accessory_options_sep = [None] + (accessories[:2] if accessories else [])
                for accessory in accessory_options_sep:
                    temp_items = outfit_items.copy()
                    temp_price = outfit_price
                    
                    if accessory:
                        temp_items.append(accessory)
                        temp_price += float(accessory.get('price', 0))
                    
                    # Check budget constraints
                    if min_price <= temp_price <= max_price:
                        outfits.append({
                            'items': temp_items,
                            'total_price': temp_price,
                            'outfit_type': 'separates'
                        })
                        break
    
    return outfits[:num_outfits]


def generate_outfits_with_advanced_filter(
    products: List[Dict], 
    total_budget: Optional[Dict] = None,
    category_budgets: Optional[Dict] = None,
    num_outfits: int = 10
) -> List[Dict]:
    """
    Generate outfit combinations with advanced per-category price filtering.
    
    Args:
        products: List of product dictionaries
        total_budget: Dict with min_price and max_price for total outfit
        category_budgets: Dict with category-specific budgets, e.g.:
            {
                'tops': {'min': 0, 'max': 50},
                'bottoms': {'min': 0, 'max': 80},
                'shoes': {'min': 0, 'max': 100},
                'accessories': {'min': 0, 'max': 30}
            }
        num_outfits: Number of outfits to generate
    
    Returns:
        List of outfit dictionaries
    """
    
    def filter_by_price(items: List[Dict], category_key: str) -> List[Dict]:
        """Filter items by category budget if specified."""
        if not category_budgets or category_key not in category_budgets:
            return items
        
        budget = category_budgets[category_key]
        return [
            item for item in items 
            if budget.get('min', 0) <= float(item.get('price', 0)) <= budget.get('max', float('inf'))
        ]
    
    # Categorize and filter products by category budgets
    tops = filter_by_price(
        [p for p in products if p.get('category', '').lower() in ['top', 'tops', 'shirt', 'blouse', 'sweater', 't-shirt']],
        'tops'
    )
    bottoms = filter_by_price(
        [p for p in products if p.get('category', '').lower() in ['bottom', 'bottoms', 'pants', 'jeans', 'shorts', 'skirt']],
        'bottoms'
    )
    dresses = filter_by_price(
        [p for p in products if p.get('category', '').lower() in ['dress', 'dresses', 'jumpsuit', 'romper']],
        'dresses'
    )
    shoes = filter_by_price(
        [p for p in products if p.get('category', '').lower() in ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'heels']],
        'shoes'
    )
    accessories = filter_by_price(
        [p for p in products if p.get('category', '').lower() in ['accessory', 'accessories', 'bag', 'jewelry', 'hat', 'belt', 'scarf']],
        'accessories'
    )
    
    outfits = []
    min_price = total_budget.get('min_price', 0) if total_budget else 0
    max_price = total_budget.get('max_price', float('inf')) if total_budget else float('inf')
    
    # Generate dress-based outfits
    for dress in dresses:
        if len(outfits) >= num_outfits:
            break
            
        for shoe in (shoes if shoes else [None]):
            if len(outfits) >= num_outfits:
                break
                
            outfit_items = [dress]
            outfit_price = float(dress.get('price', 0))
            
            if shoe:
                outfit_items.append(shoe)
                outfit_price += float(shoe.get('price', 0))
            
            # Try with and without accessory
            accessory_options = [None] + (accessories[:3] if accessories else [])
            for accessory in accessory_options:
                temp_items = outfit_items.copy()
                temp_price = outfit_price
                
                if accessory:
                    temp_items.append(accessory)
                    temp_price += float(accessory.get('price', 0))
                
                # Check budget constraints
                if min_price <= temp_price <= max_price:
                    outfits.append({
                        'items': temp_items,
                        'total_price': temp_price,
                        'outfit_type': 'dress'
                    })
                    break
    
    # Generate top + bottom outfits
    for top in tops:
        if len(outfits) >= num_outfits:
            break
            
        for bottom in bottoms:
            if len(outfits) >= num_outfits:
                break
                
            base_price = float(top.get('price', 0)) + float(bottom.get('price', 0))
            
            for shoe in (shoes if shoes else [None]):
                if len(outfits) >= num_outfits:
                    break
                    
                outfit_items = [top, bottom]
                outfit_price = base_price
                
                if shoe:
                    outfit_items.append(shoe)
                    outfit_price += float(shoe.get('price', 0))
                
                # Try with and without accessory
                accessory_options_sep = [None] + (accessories[:2] if accessories else [])
                for accessory in accessory_options_sep:
                    temp_items = outfit_items.copy()
                    temp_price = outfit_price
                    
                    if accessory:
                        temp_items.append(accessory)
                        temp_price += float(accessory.get('price', 0))
                    
                    # Check budget constraints
                    if min_price <= temp_price <= max_price:
                        outfits.append({
                            'items': temp_items,
                            'total_price': temp_price,
                            'outfit_type': 'separates'
                        })
                        break
    
    return outfits[:num_outfits]
