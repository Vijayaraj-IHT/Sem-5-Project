import psycopg2

conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
cur = conn.cursor()

cases_to_check = ["29834", "1111", "18/2023", "Neville"]
for q in cases_to_check:
    cur.execute("SELECT id, case_no, title, court, file_path FROM cases WHERE case_no ILIKE %s OR title ILIKE %s;", (f"%{q}%", f"%{q}%"))
    res = cur.fetchall()
    print(f"Query '{q}' in DB: {len(res)} matches")
    for r in res:
        print(" ", r)

conn.close()
