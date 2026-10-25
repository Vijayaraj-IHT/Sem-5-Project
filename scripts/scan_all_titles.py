import psycopg2
import re

conn = psycopg2.connect(dbname='lexguard', user='lexguard', password='lexguard123', host='localhost', port=5432)
cur = conn.cursor()
cur.execute("SELECT id, case_no, title, petitioner, respondent FROM cases ORDER BY title")
rows = cur.fetchall()

print(f"Total cases: {len(rows)}")
for r in rows:
    cid, case_no, title, pet, resp = r
    t = (title or "").strip()
    # Check if title has any numbering prefix like '1. ', '2. ', '24 ', or file-like keywords
    if (
        re.match(r"^[\d\.\-\s]+[A-Za-z]", t) and not t.startswith("202") and not t.startswith("199")  # exclude year citations if any
        or any(w in t.lower() for w in ["judgements", "home _", "yqrgvbuhnu", ".pdf", "crl-mp", "wps-", "cwjc-", "cwp-", "tos-", "osa-", "a-3875"])
        or (" v. " not in t.lower() and " vs " not in t.lower() and " vs. " not in t.lower() and " versus " not in t.lower() and not t.lower().startswith("in re") and not t.lower().startswith("in the matter"))
    ):
        print(f"SUSPECT: [{cid[:8]}] '{t}' | CaseNo: {case_no}")

cur.close()
conn.close()
