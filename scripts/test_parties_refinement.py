"""
test_parties_refinement.py
Refines party and case number extraction for Bombay, Orissa, Madras, and Gujarat High Courts.
"""
import os
import re
import pdfplumber

src_dir = r"e:\SEM 5 PROJECT\LexGuard-HTML\storage\cases"

def extract_parties_enhanced(text):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    pet_lines = []
    resp_lines = []
    state = "header"

    vs_regex = re.compile(r"^(?:(?:-|–)?\s*(?:v(?:ersus|s)?\.?|v\/s\.?)\s*(?:-|–)?)$", re.I)

    for i, line in enumerate(lines[:35]):
        # Check if line is Versus
        if vs_regex.match(line) or line.lower() in ["versus", "vs.", "vs", "v/s.", "v/s", "-vs-", "-versus-"]:
            state = "resp"
            continue
        if re.search(r"\bversus\b|\bv\/s\.?\b|\bvs\.\b", line, re.I) and not re.search(r"IN THE HIGH COURT", line, re.I):
            parts = re.split(r"\bversus\b|\bv\/s\.?\b|\bvs\.\b", line, flags=re.I)
            if len(parts) == 2 and len(parts[0].strip()) > 3:
                return parts[0].strip(" .-\t…"), parts[1].strip(" .-\t…")

        if state == "header":
            if any(k in line.upper() for k in ["IN THE HIGH COURT", "APPELLATE JURISDICTION", "ORDER DATED", "CNR:", "CORAM", "DATED"]):
                continue
            if re.search(r"(?:WRIT PETITION|CRIMINAL|APPLICATION|APPEAL|ABLAPL|CRL)\s*(?:NO\.?|No)?", line, re.I):
                state = "pet"
                continue

        elif state == "pet":
            if "..." in line or "…" in line or "Petitioner" in line or "Applicant" in line or "Appellant" in line:
                cleaned = re.sub(r"[\.…]*\s*(?:Petitioner|Applicant|Appellant)s?.*", "", line, flags=re.I).strip(" .-\t")
                if cleaned:
                    pet_lines.append(cleaned)
                continue
            if vs_regex.match(line) or line.lower() in ["versus", "vs.", "vs", "v/s.", "v/s"]:
                state = "resp"
                continue
            if not any(k in line.upper() for k in ["ADVOCATE", "APPEARANCE", "CORAM"]):
                pet_lines.append(line)

        elif state == "resp":
            if any(k in line.upper() for k in ["CORAM", "BEFORE", "APPEARANCE", "ORDER", "DATED", "MR.", "MS.", "DR.", "HON'BLE"]):
                break
            if "..." in line or "…" in line or "Respondent" in line or "Opponent" in line or "State" in line:
                cleaned = re.sub(r"[\.…]*\s*(?:Respondent|Opponent)s?.*", "", line, flags=re.I).strip(" .-\t")
                if cleaned:
                    resp_lines.append(cleaned)
                break
            resp_lines.append(line)

    pet = " ".join(pet_lines).strip(" .-\t…") if pet_lines else None
    resp = " ".join(resp_lines).strip(" .-\t…") if resp_lines else None

    # Fallback to regex search
    if not pet or not resp:
        m = re.search(r"\n([^\n]+?)\s*(?:\.\.\.|\…)?\s*(?:Petitioner|Applicant|Appellant)s?\s*\n\s*(?:Versus|Vs\.?|V\/s\.?)\s*\n\s*([^\n]+?)\s*(?:\.\.\.|\…)?\s*(?:Respondent|Opponent)s?", text, re.I)
        if m:
            pet = m.group(1).strip(" .-\t…")
            resp = m.group(2).strip(" .-\t…")

    return pet or "Petitioner", resp or "Respondent / State"

sample_files = [
    "Home _ Judgements and Orders, Supreme Court and High courts of India (2).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(10).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(100).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(101).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(107).pdf",
]

for sf in sample_files:
    full = os.path.join(src_dir, sf)
    if not os.path.exists(full):
        continue
    with pdfplumber.open(full) as pdf:
        txt = pdf.pages[0].extract_text() or ""
    p, r = extract_parties_enhanced(txt)
    print(f"\nFILE: {sf}")
    print(f"  Petitioner: {p}")
    print(f"  Respondent: {r}")
