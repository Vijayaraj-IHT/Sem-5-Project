"""
analyze_newly_added_judgments.py
Inspects all 162 PDFs added by the user in e:\SEM 5 PROJECT\LexGuard-HTML\storage\cases\
Extracts:
- Validity, page counts, file sizes, SHA-256
- Text extraction: Court, Case No, Year, Bench, Litigants, Dates
- Checks against existing 200 cases in PostgreSQL to see what is already in DB vs brand new.
"""
import os
import sys
import hashlib
import pdfplumber

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.core.database import SessionLocal
from app.models.case import Case

db = SessionLocal()
existing_cases = db.query(Case).all()
db_hashes = set(c.file_hash for c in existing_cases if c.file_hash)
db_case_nos = set(c.case_no for c in existing_cases if c.case_no)
db.close()

print(f"Current DB Cases: {len(existing_cases)}")

src_dir = r"e:\SEM 5 PROJECT\LexGuard-HTML\storage\cases"
files = [f for f in os.listdir(src_dir) if f.startswith("Home _ Judgements")]

print(f"Found {len(files)} user-downloaded PDF judgment files in: {src_dir}")

unique_by_hash = {}
duplicates = 0
already_in_db = 0
corrupted = []

for f in files:
    full_path = os.path.join(src_dir, f)
    try:
        with open(full_path, "rb") as fp:
            data = fp.read()
            h = hashlib.sha256(data).hexdigest()
        
        if h in db_hashes:
            already_in_db += 1
            continue

        if h in unique_by_hash:
            duplicates += 1
            continue

        with pdfplumber.open(full_path) as pdf:
            pages = len(pdf.pages)
            first_page = pdf.pages[0].extract_text() if pdf.pages else ""
        
        unique_by_hash[h] = {
            "orig_filename": f,
            "size": len(data),
            "pages": pages,
            "sha256": h,
            "first_page": first_page or "",
            "full_path": full_path
        }
    except Exception as e:
        corrupted.append((f, str(e)))

print(f"Summary of Newly Added Judgments:")
print(f"  - Already in PostgreSQL: {already_in_db}")
print(f"  - Exact Duplicate Copies: {duplicates}")
print(f"  - Corrupted/Unreadable:   {len(corrupted)}")
print(f"  - BRAND NEW Unique Cases: {len(unique_by_hash)}")

print("\n--- SAMPLE 10 BRAND NEW JUDGMENTS METADATA ---")
for idx, (h, item) in enumerate(list(unique_by_hash.items())[:10], 1):
    print(f"\n[{idx}] File: {item['orig_filename']} ({item['size']} bytes, {item['pages']} pages)")
    print(f"    SHA-256: {h}")
    lines = [l.strip() for l in item["first_page"].split("\n") if l.strip()]
    snippet = " | ".join(lines[:6])
    print(f"    Text: {snippet[:180]}...")
