import os
import re
import pdfplumber
import psycopg2

def main():
    conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
    cur = conn.cursor()
    cur.execute("SELECT id, case_no, title, file_path, file_hash FROM cases;")
    all_cases = cur.fetchall()
    conn.close()

    db_by_case_no = {c[1].lower().strip(): c for c in all_cases if c[1]}
    db_by_hash = {c[4]: c for c in all_cases if c[4]}

    target_dir = r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases"
    small_files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".pdf") and os.path.getsize(os.path.join(target_dir, f)) < 10000]

    matched_by_caseno = 0
    unmatched_cases = []

    for f in small_files:
        try:
            with pdfplumber.open(f) as pdf:
                text = pdf.pages[0].extract_text() or ""
                m = re.search(r"CASE NO:\s*([^\n\r(]+)", text)
                if m:
                    cno = m.group(1).lower().strip()
                    # clean up
                    found = False
                    for db_no in db_by_case_no:
                        if cno in db_no or db_no in cno:
                            matched_by_caseno += 1
                            found = True
                            break
                    if not found:
                        unmatched_cases.append((os.path.basename(f), cno, text[:150]))
                else:
                    unmatched_cases.append((os.path.basename(f), "NO_MATCH", text[:150]))
        except Exception as e:
            pass

    print(f"Total small template files: {len(small_files)}")
    print(f"Matched existing cases by case_no: {matched_by_caseno}")
    print(f"Unmatched template files: {len(unmatched_cases)}")
    for u in unmatched_cases[:10]:
        print("  Unmatched:", u)

if __name__ == "__main__":
    main()
