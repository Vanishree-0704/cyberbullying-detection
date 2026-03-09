from app.db.database import SessionLocal, Message
db = SessionLocal()
latest = db.query(Message).order_by(Message.id.desc()).limit(5).all()
for m in latest:
    print(f"ID: {m.id}, From: {m.sender_id}, To: {m.receiver_id}, Content: {m.content}")
db.close()
