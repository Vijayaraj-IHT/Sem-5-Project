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
    db_hashes = set(r[0] for r in cur.fetchall())
    conn.close()

    print(f"Loaded {len(db_hashes)} hashes from DB.")

    all_pdfs = []
    for root in [r"E:\SEM 5 PROJECT\Lexguard", r"E:\SEM 5 PROJECT\LexGuard-HTML"]:
        for dirpath, _, filenames in os.walk(root):
            if ".git" in dirpath or "node_modules" in dirpath:
                continue
            for f in filenames:
                if f.lower().endswith(".pdf"):
                    all_pdfs.append(os.path.join(dirpath, f))

    print(f"Total PDFs found across both projects: {len(all_pdfs)}")

    unique_unindexed = {}
    for p in all_pdfs:
        h = sha256_of_file(p)
        if h not in db_hashes:
            unique_unindexed.setdefault(h, []).append(p)

    print(f"Total unique unindexed hashes: {len(unique_unindexed)}")

    authentic_new_judgments = []

    for h, paths in unique_unindexed.items():
        sample_p = paths[0]
        sz = os.path.getsize(sample_p)
        if sz < 10000: # synthetic templates
            continue
        try:
            with pdfplumber.open(sample_p) as pdf:
                text = (pdf.pages[0].extract_text() or "") if len(pdf.pages) > 0 else ""
                if "Gap Analysis" in text or "Project Redesign" in text:
                    continue
                authentic_new_judgments.append((h, sample_p, len(pdf.pages), sz, text[:200]))
        except Exception:
            pass

    print(f"\nAuthentic unindexed judgments found: {len(authentic_new_judgments)}")
    for h, p, pages, sz, snippet in authentic_new_judgments:
        print(f"\nFile: {os.path.basename(p)} ({pages} pages, {sz} bytes, hash: {h[:12]}...)")
        print(f"Snippet: {repr(snippet)}")

if __name__ == "__main__":
    main()
