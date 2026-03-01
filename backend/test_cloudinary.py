import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def test_upload():
    try:
        # Create a tiny dummy image file
        with open("test_image.txt", "w") as f:
            f.write("dummy image data")
        
        print("Attempting upload to Cloudinary...")
        result = cloudinary.uploader.upload("test_image.txt", resource_type="auto")
        print("Upload successful!")
        print("URL:", result.get("secure_url"))
        os.remove("test_image.txt")
    except Exception as e:
        print("Upload failed!")
        print("Error:", str(e))

if __name__ == "__main__":
    test_upload()
