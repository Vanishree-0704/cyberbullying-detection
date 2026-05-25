import sqlite3

def show_users():
    conn = sqlite3.connect('cyberguard.db')
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, full_name, password FROM users")
        users = cursor.fetchall()
        print("Users in cyberguard.db:")
        print("ID | Username | Email | Full Name | Password (Hash)")
        print("-" * 50)
        for u in users:
            print(f"{u[0]} | {u[1]} | {u[2]} | {u[3]} | {u[4][:10]}...")
    except Exception as e:
        print("Error reading cyberguard.db:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    show_users()
