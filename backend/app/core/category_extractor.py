import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# The 6 Supported Polymorphic Categories
CATEGORY_BAIL_SUSPENSION = "BAIL_SUSPENSION"
CATEGORY_NDPS = "NDPS"
CATEGORY_QUASHING = "QUASHING"
CATEGORY_SERVICE_WRIT = "SERVICE_WRIT"
CATEGORY_COMMERCIAL_CIVIL = "COMMERCIAL_CIVIL"
CATEGORY_GENERAL_CONSTITUTIONAL = "GENERAL_CONSTITUTIONAL"


def detect_case_category(
    text: str,
    sections: Optional[List[str]] = None,
    case_no: str = "",
    title: str = "",
    court: str = "",
) -> str:
    """
    Detects the judicial procedural category of a case to route to its polymorphic schema.
    """
    combined = f"{text[:3500]} {' '.join(sections or [])} {case_no} {title} {court}".lower()

    # 1. NDPS
    if any(k in combined for k in ["ndps", "narcotic", "psychotropic", "ganja", "nib-cid", "nib cid", "commercial quantity", "contraband"]):
        return CATEGORY_NDPS

    # 2. Bail & Suspension of Sentence
    if any(k in combined for k in [
        "430", "430(1)", "389", "389(1)", "suspension of sentence", "suspend the sentence",
        "483", "480", "482 bnss", "437", "438", "439", "regular bail", "anticipatory bail",
        "petition for bail", "enlarge the petitioner on bail", "surety bond", "default bail"
    ]):
        if "quash" not in combined or "suspend" in combined or "bail" in combined:
            return CATEGORY_BAIL_SUSPENSION

    # 3. Quashing (Section 482 CrPC / Section 528 BNSS)
    if any(k in combined for k in ["quash", "crl.op", "crl.o.p", "528 bnss", "482 crpc", "section 482", "section 528", "abuse of process", "fir no", "crime no"]):
        return CATEGORY_QUASHING

    # 4. Service / Employment Writ Petitions
    if any(k in combined for k in ["wps", "cwp", "notional promotion", "actual promotion", "retiral", "pension", "regularisation", "compassionate appointment", "pay scale", "service matter"]):
        return CATEGORY_SERVICE_WRIT

    # 5. Commercial, Intellectual Property & Civil
    if any(k in combined for k in ["trademark", "patent", "copyright", "commercial suit", "t.o.s", "o.s.", "partition", "probate", "passing off", "specific performance", "arbitration"]):
        return CATEGORY_COMMERCIAL_CIVIL

    return CATEGORY_GENERAL_CONSTITUTIONAL


def extract_polymorphic_facts(
    text: str,
    category: Optional[str] = None,
    sections: Optional[List[str]] = None,
    case_no: str = "",
    title: str = "",
) -> Dict[str, Any]:
    """
    Extracts category-specific structured facts and figures (e.g. separating trial court penal fines
    from High Court bail bonds, custody duration, commercial contraband, overt acts).
    """
    if not category:
        category = detect_case_category(text, sections, case_no, title)

    if category == CATEGORY_BAIL_SUSPENSION:
        return _extract_bail_suspension_facts(text)
    elif category == CATEGORY_NDPS:
        return _extract_ndps_facts(text)
    elif category == CATEGORY_QUASHING:
        return _extract_quashing_facts(text)
    elif category == CATEGORY_SERVICE_WRIT:
        return _extract_service_writ_facts(text)
    elif category == CATEGORY_COMMERCIAL_CIVIL:
        return _extract_commercial_civil_facts(text)
    else:
        return _extract_general_constitutional_facts(text)


def _extract_bail_suspension_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_BAIL_SUSPENSION,
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

    # 1. Application Type
    if any(k in t_lower for k in ["suspend the sentence", "suspension of sentence", "430(1)", "389(1)", "section 430", "section 389"]):
        facts["application_type"] = "Suspension of Sentence"
    elif any(k in t_lower for k in ["anticipatory bail", "438", "section 482 bnss", "pre-arrest"]):
        facts["application_type"] = "Anticipatory Bail"
    elif any(k in t_lower for k in ["default bail", "statutory bail", "167(2)"]):
        facts["application_type"] = "Default Bail"
    else:
        facts["application_type"] = "Regular Bail"

    # 2. Trial Court Fine (Conviction penalty)
    fine_m = re.search(r"(?:pay\s+a\s+fine\s+of|fine\s+of)\s+Rs\.?\s*([\d,]+)", text, re.IGNORECASE)
    if fine_m:
        amt_str = fine_m.group(1).replace(",", "")
        try:
            facts["trial_court_fine"] = float(amt_str)
            facts["trial_court_fine_paid"] = True
        except ValueError:
            pass

    # 3. Trial Court Sentence (Conviction sentence)
    sent_m = re.search(r"sentencing\s+him\s+to\s+([^\.\n;]+(?:\.\d+ counts)?|\w+\s+years?\s+RI|\w+\s+years?\s+SI)", text, re.IGNORECASE)
    if sent_m:
        facts["trial_court_sentence"] = sent_m.group(1).strip()
    elif "sentenced to undergo" in t_lower:
        m2 = re.search(r"sentenced\s+to\s+undergo\s+([^\.\n;]+)", text, re.IGNORECASE)
        if m2:
            facts["trial_court_sentence"] = m2.group(1).strip()

    # 4. High Court Bail Bond Surety Amount (Release on bail condition)
    bond_m = re.search(r"(?:bond\s+for\s+a\s+sum\s+of|bond\s+of)\s+Rs\.?\s*([\d,]+)", text, re.IGNORECASE)
    if bond_m:
        amt_str = bond_m.group(1).replace(",", "")
        try:
            facts["bail_bond_amount"] = float(amt_str)
        except ValueError:
            pass

    # Surety Count
    surety_m = re.search(r"(?:with\s+)?(two|one|three|\d+)\s+sureties", text, re.IGNORECASE)
    if surety_m:
        w = surety_m.group(1).lower()
        mapping = {"one": 1, "two": 2, "three": 3, "four": 4}
        facts["surety_count"] = mapping.get(w, int(w) if w.isdigit() else 2)

    # 5. Custody Period
    custody_m = re.search(r"(?:custody\s+of|incarceration\s+for|in\s+jail\s+since|in\s+custody\s+for)\s+([^\.\n;,]+)", text, re.IGNORECASE)
    if custody_m:
        facts["custody_period"] = custody_m.group(1).strip()

    # 6. Judicial Reason for Relief
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

    # 7. Reporting Condition
    rep_m = re.search(r"(appear\s+before\s+[^\.;\n]{10,120}|report\s+before\s+[^\.;\n]{10,120})", text, re.IGNORECASE)
    if rep_m:
        facts["reporting_condition"] = rep_m.group(1).strip()

    return facts


def _extract_ndps_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_NDPS,
        "contraband_type": "Contraband / Narcotics",
        "seized_quantity": None,
        "quantity_category": "Intermediate Quantity",
        "section_37_embargo": False,
        "statutory_issue": "Regular Bail under NDPS Act",
        "custody_period": None,
        "search_compliance_sec_50": "Search procedure evaluated",
    }

    # Contraband Type
    for drug in ["ganja", "heroin", "methamphetamine", "morphine", "cocaine", "opium", "charas", "codeine", "buprenorphine"]:
        if drug in t_lower:
            facts["contraband_type"] = drug.capitalize()
            break

    # Seized Quantity
    qty_m = re.search(r"(\d+(?:\.\d+)?\s*(?:kgs?|kilos?|grams?|gms?|litres?|bottles?))", text, re.IGNORECASE)
    if qty_m:
        facts["seized_quantity"] = qty_m.group(1).strip()

    # Commercial Quantity Classification (Ganja: >= 20 kg, Heroin: >= 250g, Meth: >= 50g)
    is_commercial = False
    if "commercial quantity" in t_lower or "20(b)(ii)(c)" in t_lower or "21(c)" in t_lower or "22(c)" in t_lower:
        is_commercial = True
    elif facts["seized_quantity"]:
        val_m = re.search(r"(\d+(?:\.\d+)?)\s*(kgs?|kilos?)", facts["seized_quantity"], re.IGNORECASE)
        if val_m and float(val_m.group(1)) >= 20.0:
            is_commercial = True

    if is_commercial:
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
        facts["statutory_issue"] = "Bail / Pre-trial Release under NDPS Act"

    if "180 days" in t_lower:
        facts["custody_period"] = "Exceeded statutory 180 days period"

    # Section 50 NDPS
    if "section 50" in t_lower:
        if "inapplicable" in t_lower or "bag" in t_lower or "vehicle" in t_lower:
            facts["search_compliance_sec_50"] = "Search from vehicle/bag (Section 50 personal search held inapplicable)"
        else:
            facts["search_compliance_sec_50"] = "Section 50 mandatory search safeguards compliance examined"

    return facts


def _extract_quashing_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_QUASHING,
        "proceedings_challenged": "FIR / Investigation",
        "quash_ground": "Absence of prima facie ingredients",
        "civil_cloak": False,
        "compromise_affidavit": False,
        "bhajan_lal_principles": True,
    }

    if "charge sheet" in t_lower or "c.c." in t_lower or "taken on file" in t_lower or "final report" in t_lower:
        facts["proceedings_challenged"] = "Criminal Case (C.C.) / Charge Sheet"
    elif "fir" in t_lower or "crime no" in t_lower:
        facts["proceedings_challenged"] = "First Information Report (FIR)"

    # Grounds
    if any(k in t_lower for k in ["civil dispute", "dispute of civil nature", "commercial dispute", "breach of contract"]):
        facts["quash_ground"] = "Purely civil transaction given criminal cloak"
        facts["civil_cloak"] = True
    elif any(k in t_lower for k in ["compromise", "settlement", "amicably settled", "joint memo"]):
        facts["quash_ground"] = "Amicable settlement and joint compromise between parties"
        facts["compromise_affidavit"] = True
    elif "no prima facie" in t_lower or "no specific overt act" in t_lower:
        facts["quash_ground"] = "Absence of prima facie ingredients and specific overt act"

    return facts


def _extract_service_writ_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_SERVICE_WRIT,
        "service_relief_sought": "Service Benefits / Writ of Certiorari & Mandamus",
        "effective_dates": None,
        "monetary_claims": "Notional vs Actual consequential arrears",
        "delay_laches_raised": "laches" in t_lower or "delay" in t_lower,
    }

    if "promotion" in t_lower:
        facts["service_relief_sought"] = "Notional vs Actual Retrospective Promotion & Benefits"
    elif "pension" in t_lower or "retiral" in t_lower:
        facts["service_relief_sought"] = "Pensionary / Retiral Benefits and Arrears"
    elif "compassionate" in t_lower:
        facts["service_relief_sought"] = "Compassionate Appointment Scheme Relief"

    # Monetary claims
    if "arrears" in t_lower or "salary" in t_lower:
        facts["monetary_claims"] = "Arrears of pay, salary, allowances, and pensionary benefits with interest"

    # Extract dates like 01.01.1996, 11.06.2001
    date_matches = re.findall(r"\b\d{2}[\./-]\d{2}[\./-]\d{4}\b", text)
    if date_matches:
        facts["effective_dates"] = ", ".join(list(dict.fromkeys(date_matches))[:3])

    return facts


def _extract_commercial_civil_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_COMMERCIAL_CIVIL,
        "dispute_type": "Commercial Dispute",
        "interim_injunction_granted": "injunction" in t_lower and ("granted" in t_lower or "allowed" in t_lower or "restrained" in t_lower),
        "statutory_basis": "Commercial Courts Act / Civil Procedure Code",
    }

    if "trademark" in t_lower or "passing off" in t_lower:
        facts["dispute_type"] = "Trademark Infringement & Passing Off (Section 2(1)(c) Commercial Courts Act)"
    elif "probate" in t_lower or "t.o.s" in t_lower or "will" in t_lower:
        facts["dispute_type"] = "Testamentary Original Suit (Probate & Proof of Will under Section 68 IEA)"
    elif "arbitration" in t_lower or "section 34" in t_lower or "section 11" in t_lower:
        facts["dispute_type"] = "Arbitration & Conciliation Challenge"

    return facts


def _extract_general_constitutional_facts(text: str) -> Dict[str, Any]:
    t_lower = text.lower()
    facts: Dict[str, Any] = {
        "category": CATEGORY_GENERAL_CONSTITUTIONAL,
        "remedy_type": "Writ Petition / Criminal Appeal",
        "constitutional_article": "Article 226 / Article 21",
        "judicial_disposition": "Allowed" if "allowed" in t_lower else "Dismissed",
    }

    if "habeas corpus" in t_lower or "h.c.p" in t_lower:
        facts["remedy_type"] = "Habeas Corpus (Preventive Detention Challenge)"
    elif "mandamus" in t_lower:
        facts["remedy_type"] = "Writ of Mandamus"
    elif "certiorari" in t_lower:
        facts["remedy_type"] = "Writ of Certiorari"
    elif "criminal appeal" in t_lower or "crl.a" in t_lower:
        facts["remedy_type"] = "Criminal Appeal Against Conviction"

    return facts
