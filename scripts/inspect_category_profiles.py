import psycopg2
from collections import Counter

conn = psycopg2.connect(dbname="lexguard", user="lexguard", password="lexguard123", host="localhost", port=5432)
cur = conn.cursor()
cur.execute("SELECT id, title, comparison_profile FROM cases")
rows = cur.fetchall()

categories = Counter()
for cid, title, prof in rows:
    cat = (prof or {}).get("category", "UNKNOWN")
    categories[cat] += 1

print(f"Total cases: {len(rows)}")
print("Categories distribution:")
for cat, cnt in categories.most_common():
    print(f"  {cat}: {cnt}")

print("\n--- SAMPLE CATEGORY FACTS ---")
for cid, title, prof in rows[:5]:
    cf = (prof or {}).get("category_facts", {})
    print(f"Title: {title[:60]}")
    print(f"  Category: {cf.get('category')}")
    for k, v in cf.items():
        if k != "category" and v is not None and v != False:
            print(f"    {k}: {v}")
    print("-" * 50)

cur.close()
conn.close()
