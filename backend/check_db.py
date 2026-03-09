from app.db.database import SessionLocal, User
db = SessionLocal()
users = db.query(User).all()
print(f"Total users: {len(users)}")
for u in users:
    print(f"- {u.username}")
db.close()
