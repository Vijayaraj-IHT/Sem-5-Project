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

    # 1. Check the 3 in Lexguard/storage/cases
    dir1 = r"E:\SEM 5 PROJECT\Lexguard\storage\cases"
    for f in os.listdir(dir1):
        if f.endswith(".pdf"):
            fp = os.path.join(dir1, f)
            h = sha256_of_file(fp)
            if h not in db_hashes:
                print(f"In storage/cases not in DB: {f} (sz: {os.path.getsize(fp)})")

    # 2. Search user directories: Desktop, Downloads, Documents, etc.
    user_home = os.path.expanduser("~")
    search_dirs = [
        os.path.join(user_home, "Downloads"),
        os.path.join(user_home, "Desktop"),
        os.path.join(user_home, "Documents"),
        r"C:\Downloads",
        r"E:\Downloads",
    ]
    # Check OneDrive if exists
    for od in glob.glob(os.path.join(user_home, "OneDrive*")):
        search_dirs.append(od)

    print(f"\nChecking user folders: {search_dirs}")
    now = datetime.datetime.now()
    found_pdfs = []
    for d in search_dirs:
        if os.path.exists(d):
            for root, _, files in os.walk(d):
                if ".git" in root or "AppData" in root:
                    continue
                for f in files:
                    if f.lower().endswith(".pdf"):
                        full_p = os.path.join(root, f)
                        try:
                            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(full_p))
                            ctime = datetime.datetime.fromtimestamp(os.path.getctime(full_p))
                            latest = max(mtime, ctime)
                            if (now - latest).total_seconds() < 86400 * 3:
                                found_pdfs.append((full_p, latest, os.path.getsize(full_p)))
                        except Exception:
                            pass

    print(f"Found {len(found_pdfs)} recent PDFs in user directories:")
    for p, t, sz in sorted(found_pdfs, key=lambda x: x[1], reverse=True)[:30]:
        print(f"  {t.strftime('%Y-%m-%d %H:%M:%S')} | {sz:8d} | {p}")

if __name__ == "__main__":
    main()
