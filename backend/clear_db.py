import sqlite3

def clear_db():
    conn = sqlite3.connect('cyberguard.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    for table_name in tables:
        if table_name[0] != 'sqlite_sequence':
            try:
                cursor.execute(f"DELETE FROM {table_name[0]};")
                print(f"Cleared table: {table_name[0]}")
            except Exception as e:
                print(f"Error clearing table {table_name[0]}: {e}")
                
    conn.commit()
    conn.close()
    print("Database cleared successfully!")

if __name__ == "__main__":
    clear_db()
