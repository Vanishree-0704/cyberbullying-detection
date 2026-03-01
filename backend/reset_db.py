import os

db_path = "cyberguard.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Successfully deleted {db_path}. Restart your backend to recreate the tables.")
else:
    print(f"{db_path} not found. No action needed.")
