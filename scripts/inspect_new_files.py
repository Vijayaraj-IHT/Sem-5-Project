import os
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
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'cases';")
    cols = [r[0] for r in cur.fetchall()]
    print("Cases columns:", cols)
    
    hash_col = "sha256" if "sha256" in cols else ("file_hash" if "file_hash" in cols else "sha256_hash")
    cur.execute(f"SELECT COUNT(*), COUNT(DISTINCT {hash_col}) FROM cases;")
    count, unique_hash = cur.fetchone()
    print(f"Total cases in DB: {count}, Unique hash: {unique_hash} (hash column: {hash_col})")
    
    cur.execute(f"SELECT id, cnr_number, case_no, title, file_path, {hash_col} FROM cases LIMIT 5;")
    for row in cur.fetchall():
        print("Sample:", row)
        
    cur.execute(f"SELECT {hash_col} FROM cases;")
    db_hashes = set(r[0] for r in cur.fetchall() if r[0])
    print(f"Loaded {len(db_hashes)} distinct hashes from DB")
    
    # Inspect incoming_cases
    incoming_dir = r"E:\SEM 5 PROJECT\Lexguard\backend\incoming_cases"
    if os.path.exists(incoming_dir):
        incoming_files = [os.path.join(incoming_dir, f) for f in os.listdir(incoming_dir) if f.endswith(".pdf")]
        print(f"\nIncoming cases count in {incoming_dir}: {len(incoming_files)}")
        
        inc_already_in_db = 0
        inc_unique_new = {}
        for f in incoming_files:
            h = sha256_of_file(f)
            if h in db_hashes:
                inc_already_in_db += 1
            else:
                if h not in inc_unique_new:
                    inc_unique_new[h] = f
        print(f"In incoming_cases: {inc_already_in_db} already in DB, {len(inc_unique_new)} new unique PDFs to ingest!")

    # Check other folders
    dirs_to_check = [
        r"E:\SEM 5 PROJECT\Lexguard\storage\cases",
        r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases",
        r"E:\SEM 5 PROJECT\LexGuard-HTML\storage\cases",
        r"E:\SEM 5 PROJECT\LexGuard-HTML\backend\storage\cases",
    ]
    for d in dirs_to_check:
        if os.path.exists(d):
            files = [os.path.join(d, f) for f in os.listdir(d) if f.endswith(".pdf")]
            hashes = set(sha256_of_file(f) for f in files)
            new_in_d = hashes - db_hashes
            print(f"\nFolder {d}: {len(files)} files, {len(hashes)} unique hashes. {len(new_in_d)} not yet in DB.")

    conn.close()

if __name__ == "__main__":
    main()
