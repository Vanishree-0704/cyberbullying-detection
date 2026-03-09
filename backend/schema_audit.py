from app.db.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
res = db.execute(text("PRAGMA table_info(messages)")).fetchall()
print("MESSAGES TABLE:", [r[1] for r in res])
res = db.execute(text("PRAGMA table_info(music)")).fetchall()
print("MUSIC TABLE:", [r[1] for r in res])
db.close()
