import os
import glob
import datetime
import hashlib
import psycopg2

def sha256_of_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
    cur = conn.cursor()
    cur.execute("SELECT file_hash FROM cases;")
    db_hashes = set(r[0] for r in cur.fetchall() if r[0])
    conn.close()

    # 1. Check Downloads folder
    download_dir = os.path.expanduser(r"~\Downloads")
    now = datetime.datetime.now()
    dl_pdfs = glob.glob(os.path.join(download_dir, "*.pdf"))
    print(f"Total PDFs in Downloads: {len(dl_pdfs)}")
    
    recent_dl = []
    for p in dl_pdfs:
        try:
            mt = datetime.datetime.fromtimestamp(os.path.getmtime(p))
            if (now - mt).days <= 3:
                recent_dl.append((p, mt, os.path.getsize(p)))
        except Exception:
            pass
    recent_dl.sort(key=lambda x: x[1], reverse=True)
    print(f"PDFs downloaded in the last 3 days: {len(recent_dl)}")
    for p, mt, sz in recent_dl[:25]:
        print(f"  {mt.strftime('%Y-%m-%d %H:%M')} | {sz:8d} bytes | {os.path.basename(p)}")

    # 2. Check the 115 not yet in DB from backend/storage/cases
    target_dir = r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases"
    files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".pdf")]
    
    not_in_db = {}
    for f in files:
        h = sha256_of_file(f)
        if h not in db_hashes and h not in not_in_db:
            not_in_db[h] = f

    print(f"\nUnique PDFs in {target_dir} NOT in DB: {len(not_in_db)}")
    for i, (h, path) in enumerate(list(not_in_db.items())[:20]):
        print(f"  [{i+1}] {os.path.basename(path)} (hash: {h[:12]}..., size: {os.path.getsize(path)})")

if __name__ == "__main__":
    main()
