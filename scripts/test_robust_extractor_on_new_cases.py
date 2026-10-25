"""
test_robust_extractor_on_new_cases.py
Multi-court robust metadata extractor tested against all 78 unique user-added PDFs.
"""
import os
import re
import hashlib
from datetime import datetime
import pdfplumber

src_dir = r"e:\SEM 5 PROJECT\LexGuard-HTML\storage\cases"
files = [f for f in os.listdir(src_dir) if f.startswith("Home _ Judgements")]

def extract_court(text):
    t = text.upper()
    if "HIGH COURT OF JUDICATURE AT BOMBAY" in t or "BOMBAY HIGH COURT" in t:
        if "NAGPUR BENCH" in t:
            return "High Court of Judicature at Bombay (Nagpur Bench)"
        if "AURANGABAD BENCH" in t:
            return "High Court of Judicature at Bombay (Aurangabad Bench)"
        return "High Court of Judicature at Bombay"
    if "HIGH COURT OF GUJARAT" in t or "GUJARAT AT AHMEDABAD" in t:
        return "High Court of Gujarat at Ahmedabad"
    if "HIGH COURT OF JUDICATURE AT MADRAS" in t or "MADRAS HIGH COURT" in t:
        if "MADURAI BENCH" in t:
            return "Madras High Court (Madurai Bench)"
        return "Madras High Court (Principal Seat, Chennai)"
    if "HIGH COURT OF ORISSA" in t or "ORISSA AT CUTTACK" in t:
        return "High Court of Orissa at Cuttack"
    if "JAMMU & KASHMIR" in t or "JAMMU AND KASHMIR" in t:
        return "High Court of Jammu & Kashmir and Ladakh"
    if "HIGH COURT AT CALCUTTA" in t or "CALCUTTA" in t:
        return "High Court at Calcutta"
    if "HIGH COURT OF JUDICATURE AT ALLAHABAD" in t or "ALLAHABAD" in t:
        return "High Court of Judicature at Allahabad"
    if "HIGH COURT OF KERALA" in t:
        return "High Court of Kerala at Ernakulam"
    if "SUPREME COURT OF INDIA" in t:
        return "Supreme Court of India"
    return "High Court of Judicature"

def extract_cnr(text):
    m = re.search(r"\b([A-Z]{2,4}\d{8,14}[0-9A-Z]{0,4})\b", text)
    if m:
        c = m.group(1)
        if len(c) == 16:
            return c
    m2 = re.search(r"CNR\s*(?:NO\.?|:)?\s*\{?([A-Za-z0-9]{16})\}?", text, re.I)
    if m2:
        return m2.group(1).upper()
    m3 = re.search(r"\(([A-Z]{4}\d{12})\)", text)
    if m3:
        return m3.group(1).upper()
    return None

def extract_case_no(text):
    patterns = [
        r"(WRIT PETITION (?:NO\.?|NO|L)?\s*[0-9\/\-\s]+(?:OF\s+[0-9]{4})?)",
        r"(COMMERCIAL ARBITRATION APPLICATION\s*(?:NO\.?|NO)?\s*[0-9\/\-\s]+(?:OF\s+[0-9]{4})?)",
        r"(R\/(?:CRIMINAL|CIVIL)[^\n]+?NO\.?\s*[0-9\/\-\s]+(?:of\s+[0-9]{4})?)",
        r"(CRL\.?\s*O\.?P\.?\s*(?:NO\.?|NOS\.?)\s*[0-9\/\-\s]+(?:OF\s+[0-9]{4})?)",
        r"(CRIMINAL REVISION APPLICATION\s*(?:NO\.?|NO)?\s*[0-9\/\-\s]+(?:OF\s+[0-9]{4})?)",
        r"(ABLAPL\s*(?:No\.?|No)?\s*[0-9\/\-\s]+(?:of\s+[0-9]{4})?)",
        r"(WP\([A-Z]+\)\s*(?:No\.?|No)?\s*[0-9\/\-\s]+(?:\/[0-9]{4})?)",
        r"(CIVIL APPLICATION\s*(?:[A-Z]+\s*)?NO\.?\s*[0-9\/\-\s]+(?:OF\s+[0-9]{4})?)",
        r"([A-Z\.\(\)\/\s]{3,35}\s+NO\.?\s*\d+\s+OF\s+\d{4})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            clean = " ".join(m.group(1).split())
            if len(clean) < 60:
                return clean
    return None

def extract_parties(text):
    clean = text.replace("…", " ... ").replace("", " ... ")
    # Try Vs / Versus
    m = re.search(r"([^\n]{3,80}?)\s+(?:Versus|Vs\.?|V\/s\.?)\s+([^\n]{3,80})", clean, re.I)
    if m:
        pet = m.group(1).strip(" .-\t\r")
        resp = m.group(2).strip(" .-\t\r")
        # clean noise
        pet = re.sub(r"\b(Petitioner|Applicant|Appellant)s?\b", "", pet, flags=re.I).strip(" .-\t\r")
        resp = re.sub(r"\b(Respondent|Opponent)s?\b", "", resp, flags=re.I).strip(" .-\t\r")
        if pet and resp and len(pet) > 2 and len(resp) > 2:
            return pet[:120], resp[:120]
    return None, None

def extract_judge(text):
    m = re.search(r"CORAM\s*:\s*([^\n]+)", text, re.I)
    if m:
        j = m.group(1).strip(" :.-")
        if len(j) > 3 and len(j) < 80:
            return j
    m2 = re.search(r"(?:THE\s+)?HON['’]BLE\s+(?:MR\.?|MS\.?|JUSTICE)\s+([^\n]+)", text, re.I)
    if m2:
        j = "Hon'ble " + m2.group(1).strip(" :.-")
        if len(j) < 80:
            return j
    return "Hon'ble Bench"

def extract_year(text, case_no):
    if case_no:
        m = re.findall(r"(?:19|20)\d{2}", case_no)
        if m:
            return int(m[-1])
    m2 = re.findall(r"(?:19|20)\d{2}", text[:1000])
    if m2:
        return int(m2[0])
    return 2026

seen_hashes = set()
unique_cases = []

for f in files:
    full = os.path.join(src_dir, f)
    with open(full, "rb") as fp:
        h = hashlib.sha256(fp.read()).hexdigest()
    if h in seen_hashes:
        continue
    seen_hashes.add(h)

    with pdfplumber.open(full) as pdf:
        first_page = pdf.pages[0].extract_text() or ""
        total_pages = len(pdf.pages)
        last_page = pdf.pages[-1].extract_text() or "" if total_pages > 1 else first_page

    court = extract_court(first_page)
    case_no = extract_case_no(first_page)
    cnr = extract_cnr(first_page)
    pet, resp = extract_parties(first_page)
    judge = extract_judge(first_page)
    yr = extract_year(first_page, case_no)

    unique_cases.append({
        "file": f,
        "hash": h,
        "court": court,
        "case_no": case_no or f"Judicial Matter ({h[:8]})",
        "cnr": cnr,
        "petitioner": pet or "Petitioner",
        "respondent": resp or "Respondent / State",
        "judge": judge,
        "year": yr,
        "pages": total_pages
    })

print(f"Total Unique Cases Parsed: {len(unique_cases)}")
courts_count = {}
for u in unique_cases:
    courts_count[u["court"]] = courts_count.get(u["court"], 0) + 1

print("\nCourt Breakdown across New Judgments:")
for c, cnt in courts_count.items():
    print(f"  {c:45}: {cnt} cases")

print("\nSample 10 Parsed Judgments:")
for idx, u in enumerate(unique_cases[:10], 1):
    print(f"[{idx}] {u['case_no']} ({u['year']}) | {u['court']}")
    print(f"    Parties: {u['petitioner']} v. {u['respondent']}")
    print(f"    Judge: {u['judge']} | CNR: {u['cnr'] or 'N/A'}")
