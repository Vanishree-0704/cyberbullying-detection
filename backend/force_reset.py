from app.db.database import engine, Base, SessionLocal, User
import datetime
from app.core.security import get_password_hash

def reset():
    print("Force Resetting Database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create a fresh test user
        test_user = User(
            username="shree_test",
            email="shree@test.com",
            full_name="Shree Test",
            password=get_password_hash("password123")
        )
        db.add(test_user)
        db.commit()
        print("Database Reset Successful! Created user: shree_test")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset()
