import os
import io
import hashlib
from typing import Union

import numpy as np
from PIL import Image


def _generate_simple_embedding(input_data: str, embedding_size: int = 512) -> list:
    """Generate a simple deterministic embedding for testing purposes.
    
    This is a fallback when external APIs are not available.
    In production, you'd want to use a proper CLIP model.
    """
    # Create a deterministic hash-based embedding
    hash_obj = hashlib.sha256(input_data.encode())
    hash_bytes = hash_obj.digest()
    
    # Convert to float values between -1 and 1
    embedding = []
    for i in range(embedding_size):
        byte_val = hash_bytes[i % len(hash_bytes)]
        # Convert byte (0-255) to float (-1 to 1)
        float_val = (byte_val / 127.5) - 1.0
        embedding.append(float_val)
    
    return embedding


def _to_pil_image(image: Union[Image.Image, bytes, bytearray, str]) -> Image.Image:
    """Convert various image formats to PIL Image"""
    if isinstance(image, Image.Image):
        return image
    if isinstance(image, (bytes, bytearray)):
        return Image.open(io.BytesIO(image))
    if isinstance(image, str):
        return Image.open(image)
    raise TypeError("Unsupported image type. Provide PIL.Image, bytes, or path string.")


def generate_embedding(image=None, text=None):
    """Generate embeddings using a simple fallback method.
    
    This is a placeholder implementation that creates deterministic embeddings
    based on input content. In production, replace with proper CLIP model.
    
    - text: str → returns text embedding (list[float])
    - image: PIL.Image | bytes | path → returns image embedding (list[float])
    """
    if image is None and text is None:
        return None

    if text is not None:
        # Generate embedding based on text content
        return _generate_simple_embedding(f"text:{text}")
    
    if image is not None:
        # Generate embedding based on image properties
        pil_image = _to_pil_image(image)
        # Create a simple representation based on image properties
        image_data = f"image:{pil_image.size[0]}x{pil_image.size[1]}:{pil_image.mode}"
        return _generate_simple_embedding(image_data)
    
    return None
