import sqlite3

def check():
    conn = sqlite3.connect('test_omnishield.db')
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print("Tables:", c.fetchall())
    
    # Try querying columns of any likely tables
    for tbl in ['question', 'questions', 'Question', 'Questions']:
        try:
            c.execute(f"PRAGMA table_info({tbl})")
            print(f"Table info for {tbl}:", c.fetchall())
            c.execute(f"SELECT * FROM {tbl} LIMIT 2")
            print(f"Sample from {tbl}:", c.fetchall())
        except Exception as e:
            print(f"Table {tbl} check failed:", e)
    conn.close()

if __name__ == '__main__':
    check()
