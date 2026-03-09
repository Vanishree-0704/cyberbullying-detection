from app.db.database import SessionLocal, Message
from sqlalchemy import text
db = SessionLocal()
res = db.execute(text("SELECT * FROM messages LIMIT 3")).fetchall()
for r in res:
    print(r)
db.close()
