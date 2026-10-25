"""
find_user_added_pdfs.py
Searches:
1. Workspace root: e:\\SEM 5 PROJECT\\
2. Subfolders: Lexguard, LexGuard-HTML, incoming_pdfs, storage, etc.
3. User profile directories: Desktop, Documents, Downloads, etc.
Finds all PDFs added/modified today or unindexed in LexGuard database.
"""
import os
import sys
import time
import hashlib
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.core.database import SessionLocal
from app.models.case import Case

db = SessionLocal()
all_db_cases = db.query(Case).all()
db_hashes = set(c.file_hash for c in all_db_cases if c.file_hash)
db_case_nos = set(c.case_no for c in all_db_cases if c.case_no)
db_files = set(os.path.basename(c.file_path) for c in all_db_cases if c.file_path)
db.close()

print(f"Indexed cases in DB: {len(all_db_cases)}")

search_locations = [
    r"e:\SEM 5 PROJECT\Lexguard",
    r"e:\SEM 5 PROJECT\LexGuard-HTML",
    r"e:\SEM 5 PROJECT",
    r"C:\Users\Vijay Raj\Desktop",
    r"C:\Users\Vijay Raj\Documents",
    r"C:\Users\Vijay Raj\Downloads",
]

# Find where Windows actual Downloads folder is located via registry or environment
import winreg
try:
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders") as key:
        downloads_guid = "{374DE290-123F-4565-9164-39C4925E467B}"
        try:
            val, _ = winreg.QueryValueEx(key, downloads_guid)
            expanded = os.path.expandvars(val)
            if expanded not in search_locations and os.path.exists(expanded):
                search_locations.append(expanded)
                print(f"Detected Windows Downloads folder: {expanded}")
        except Exception:
            pass
except Exception as e:
    print("Could not query registry for Downloads:", e)

unindexed_pdfs = []
all_found_pdfs = []

cutoff_today = datetime(2026, 10, 24, 0, 0, 0).timestamp()

for loc in search_locations:
    if not os.path.exists(loc):
        continue
    for root, dirs, files in os.walk(loc):
        if any(x in root.lower() for x in [".git", "venv", "node_modules", "$recycle.bin", ".gemini", "appdata"]):
            continue
        for f in files:
            if f.lower().endswith(".pdf"):
                full_path = os.path.join(root, f)
                try:
                    sz = os.path.getsize(full_path)
                    mt = os.path.getmtime(full_path)
                    ct = os.path.getctime(full_path)
                    latest_t = max(mt, ct)
                    all_found_pdfs.append((full_path, latest_t, sz))

                    # Check hash
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                        h = hashlib.sha256(data).hexdigest()

                    if h not in db_hashes and f not in db_files:
                        unindexed_pdfs.append({
                            "path": full_path,
                            "filename": f,
                            "size": sz,
                            "mtime": latest_t,
                            "hash": h
                        })
                except Exception as ex:
                    pass

print(f"\nTotal PDF files scanned: {len(all_found_pdfs)}")
print(f"Unindexed PDF files found: {len(unindexed_pdfs)}")

# Sort unindexed by mtime descending
unindexed_pdfs.sort(key=lambda x: x["mtime"], reverse=True)

for idx, u in enumerate(unindexed_pdfs, 1):
    dt_str = datetime.fromtimestamp(u["mtime"]).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{idx}] [{dt_str}] ({u['size']:>9} bytes) {u['filename']}")
    print(f"     Path: {u['path']}")
    print(f"     SHA-256: {u['hash'][:16]}...")
