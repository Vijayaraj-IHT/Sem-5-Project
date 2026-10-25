import re

def detect_case_category(text, sections, case_no, title):
    combined = f"{text[:2500]} {' '.join(sections or [])} {case_no} {title}".lower()
    
    # Priority 1: NDPS
    if any(k in combined for k in ["ndps", "narcotic", "psychotropic", "ganja", "nib-cid", "nib cid", "commercial quantity"]):
        return "NDPS"
    
    # Priority 2: Bail / Suspension of Sentence
    if any(k in combined for k in [
        "430", "430(1)", "389", "389(1)", "suspension of sentence", "suspend the sentence",
        "483", "482", "437", "438", "439", "regular bail", "anticipatory bail",
        "petition for bail", "enlarge the petitioner on bail", "surety bond"
    ]):
        if "quash" not in combined or "suspend" in combined or "bail" in combined:
            return "BAIL_SUSPENSION"

    # Priority 3: Quashing
    if any(k in combined for k in ["quash", "crl.op", "crl.o.p", "528", "482", "abuse of process", "fir", "crime no"]):
        return "QUASHING"

    # Priority 4: Service / Writ
    if any(k in combined for k in ["wps", "cwp", "notional promotion", "actual promotion", "retiral", "pension", "service", "regularisation", "department of"]):
        return "SERVICE_WRIT"

    # Priority 5: Commercial / Civil
    if any(k in combined for k in ["trademark", "patent", "copyright", "commercial suit", "t.o.s", "o.s.", "partition", "probate", "passing off"]):
        return "COMMERCIAL_CIVIL"

    return "GENERAL_CONSTITUTIONAL"


def extract_bail_suspension_facts(text):
    facts = {
        "category": "BAIL_SUSPENSION",
        "application_type": "Regular Bail",
        "trial_court_sentence": None,
        "trial_court_fine": None,
        "trial_court_fine_paid": False,
        "bail_bond_amount": None,
        "surety_count": None,
        "custody_period": None,
        "reason_for_relief": None,
        "reporting_condition": None,
    }

    t_lower = text.lower()

    # Application Type
    if "suspend the sentence" in t_lower or "suspension of sentence" in t_lower or "430(1)" in t_lower or "389(1)" in t_lower or "389" in t_lower:
        facts["application_type"] = "Suspension of Sentence"
    elif "anticipatory bail" in t_lower or "438" in t_lower or "482" in t_lower and "anticipatory" in t_lower:
        facts["application_type"] = "Anticipatory Bail"
    elif "statutory bail" in t_lower or "default bail" in t_lower or "167(2)" in t_lower:
        facts["application_type"] = "Default Bail"
    else:
        facts["application_type"] = "Regular Bail"

    # 1. Trial Court Fine (Conviction / Sentence context)
    # e.g., "to pay a fine of Rs.10,000/-", "fine of Rs. 10,000/-"
    fine_m = re.search(r"(?:pay\s+a\s+fine\s+of|fine\s+of)\s+Rs\.?\s*([\d,]+)", text, re.IGNORECASE)
    if fine_m:
        amt_str = fine_m.group(1).replace(",", "")
        try:
            facts["trial_court_fine"] = float(amt_str)
            facts["trial_court_fine_paid"] = True
        except ValueError:
            pass

    # 2. Trial Court Sentence (Sentence imposed)
    sent_m = re.search(r"sentencing\s+him\s+to\s+([^\.\n;]+(?:\.\d+ counts)?|\w+\s+years?\s+RI|\w+\s+years?\s+SI)", text, re.IGNORECASE)
    if sent_m:
        facts["trial_court_sentence"] = sent_m.group(1).strip()
    elif "sentenced to undergo" in t_lower:
        m2 = re.search(r"sentenced\s+to\s+undergo\s+([^\.\n;]+)", text, re.IGNORECASE)
        if m2:
            facts["trial_court_sentence"] = m2.group(1).strip()

    # 3. High Court Bail Bond Surety Amount (Release on bail condition)
    # e.g., "execute a bond for a sum of Rs.10,000/- ... with two sureties"
    bond_m = re.search(r"(?:bond\s+for\s+a\s+sum\s+of|bond\s+of)\s+Rs\.?\s*([\d,]+)", text, re.IGNORECASE)
    if bond_m:
        amt_str = bond_m.group(1).replace(",", "")
        try:
            facts["bail_bond_amount"] = float(amt_str)
        except ValueError:
            pass

    # Surety count
    surety_m = re.search(r"(?:with\s+)?(two|one|three|\d+)\s+sureties", text, re.IGNORECASE)
    if surety_m:
        w = surety_m.group(1).lower()
        mapping = {"one": 1, "two": 2, "three": 3, "four": 4}
        facts["surety_count"] = mapping.get(w, int(w) if w.isdigit() else 2)

    # 4. Reason for Relief (Substantial grounds, appeal not likely in near future, prolonged custody)
    reasons = []
    if "not likely to be taken up in the near future" in t_lower or "not likely to be heard in the near future" in t_lower:
        reasons.append("Appeal unlikely to be heard in near future")
    if "substantial grounds" in t_lower:
        reasons.append("Substantial grounds raised in appeal")
    if "fixed sentence" in t_lower or "fixed term" in t_lower:
        reasons.append("Fixed term imprisonment sentence")
    if "no previous antecedents" in t_lower or "no bad antecedents" in t_lower:
        reasons.append("Absence of criminal antecedents")
    if "co-accused" in t_lower and ("granted bail" in t_lower or "enlarged on bail" in t_lower):
        reasons.append("Parity with co-accused granted bail")
    if reasons:
        facts["reason_for_relief"] = "; ".join(reasons)

    # 5. Reporting Condition
    rep_m = re.search(r"(appear\s+before\s+[^\.\n;]+|report\s+before\s+[^\.\n;]+)", text, re.IGNORECASE)
    if rep_m:
        facts["reporting_condition"] = rep_m.group(1).strip()

    return facts


def extract_ndps_facts(text):
    facts = {
        "category": "NDPS",
        "contraband_type": None,
        "seized_quantity": None,
        "quantity_category": "Intermediate Quantity",
        "section_37_embargo": False,
        "statutory_issue": None,
        "custody_period": None,
    }
    t_lower = text.lower()

    # Contraband type
    for drug in ["ganja", "heroin", "methamphetamine", "morphine", "cocaine", "opium", "charas", "codeine"]:
        if drug in t_lower:
            facts["contraband_type"] = drug.capitalize()
            break
    if not facts["contraband_type"]:
        facts["contraband_type"] = "Contraband / Narcotics"

    # Seized quantity
    qty_m = re.search(r"(\d+(?:\.\d+)?\s*(?:kgs?|kilos?|grams?|gms?|litres?|bottles?))", text, re.IGNORECASE)
    if qty_m:
        facts["seized_quantity"] = qty_m.group(1).strip()

    # Quantity Category & Section 37
    if "commercial quantity" in t_lower or "20(b)(ii)(c)" in t_lower or "21(c)" in t_lower or "22(c)" in t_lower:
        facts["quantity_category"] = "Commercial Quantity"
        facts["section_37_embargo"] = True
    elif "small quantity" in t_lower or "20(b)(ii)(a)" in t_lower:
        facts["quantity_category"] = "Small Quantity"
        facts["section_37_embargo"] = False
    else:
        facts["quantity_category"] = "Intermediate Quantity"
        facts["section_37_embargo"] = False

    # Issue
    if "167(2)" in t_lower or "default bail" in t_lower or "statutory bail" in t_lower or "36a(4)" in t_lower or "36-a(4)" in t_lower:
        facts["statutory_issue"] = "Default Bail (Section 167(2) CrPC / Section 36A(4) NDPS)"
    else:
        facts["statutory_issue"] = "Regular Bail under NDPS Act"

    if "180 days" in t_lower:
        facts["custody_period"] = "Exceeded 180 days"

    return facts


if __name__ == "__main__":
    import pdfplumber
    with pdfplumber.open("storage/cases/MHC-PS_2026_Crl_A_No_1101_of_2026_0249f2b0.pdf") as pdf:
        txt1 = "\n".join(p.extract_text() for p in pdf.pages)
    
    cat1 = detect_case_category(txt1, ["Section 430 BNSS"], "Crl.A.No.1101 of 2026", "Marimuthu v. State")
    print(f"Case 1 Category: {cat1}")
    facts1 = extract_bail_suspension_facts(txt1)
    for k, v in facts1.items():
        print(f"  {k}: {v}")

    print("-" * 50)
    with pdfplumber.open("storage/cases/MHC-PS_2026_Crl_OP_MD_No_17257_of_2026_a460d112.pdf") as pdf:
        txt2 = "\n".join(p.extract_text() for p in pdf.pages)
    cat2 = detect_case_category(txt2, ["Section 36A NDPS"], "Crl.OP.17257 of 2026", "Manikandan v. State")
    print(f"Case 2 Category: {cat2}")
    facts2 = extract_ndps_facts(txt2)
    for k, v in facts2.items():
        print(f"  {k}: {v}")
