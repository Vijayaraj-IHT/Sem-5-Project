import os
import shutil
import hashlib
import psycopg2
import urllib.request
import json

TARGET_DIRS = [
    r"E:\SEM 5 PROJECT\Lexguard\storage\cases",
    r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\storage\cases",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\backend\storage\cases",
]

def sha256_of_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    for d in TARGET_DIRS:
        os.makedirs(d, exist_ok=True)

    conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
    cur = conn.cursor()
    cur.execute("SELECT id, case_no, title, file_path, file_hash FROM cases ORDER BY id;")
    cases = cur.fetchall()
    conn.close()

    total_cases = len(cases)
    print(f"Total cases in DB: {total_cases}")

    # Check each case across all 4 targets
    all_ok = True
    copied_counts = {d: 0 for d in TARGET_DIRS}

    for cid, cno, title, file_path, file_hash in cases:
        base_name = os.path.basename(file_path)
        
        # Find where this file currently exists with the exact matching hash
        source_path = None
        for d in TARGET_DIRS:
            candidate = os.path.join(d, base_name)
            if os.path.isfile(candidate) and sha256_of_file(candidate) == file_hash:
                source_path = candidate
                break

        if not source_path:
            # Try searching anywhere in storage targets by hash
            for d in TARGET_DIRS:
                for f in os.listdir(d):
                    if f.endswith(".pdf"):
                        cand = os.path.join(d, f)
                        if sha256_of_file(cand) == file_hash:
                            source_path = cand
                            break
                if source_path:
                    break

        if not source_path:
            print(f"[ERROR] Could not find file for case {cno} (ID: {cid}, Hash: {file_hash})")
            all_ok = False
            continue

        # Now ensure it exists in all 4 target directories under base_name
        for d in TARGET_DIRS:
            target_path = os.path.join(d, base_name)
            if not os.path.isfile(target_path) or sha256_of_file(target_path) != file_hash:
                shutil.copy2(source_path, target_path)
                copied_counts[d] += 1

    print("\nCopy sync results:")
    for d, cnt in copied_counts.items():
        print(f"  {d}: copied/fixed {cnt} files")

    # Verify all 278 in all targets
    print("\nVerifying 100% SHA-256 match across all 4 directories...")
    perfect = True
    for d in TARGET_DIRS:
        matched = 0
        for cid, cno, title, file_path, file_hash in cases:
            base_name = os.path.basename(file_path)
            cand = os.path.join(d, base_name)
            if os.path.isfile(cand) and sha256_of_file(cand) == file_hash:
                matched += 1
            else:
                perfect = False
        print(f"  {d}: {matched}/{total_cases} matches")

    if perfect:
        print("\nSUCCESS: 100% SHA-256 match for all 278 cases across all 4 storage targets!")
    else:
        print("\nWARNING: Some mismatches detected.")

    # Check live API
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/cases/stats", timeout=5)
        stats = json.loads(req.read().decode())
        print(f"\nLive Backend API Stats: {stats}")
    except Exception as e:
        print(f"\nLive Backend API Stats Error: {e}")

if __name__ == "__main__":
    main()
