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
    cur.execute("SELECT file_hash FROM cases;")
    db_hashes = set(r[0] for r in cur.fetchall() if r[0])
    conn.close()

    target_dir = r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases"
    files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".pdf")]
    
    not_in_db = {}
    for f in files:
        h = sha256_of_file(f)
        if h not in db_hashes and h not in not_in_db:
            not_in_db[h] = f

    print(f"Total not-in-DB: {len(not_in_db)}")
    
    # Categorize by size
    small_files = [] # < 10KB
    med_files = [] # 10KB - 100KB
    large_files = [] # > 100KB
    
    for h, f in not_in_db.items():
        sz = os.path.getsize(f)
        if sz < 10000:
            small_files.append((h, f, sz))
        elif sz < 100000:
            med_files.append((h, f, sz))
        else:
            large_files.append((h, f, sz))
            
    print(f"Small (<10KB): {len(small_files)}")
    print(f"Medium (10-100KB): {len(med_files)}")
    print(f"Large (>100KB): {len(large_files)}")
    
    print("\n--- Sample Small Files ---")
    for h, f, sz in small_files[:5]:
        sample_text = ""
        try:
            with pdfplumber.open(f) as pdf:
                pages = len(pdf.pages)
                sample_text = pdf.pages[0].extract_text()[:200] if pages > 0 else ""
        except Exception as e:
            sample_text = f"Error: {e}"
        print(f"Small: {os.path.basename(f)} ({sz} bytes, pages: {pages}): {repr(sample_text)}")

    print("\n--- All Large Files ---")
    for h, f, sz in large_files:
        sample_text = ""
        try:
            with pdfplumber.open(f) as pdf:
                pages = len(pdf.pages)
                sample_text = pdf.pages[0].extract_text()[:200] if pages > 0 else ""
        except Exception as e:
            sample_text = f"Error: {e}"
        print(f"Large: {os.path.basename(f)} ({sz} bytes, pages: {pages}): {repr(sample_text)}")

    print("\n--- All Medium Files ---")
    for h, f, sz in med_files:
        sample_text = ""
        try:
            with pdfplumber.open(f) as pdf:
                pages = len(pdf.pages)
                sample_text = pdf.pages[0].extract_text()[:200] if pages > 0 else ""
        except Exception as e:
            sample_text = f"Error: {e}"
        print(f"Med: {os.path.basename(f)} ({sz} bytes, pages: {pages}): {repr(sample_text)}")

if __name__ == "__main__":
    main()
