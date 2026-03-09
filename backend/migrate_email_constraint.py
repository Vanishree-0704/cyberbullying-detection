import sqlite3
import os

db_path = 'cyberguard_v100.db'
if not os.path.exists(db_path):
    print("Database not found.")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Modifying users table to remove unique constraint on email...")
    
    # 1. Create a temporary table with the new schema
    cursor.execute("""
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR UNIQUE,
            email VARCHAR,
            full_name VARCHAR,
            password VARCHAR,
            profile_pic VARCHAR,
            bio VARCHAR,
            followers_count INTEGER,
            following_count INTEGER
        )
    """)
    
    # 2. Copy data from old to new
    cursor.execute("""
        INSERT INTO users_new (id, username, email, full_name, password, profile_pic, bio, followers_count, following_count)
        SELECT id, username, email, full_name, password, profile_pic, bio, followers_count, following_count FROM users
    """)
    
    # 3. Drop old table
    cursor.execute("DROP TABLE users")
    
    # 4. Rename new table to original
    cursor.execute("ALTER TABLE users_new RENAME TO users")
    
    # 5. Recreate indexes if needed (Base.metadata.create_all usually handles this, but let's be safe)
    cursor.execute("CREATE INDEX ix_users_username ON users (username)")
    cursor.execute("CREATE INDEX ix_users_id ON users (id)")
    cursor.execute("CREATE INDEX ix_users_email ON users (email)")
    
    conn.commit()
    print("✅ Success! Database schema updated to allow multiple accounts per email.")
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    conn.close()
