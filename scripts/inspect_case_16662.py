import psycopg2
import json

conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
cur = conn.cursor()

cur.execute("SELECT id, case_no, title, court, year, judge, act_tags, section_tags, summary, facts, ratio_decidendi, outcome, file_hash FROM cases WHERE title ILIKE '%16662%' OR case_no ILIKE '%16662%';")
rows = cur.fetchall()
print(f"Found {len(rows)} matching case(s):")
for r in rows:
    print("ID:", r[0])
    print("Case No:", r[1])
    print("Title:", r[2])
    print("Court:", r[3])
    print("Year:", r[4])
    print("Judge:", r[5])
    print("Acts:", r[6])
    print("Sections:", r[7])
    print("Summary:", r[8])
    print("Facts:", r[9])
    print("Ratio:", r[10])
    print("Outcome:", r[11])
    print("Hash:", r[12])

conn.close()
