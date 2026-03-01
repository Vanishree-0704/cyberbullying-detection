from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal, User, Post, Story, Music
from app.core.security import get_password_hash
import datetime

def seed_database():
    print("Seeding database with high-fidelity discovery content...")
    db = SessionLocal()
    
    # 1. Clear existing data to avoid conflicts
    db.query(Post).delete()
    db.query(Story).delete()
    db.query(User).delete()
    db.query(Music).delete()
    db.commit()

    # 2. Create Sample Users
    users = [
        {"username": "CyberSentinel", "full_name": "System Guardian", "email": "guard@cyber.com", "pic": "https://images.unsplash.com/photo-1531233070488-bd045588659d?w=150"},
        {"username": "vlog_queen", "full_name": "Sarah J", "email": "sarah@vlog.com", "pic": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"},
        {"username": "tech_guru", "full_name": "Alex Tech", "email": "alex@tech.com", "pic": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"},
        {"username": "comedy_king", "full_name": "Vijay", "email": "vijay@comedy.com", "pic": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"},
        {"username": "Vani0704", "full_name": "Vani", "email": "vani0704@gmail.com", "pic": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}
    ]

    db_users = []
    for u in users:
        user = User(
            username=u["username"],
            full_name=u["full_name"],
            email=u["email"],
            password=get_password_hash("password123"),
            profile_pic=u["pic"],
            bio=f"Join the {u['full_name']} protocol."
        )
        db.add(user)
        db_users.append(user)
    
    db.commit()
    # Refresh to gain IDs
    for u in db_users: db.refresh(u)

    # 3. Create Sample Posts (Images)
    posts = [
        {"user": "CyberSentinel", "cap": "Digital Integrity scans complete. All nodes secure. #CyberGuard", "img": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800", "cat": "Tech"},
        {"user": "vlog_queen", "cap": "Sunny mornings and fresh coffee! ☕✨ #MorningVibes", "img": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", "cat": "Vlog"},
        {"user": "tech_guru", "cap": "Building the future, one line of code at a time. #Developer", "img": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800", "cat": "Tech"}
    ]

    for p in posts:
        user = next(u for u in db_users if u.username == p["user"])
        db.add(Post(
            user_id=user.id,
            image_url=p["img"],
            caption=p["cap"],
            category=p["cat"],
            is_reel=False
        ))

    # 4. Create Sample Reels (Videos)
    reels = [
        {"user": "comedy_king", "cap": "When the code finally works on the first try! 😂 #CodingLife", "url": "https://res.cloudinary.com/drtq6q9xv/video/upload/v1708680000/sample_comedy.mp4", "cat": "Comedy", "music": "Hukum - Anirudh"},
        {"user": "tech_guru", "cap": "Check out this insane AI setup! 🤖🚀 #FutureTech", "url": "https://res.cloudinary.com/drtq6q9xv/video/upload/v1708680001/sample_tech.mp4", "cat": "Tech", "music": "Levitating - Dua Lipa"},
        {"user": "vlog_queen", "cap": "My travel diary part 1! 🌍✨ #Travel", "url": "https://res.cloudinary.com/drtq6q9xv/video/upload/v1708680002/sample_vlog.mp4", "cat": "Vlog", "music": "Shape of You - Ed Sheeran"}
    ]

    # Note: Using fallback placeholder videos since we don't know the exact cloudinary public IDs yet
    video_stock = "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-alone-34087-large.mp4"
    
    for r in reels:
        user = next(u for u in db_users if u.username == r["user"])
        db.add(Post(
            user_id=user.id,
            image_url=video_stock,
            caption=r["cap"],
            category=r["cat"],
            is_reel=True,
            music_name=r["music"]
        ))

    # 5. Create Music Library
    songs = [
        {"title": "Hukum", "artist": "Anirudh", "language": "Tamil", "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100"},
        {"title": "Naa Ready", "artist": "Anirudh", "language": "Tamil", "cover": "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100"},
        {"title": "Arabic Kuthu", "artist": "Anirudh", "language": "Tamil", "cover": "https://images.unsplash.com/photo-1514525253361-bee043830ca0?w=100"},
        {"title": "Shape of You", "artist": "Ed Sheeran", "language": "English", "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"},
        {"title": "Levitating", "artist": "Dua Lipa", "language": "English", "cover": "https://images.unsplash.com/photo-1513828583685-c52850918231?w=100"}
    ]
    for s in songs:
        db.add(Music(title=s["title"], artist=s["artist"], language=s["language"], cover_url=s["cover"]))

    # 6. Create Stories
    expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    for u in db_users:
        db.add(Story(
            user_id=u.id,
            media_url=u.profile_pic, # Simulating story with profile pic for now
            mentions=["CyberGuard"],
            expires_at=expires
        ))

    db.commit()
    db.close()
    print("Seeding Complete! Database is now rich with content.")

if __name__ == "__main__":
    seed_database()
