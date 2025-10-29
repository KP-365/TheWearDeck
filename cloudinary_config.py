import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("dzncdfwgx"),
    api_key=os.getenv("288863133939886"),
    api_secret=os.getenv("ODcvWzdgwESeFGYYGqT1YcT3LtA"),
    secure=True
)
