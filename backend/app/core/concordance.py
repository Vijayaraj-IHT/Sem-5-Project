"""
LexGuard Statutory Concordance & Legal Concept Taxonomy Module.
Provides cross-statutory concordance between historical codes (CrPC 1973, IPC 1860, IEA 1872)
and current enactments (BNSS 2023, BNS 2023, BSA 2023), alongside structured legal
scenario and activity taxonomies for Case-Based Reasoning (CBR).
"""

import re
from typing import Dict, List, Set, Tuple, Optional, Any

# ==============================================================================
# 1. Statutory Concordance Cross-Walk (BNSS ↔ CrPC, BNS ↔ IPC, BSA ↔ IEA)
# ==============================================================================

# Key format: (canonical_act, section_number) -> list of equivalent (act, section_number)
CONCORDANCE_MAP: Dict[Tuple[str, str], Dict[str, Any]] = {
    # Criminal Procedure: BNSS ↔ CrPC
    ("BNSS", "430"): {
        "title": "Suspension of sentence pending appeal; release on bail",
        "equivalents": [("CrPC", "389")],
        "subject": "suspension of sentence pending appeal",
    },
    ("CrPC", "389"): {
        "title": "Suspension of sentence pending the appeal; release of appellant on bail",
        "equivalents": [("BNSS", "430")],
        "subject": "suspension of sentence pending appeal",
    },
    ("BNSS", "528"): {
        "title": "Saving of inherent powers of High Court",
        "equivalents": [("CrPC", "482")],
        "subject": "inherent powers to quash proceedings or FIR",
    },
    ("CrPC", "482"): {
        "title": "Saving of inherent powers of High Court",
        "equivalents": [("BNSS", "528")],
        "subject": "inherent powers to quash proceedings or FIR",
    },
    ("BNSS", "482"): {
        "title": "Direction for grant of bail to person apprehending arrest (Anticipatory Bail)",
        "equivalents": [("CrPC", "438")],
        "subject": "anticipatory bail pre-arrest",
    },
    ("CrPC", "438"): {
        "title": "Direction for grant of bail to person apprehending arrest",
        "equivalents": [("BNSS", "482")],
        "subject": "anticipatory bail pre-arrest",
    },
    ("BNSS", "483"): {
        "title": "Special powers of High Court or Court of Session regarding bail",
        "equivalents": [("CrPC", "439")],
        "subject": "regular bail after arrest",
    },
    ("CrPC", "439"): {
        "title": "Special powers of High Court or Court of Session regarding bail",
        "equivalents": [("BNSS", "483")],
        "subject": "regular bail after arrest",
    },
    ("BNSS", "173"): {
        "title": "Information in cognizable cases (First Information Report)",
        "equivalents": [("CrPC", "154")],
        "subject": "registration of FIR",
    },
    ("CrPC", "154"): {
        "title": "Information in cognizable cases",
        "equivalents": [("BNSS", "173")],
        "subject": "registration of FIR",
    },
    ("BNSS", "193"): {
        "title": "Report of police officer on completion of investigation",
        "equivalents": [("CrPC", "173")],
        "subject": "chargesheet / final police report",
    },
    ("CrPC", "173"): {
        "title": "Report of police officer on completion of investigation",
        "equivalents": [("BNSS", "193")],
        "subject": "chargesheet / final police report",
    },
    ("BNSS", "210"): {
        "title": "Cognizance of offences by Magistrate",
        "equivalents": [("CrPC", "190")],
        "subject": "judicial cognizance of offence",
    },
    ("CrPC", "190"): {
        "title": "Cognizance of offences by Magistrates",
        "equivalents": [("BNSS", "210")],
        "subject": "judicial cognizance of offence",
    },
    ("BNSS", "250"): {
        "title": "Discharge in warrant cases / Sessions",
        "equivalents": [("CrPC", "227"), ("CrPC", "239")],
        "subject": "discharge of accused before charge framing",
    },
    ("CrPC", "227"): {
        "title": "Discharge",
        "equivalents": [("BNSS", "250")],
        "subject": "discharge of accused before charge framing",
    },
    ("CrPC", "239"): {
        "title": "When accused shall be discharged",
        "equivalents": [("BNSS", "250")],
        "subject": "discharge of accused before charge framing",
    },
    ("BNSS", "438"): {
        "title": "Calling for records to exercise powers of revision",
        "equivalents": [("CrPC", "397")],
        "subject": "criminal revision against interlocutory or final orders",
    },
    ("CrPC", "397"): {
        "title": "Calling for records to exercise powers of revision",
        "equivalents": [("BNSS", "438")],
        "subject": "criminal revision against interlocutory or final orders",
    },
    ("BNSS", "442"): {
        "title": "High Court's powers of revision",
        "equivalents": [("CrPC", "401")],
        "subject": "High Court revisional jurisdiction",
    },
    ("CrPC", "401"): {
        "title": "High Court's powers of revision",
        "equivalents": [("BNSS", "442")],
        "subject": "High Court revisional jurisdiction",
    },

    # Substantive Penal Law: BNS ↔ IPC
    ("BNS", "103"): {
        "title": "Punishment for murder",
        "equivalents": [("IPC", "302")],
        "subject": "murder culpable homicide",
    },
    ("IPC", "302"): {
        "title": "Punishment for murder",
        "equivalents": [("BNS", "103")],
        "subject": "murder culpable homicide",
    },
    ("BNS", "115"): {
        "title": "Voluntarily causing hurt",
        "equivalents": [("IPC", "323")],
        "subject": "simple hurt physical assault",
    },
    ("IPC", "323"): {
        "title": "Punishment for voluntarily causing hurt",
        "equivalents": [("BNS", "115")],
        "subject": "simple hurt physical assault",
    },
    ("BNS", "318"): {
        "title": "Cheating and dishonestly inducing delivery of property",
        "equivalents": [("IPC", "420"), ("IPC", "415")],
        "subject": "cheating fraudulent inducement",
    },
    ("IPC", "420"): {
        "title": "Cheating and dishonestly inducing delivery of property",
        "equivalents": [("BNS", "318")],
        "subject": "cheating fraudulent inducement",
    },
    ("BNS", "316"): {
        "title": "Criminal breach of trust",
        "equivalents": [("IPC", "406"), ("IPC", "405")],
        "subject": "criminal breach of trust misappropriation",
    },
    ("IPC", "406"): {
        "title": "Punishment for criminal breach of trust",
        "equivalents": [("BNS", "316")],
        "subject": "criminal breach of trust misappropriation",
    },
    ("BNS", "85"): {
        "title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "equivalents": [("IPC", "498A")],
        "subject": "matrimonial cruelty dowry harassment",
    },
    ("IPC", "498A"): {
        "title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "equivalents": [("BNS", "85")],
        "subject": "matrimonial cruelty dowry harassment",
    },
    ("BNS", "61"): {
        "title": "Criminal conspiracy",
        "equivalents": [("IPC", "120B")],
        "subject": "criminal conspiracy common intention",
    },
    ("IPC", "120B"): {
        "title": "Punishment of criminal conspiracy",
        "equivalents": [("BNS", "61")],
        "subject": "criminal conspiracy common intention",
    },

    # Evidence Law: BSA ↔ IEA
    ("BSA", "63"): {
        "title": "Admissibility of electronic records",
        "equivalents": [("IEA", "65B")],
        "subject": "electronic records certificate admissibility",
    },
    ("IEA", "65B"): {
        "title": "Admissibility of electronic records",
        "equivalents": [("BSA", "63")],
        "subject": "electronic records certificate admissibility",
    },
}


# ==============================================================================
# 2. Structured Legal Concept Taxonomies
# ==============================================================================

# Factual Scenario Taxonomy: Maps contextual terms to canonical scenario concepts
SCENARIO_CLUSTERS: Dict[str, List[str]] = {
    "appellate_conviction": [
        "conviction appeal", "sentence suspended", "suspension of sentence",
        "subordinate court trial", "sessions court conviction", "rigorous imprisonment",
        "simple imprisonment", "fine penalty", "appellate challenge"
    ],
    "pre_trial_custody": [
        "anticipatory bail", "pre arrest bail", "apprehension of arrest",
        "custodial interrogation", "police custody", "remand", "regular bail",
        "default bail", "statutory bail"
    ],
    "quashing_proceeding": [
        "quashing of fir", "quashing of chargesheet", "abuse of judicial process",
        "civil dispute given criminal color", "malicious prosecution", "quash complaint",
        "inherent powers quashing"
    ],
    "financial_commercial": [
        "cheque bounce", "dishonour of cheque", "section 138", "negotiable instruments",
        "statutory notice", "legally enforceable debt", "bank account", "commercial suit",
        "summary suit", "arbitral award", "interim measure", "section 9", "section 34"
    ],
    "public_taxation": [
        "commercial tax", "assessment order", "gst assessment", "show cause notice",
        "tax demand", "natural justice violation", "audit objection", "input tax credit"
    ],
    "service_employment": [
        "service matter", "seniority dispute", "promotion denial", "disciplinary inquiry",
        "termination of service", "suspension order", "pensionary benefits", "compassionate appointment"
    ],
    "constitutional_fundamental": [
        "writ of certiorari", "writ of mandamus", "writ of habeas corpus",
        "article 226", "article 32", "fundamental rights", "arbitrary action",
        "equality before law", "article 14", "article 21"
    ],
    "caste_status": [
        "caste certificate", "caste validity", "scrutiny committee", "scheduled tribe",
        "scheduled caste", "invalidity order", "vigilance cell report"
    ],
    "narcotics_contraband": [
        "ndps", "commercial quantity", "intermediate quantity", "small quantity",
        "contraband possession", "search and seizure", "section 37 ndps", "section 50 ndps"
    ],
}

# Dispute Activity Taxonomy: Maps procedural actions done by litigants/court
ACTIVITY_CLUSTERS: Dict[str, List[str]] = {
    "trial_outcome": [
        "conviction recorded", "judgment pronounced", "accused acquitted",
        "sentence passed", "fine imposed", "discharged from case"
    ],
    "appellate_motion": [
        "appeal preferred", "criminal appeal filed", "civil appeal filed",
        "application for suspension of sentence", "petition under section 430",
        "petition under section 389", "admission of appeal", "bail granted pending appeal"
    ],
    "investigative_action": [
        "fir registered", "complaint filed", "chargesheet filed", "final report submitted",
        "investigation completed", "statements recorded", "arrest made"
    ],
    "revisional_motion": [
        "criminal revision petition", "revisional court called for records",
        "protest petition dismissed", "order of magistrate challenged"
    ],
    "writ_intervention": [
        "writ petition filed", "impugned order stayed", "certiorari issued",
        "mandamus directed", "matter remanded for reconsideration", "direction to adjudicate"
    ],
}


# ==============================================================================
# 3. Helper Functions
# ==============================================================================

def normalize_section_str(text: str) -> Optional[Tuple[str, str]]:
    """
    Normalizes a statutory string into (Act_Code, Section_Number).
    E.g., 'Section 430(1) BNSS' -> ('BNSS', '430')
          'Section 389 CrPC'    -> ('CrPC', '389')
          'Section 498A IPC'    -> ('IPC', '498A')
          'Article 226'         -> ('CONSTITUTION', '226')
    """
    if not text:
        return None
    s = text.strip()

    # Match BNSS / CrPC / BNS / IPC
    m_act = re.search(r"\b(BNSS|CrPC|BNS|IPC|BSA|IEA)\b", s, re.IGNORECASE)
    act_code = m_act.group(1).upper() if m_act else None

    m_sec = re.search(r"\b(?:Section|Sec\.?|S\.)\s*(\d+[A-Z]?)", s, re.IGNORECASE)
    sec_num = m_sec.group(1).upper() if m_sec else None

    if not sec_num:
        # Check Article
        m_art = re.search(r"\b(?:Article|Art\.?)\s*(\d+[A-Z]?)", s, re.IGNORECASE)
        if m_art:
            return ("CONSTITUTION", m_art.group(1).upper())

    if act_code and sec_num:
        return (act_code, sec_num)

    return None


def get_concordance_equivalents(act_code: str, sec_num: str) -> List[Tuple[str, str]]:
    """
    Returns list of historical/current statutory equivalents.
    E.g., ('BNSS', '430') -> [('CrPC', '389')]
    """
    key = (act_code.upper(), sec_num.upper())
    if key in CONCORDANCE_MAP:
        return CONCORDANCE_MAP[key].get("equivalents", [])
    return []


def check_statutory_concordance(act1: str, sec1: str, act2: str, sec2: str) -> Tuple[bool, float, str]:
    """
    Compares two statutory provisions.
    Returns (is_match, score, explanation).
    - 100.0% if identical: ('BNSS', '430') == ('BNSS', '430')
    - 100.0% if concordance equivalent: ('BNSS', '430') ↔ ('CrPC', '389')
    - 50.0% if same parent Act but different section
    - 0.0% if unrelated
    """
    a1, s1 = act1.upper(), sec1.upper()
    a2, s2 = act2.upper(), sec2.upper()

    # Exact match
    if a1 == a2 and s1 == s2:
        return (True, 100.0, f"Exact statutory match: Section {s1} {a1}")

    # Concordance equivalent match
    eqs = get_concordance_equivalents(a1, s1)
    if (a2, s2) in eqs:
        return (True, 100.0, f"Legislative Concordance Equivalence: Section {s1} {a1} ↔ Section {s2} {a2}")

    # Same Act family
    if a1 == a2:
        return (True, 50.0, f"Related provisions within same enactment ({a1})")

    # CrPC and BNSS family
    if {a1, a2} == {"CRPC", "BNSS"}:
        return (True, 40.0, f"Criminal procedure enactments ({a1} vs {a2})")

    if {a1, a2} == {"IPC", "BNS"}:
        return (True, 40.0, f"Substantive penal enactments ({a1} vs {a2})")

    return (False, 0.0, "Unrelated statutory frameworks")


def extract_scenario_clusters(text: str) -> List[str]:
    """
    Extracts all matching scenario cluster keys and keywords from text.
    """
    if not text:
        return []
    low = text.lower()
    found_clusters = []
    for cluster_name, kws in SCENARIO_CLUSTERS.items():
        if any(kw in low for kw in kws):
            found_clusters.append(cluster_name)
    return found_clusters


def extract_activity_clusters(text: str) -> List[str]:
    """
    Extracts procedural activity events from text.
    """
    if not text:
        return []
    low = text.lower()
    found_activities = []
    for act_name, kws in ACTIVITY_CLUSTERS.items():
        if any(kw in low for kw in kws):
            found_activities.append(act_name)
    return found_activities


def compute_tversky_index(set_target: Set[str], set_prec: Set[str], alpha: float = 0.7, beta: float = 0.3) -> float:
    r"""
    Asymmetric Tversky Index:
    S = |T ∩ P| / (|T ∩ P| + alpha * |T \ P| + beta * |P \ T|)
    Prevents penalizing broad Supreme Court landmarks (P) when the target petition (T) is narrower.
    """
    if not set_target and not set_prec:
        return 1.0
    if not set_target or not set_prec:
        return 0.0

    intersection = len(set_target.intersection(set_prec))
    diff_target = len(set_target - set_prec)
    diff_prec = len(set_prec - set_target)

    denominator = intersection + (alpha * diff_target) + (beta * diff_prec)
    if denominator == 0:
        return 0.0

    return round(intersection / denominator, 4)
