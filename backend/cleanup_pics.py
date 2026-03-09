from app.db.database import SessionLocal, User
db = SessionLocal()
broken_link = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
users = db.query(User).filter(User.profile_pic == broken_link).all()
for u in users:
    u.profile_pic = None
db.commit()
print(f"Updated {len(users)} users' pictures.")
db.close()
