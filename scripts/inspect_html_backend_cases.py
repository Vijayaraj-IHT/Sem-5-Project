import os
import hashlib
import pdfplumber
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
    cur.execute("SELECT file_hash, file_path, case_no, title FROM cases;")
    db_cases = {r[0]: (r[1], r[2], r[3]) for r in cur.fetchall()}
    conn.close()

    target_dir = r"E:\SEM 5 PROJECT\LexGuard-HTML\backend\storage\cases"
    all_files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".pdf")]

    print(f"Total files in {target_dir}: {len(all_files)}")
    
    by_hash = {}
    for f in all_files:
        h = sha256_of_file(f)
        by_hash.setdefault(h, []).append(f)

    print(f"Total unique hashes: {len(by_hash)}")

    # 1. Hashes in DB
    in_db_hashes = {h: files for h, files in by_hash.items() if h in db_cases}
    print(f"Hashes currently in DB: {len(in_db_hashes)} (representing {sum(len(v) for v in in_db_hashes.values())} file copies)")

    # 2. Hashes NOT in DB
    not_in_db_hashes = {h: files for h, files in by_hash.items() if h not in db_cases}
    print(f"Hashes NOT in DB: {len(not_in_db_hashes)} (representing {sum(len(v) for v in not_in_db_hashes.values())} file copies)")

    print("\n--- Detailed Inspection of Hashes NOT in DB ---")
    for h, flist in not_in_db_hashes.items():
        primary = flist[0]
        sz = os.path.getsize(primary)
        first_page = ""
        try:
            with pdfplumber.open(primary) as p:
                pages = len(p.pages)
                if pages > 0:
                    first_page = p.pages[0].extract_text() or ""
        except Exception as e:
            pages = 0
            first_page = str(e)

        # Categorize
        if "Gap Analysis" in first_page:
            cat = "PROJECT_DOC (Gap Analysis)"
        elif "Full Project Redesign" in first_page:
            cat = "PROJECT_DOC (Project Redesign)"
        elif sz < 10000:
            cat = "SYNTHETIC_TEMPLATE (<10KB)"
        else:
            cat = f"POTENTIAL_AUTHENTIC_JUDGMENT ({pages} pages, {sz} bytes)"

        if cat != "SYNTHETIC_TEMPLATE (<10KB)":
            print(f"[{cat}] Hash: {h[:12]} | Files: {[os.path.basename(x) for x in flist]}")
            print(f"   Snippet: {repr(first_page[:150])}")

if __name__ == "__main__":
    main()
