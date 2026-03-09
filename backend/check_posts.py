from app.db.database import SessionLocal, Post
db = SessionLocal()
posts = db.query(Post).all()
print(f"Total posts: {len(posts)}")
for p in posts:
    print(f"- {p.id}: {p.caption}")
db.close()
