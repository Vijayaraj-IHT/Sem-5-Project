import psycopg2

def unify():
    conn = psycopg2.connect(dbname="lexguard", user="lexguard", password="lexguard123", host="localhost", port=5432)
    cur = conn.cursor()
    cur.execute("UPDATE cases SET status = 'published' WHERE status != 'published'")
    conn.commit()
    print("Updated cases to 'published'. Current breakdown:")
    cur.execute("SELECT status, count(*) FROM cases GROUP BY status")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    unify()
