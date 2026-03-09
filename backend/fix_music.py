from app.db.database import SessionLocal, Post
from sqlalchemy import text

db = SessionLocal()
try:
    print("Fixing music URLs for existing posts...")
    # Update Arabic Kuthu
    db.execute(text("UPDATE posts SET music_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' WHERE music_name LIKE '%Arabic Kuthu%' AND music_url IS NULL"))
    db.execute(text("UPDATE posts SET music_cover = 'https://c.saavncdn.com/264/Arabic-Kuthu-From-Beast-Tamil-2022-20220213191500-500x500.jpg' WHERE music_name LIKE '%Arabic Kuthu%' AND music_cover IS NULL"))
    
    # Update Naa Ready
    db.execute(text("UPDATE posts SET music_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' WHERE music_name LIKE '%Naa Ready%' AND music_url IS NULL"))
    
    # Update Hukum
    db.execute(text("UPDATE posts SET music_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' WHERE music_name LIKE '%Hukum%' AND music_url IS NULL"))
    
    db.commit()
    print("Optimization Complete! Existing posts fixed.")
finally:
    db.close()
