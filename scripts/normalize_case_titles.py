import sys
import os
import json
import psycopg2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.prepare_normalized_data import NORMALIZATION_MAP

def normalize_titles():
    conn = psycopg2.connect(
        dbname="lexguard", user="lexguard", password="lexguard123", host="localhost", port=5432
    )
    cur = conn.cursor()
    
    print(f"Applying authentic cause title normalization to {len(NORMALIZATION_MAP)} cases...")
    updated_count = 0

    for cid, data in NORMALIZATION_MAP.items():
        title = data["title"]
        case_no = data["case_no"]
        petitioner = data["petitioner"]
        respondent = data["respondent"]
        parties = data["parties"]

        # Fetch current comparison_profile
        cur.execute("SELECT comparison_profile FROM cases WHERE id = %s", (cid,))
        row = cur.fetchone()
        if not row:
            print(f"WARNING: Case ID {cid} not found in database!")
            continue

        comp_prof = row[0] or {}
        comp_prof["title"] = title
        comp_prof["case_no"] = case_no
        comp_prof["petitioner"] = petitioner
        comp_prof["respondent"] = respondent
        comp_prof["parties"] = parties

        # Update case record
        cur.execute(
            """
            UPDATE cases
            SET title = %s,
                case_no = %s,
                petitioner = %s,
                respondent = %s,
                parties = %s,
                comparison_profile = %s
            WHERE id = %s
            """,
            (title, case_no, petitioner, respondent, parties, json.dumps(comp_prof), cid)
        )
        updated_count += 1

    conn.commit()
    print(f"Successfully updated {updated_count} cases in PostgreSQL!")

    # Verification: check all 278 cases
    cur.execute("SELECT id, case_no, title, petitioner, respondent FROM cases ORDER BY title")
    all_rows = cur.fetchall()
    print(f"Total cases in database: {len(all_rows)}")

    bad_cases = []
    for r in all_rows:
        cid, cno, t, p, resp = r
        t_clean = (t or "").strip().lower()
        if (
            not t_clean
            or any(t_clean.endswith(ext) for ext in [".pdf", ".tmp", ".txt"])
            or any(w in t_clean for w in ["judgements", "home _", "yqrgvbuhnu"])
            or (" v. " not in t_clean and " vs " not in t_clean and " vs. " not in t_clean and " versus " not in t_clean and not t_clean.startswith("in re") and not t_clean.startswith("in the matter"))
            or (t_clean[0].isdigit() and any(c in t_clean[:10] for c in ["-", "_", " "]) and any(w in t_clean for w in ["crl", "wp", "wps", "cwp", "tos", "osa", "cmp", "cwjc"]))
        ):
            bad_cases.append((cid, cno, t))

    if bad_cases:
        print(f"FAILED: {len(bad_cases)} cases still have abnormal titles:")
        for b in bad_cases:
            print(b)
    else:
        print("VERIFICATION SUCCESS: All 278 cases have authentic legal cause titles (Petitioner v. Respondent)!")

    cur.close()
    conn.close()

if __name__ == "__main__":
    normalize_titles()
