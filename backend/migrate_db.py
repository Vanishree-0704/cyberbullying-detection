from app.db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    print("Migrating messages table...")
    try:
        conn.execute(text("ALTER TABLE messages ADD COLUMN likes_count INTEGER DEFAULT 0"))
        print("Added likes_count to messages")
    except: print("likes_count already exists")
    try:
        conn.execute(text("ALTER TABLE messages ADD COLUMN is_recalled BOOLEAN DEFAULT 0"))
        print("Added is_recalled to messages")
    except: print("is_recalled already exists")
    
    print("Migrating posts and stories table with covers...")
    try:
        conn.execute(text("ALTER TABLE posts ADD COLUMN music_cover TEXT"))
        print("Added music_cover to posts")
    except: print("music_cover already exists in posts")
    try:
        conn.execute(text("ALTER TABLE stories ADD COLUMN music_cover TEXT"))
        print("Added music_cover to stories")
    except: print("music_cover already exists in stories")
    
    conn.commit()
    print("Migration complete!")
