import os
import glob
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
    cur.execute("SELECT file_hash, case_no, title FROM cases;")
    db_cases = {r[0]: (r[1], r[2]) for r in cur.fetchall() if r[0]}
    conn.close()

    case_files = glob.glob(r"E:\SEM 5 PROJECT\Lexguard\storage\cases\Lexguard case (*).pdf")
    print(f"Total 'Lexguard case (*).pdf' files found: {len(case_files)}")
    
    corrupt_or_tiny = []
    already_in_db = []
    new_valid = []
    
    unique_hashes = {}
    
    for f in case_files:
        sz = os.path.getsize(f)
        if sz < 1000:
            corrupt_or_tiny.append((f, sz))
            continue
        h = sha256_of_file(f)
        if h in db_cases:
            already_in_db.append((f, sz, h, db_cases[h]))
        else:
            if h not in unique_hashes:
                unique_hashes[h] = f
                new_valid.append((f, sz, h))
            else:
                pass # duplicate within the batch
                
    print(f"Corrupt or tiny (<1KB): {len(corrupt_or_tiny)}")
    for f, sz in corrupt_or_tiny:
        with open(f, "rb") as fp:
            content = fp.read()
        print(f"  {os.path.basename(f)} ({sz} bytes): {repr(content[:60])}")
        
    print(f"\nAlready in DB: {len(already_in_db)}")
    for f, sz, h, info in already_in_db[:5]:
        print(f"  {os.path.basename(f)} -> DB case: {info[0]} | {info[1]}")
        
    print(f"\nNEW UNIQUE VALID PDFs TO INGEST: {len(new_valid)}")
    for f, sz, h in new_valid:
        print(f"  {os.path.basename(f)} ({sz} bytes, hash: {h[:12]}...)")

if __name__ == "__main__":
    main()
