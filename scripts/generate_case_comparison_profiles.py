import sys
import os
import re
import json

sys.path.insert(0, r"E:\SEM 5 PROJECT\Lexguard\backend")

from app.core.database import SessionLocal
from app.models.case import Case
from app.core.concordance import (
    normalize_section_str,
    get_concordance_equivalents,
    extract_scenario_clusters,
    extract_activity_clusters,
    SCENARIO_CLUSTERS,
    ACTIVITY_CLUSTERS,
)
from app.core.category_extractor import (
    detect_case_category,
    extract_polymorphic_facts,
)

def build_profile_for_case(c: Case) -> dict:
    combined_text = " ".join([
        c.title or "",
        c.summary or "",
        c.facts or "",
        c.ratio_decidendi or "",
        " ".join(c.section_tags or []),
        " ".join(c.act_tags or []),
        " ".join(c.keyword_tags or []),
    ])
    low_text = combined_text.lower()

    # 1. Statutory Matrix with Concordance
    sections_raw = list(c.section_tags or [])
    # Also extract via regex from text
    regex_secs = re.findall(r"\b(?:Section|Sec\.?|S\.)\s*([0-9A-Za-z\(\)]+)\s*(?:of\s+the\s+)?([A-Za-z\s]+)?", combined_text, re.I)
    for s_num, s_act in regex_secs:
        s_act_clean = (s_act or "").strip()
        if any(k in s_act_clean.upper() for k in ["BNSS", "BNS", "CRPC", "IPC", "BSA", "NDPS", "NI ACT"]):
            sections_raw.append(f"Section {s_num} {s_act_clean[:20]}")

    statutory_matrix = []
    seen_secs = set()
    for s_str in sections_raw:
        norm = normalize_section_str(s_str)
        if norm and norm not in seen_secs:
            seen_secs.add(norm)
            act_code, sec_num = norm
            eqs = get_concordance_equivalents(act_code, sec_num)
            statutory_matrix.append({
                "act": act_code,
                "section": sec_num,
                "canonical": f"Section {sec_num} {act_code}",
                "equivalents": [f"Section {es} {ea}" for ea, es in eqs],
            })

    # 2. Scenario Keywords
    matched_scenarios = []
    for cluster_name, kws in SCENARIO_CLUSTERS.items():
        for kw in kws:
            if kw in low_text and kw not in matched_scenarios:
                matched_scenarios.append(kw)

    # 3. Activity Events
    matched_activities = []
    for act_name, kws in ACTIVITY_CLUSTERS.items():
        for kw in kws:
            if kw in low_text and kw not in matched_activities:
                matched_activities.append(kw)

    # 4. Clusters
    scenario_clusters = extract_scenario_clusters(low_text)
    activity_clusters = extract_activity_clusters(low_text)

    # 5. Polymorphic Category Facts (Fine vs Bail Bond, Custody, NDPS Contraband, etc.)
    full_judgment_text = (c.full_text or "")
    if len(full_judgment_text) < 100:
        full_judgment_text = combined_text

    cat = detect_case_category(
        full_judgment_text,
        c.section_tags or [],
        c.case_no or "",
        c.title or "",
        c.court or "",
    )
    cat_facts = extract_polymorphic_facts(
        full_judgment_text,
        cat,
        c.section_tags or [],
        c.case_no or "",
        c.title or "",
    )

    # 6. Procedural Posture
    disp = c.outcome or c.disposition or "Allowed"

    return {
        "profile_version": "2.5",
        "case_id": c.id,
        "case_no": c.case_no,
        "title": c.title,
        "court": c.court,
        "petitioner": c.petitioner,
        "respondent": c.respondent,
        "parties": c.parties,
        "legal_domain": c.legal_domain or "General",
        "category": cat,
        "category_facts": cat_facts,
        "statutory_matrix": statutory_matrix,
        "scenario_keywords": matched_scenarios[:12],
        "activity_events": matched_activities[:10],
        "scenario_clusters": scenario_clusters,
        "activity_clusters": activity_clusters,
        "procedural_posture": {
            "remedy": c.outcome or c.disposition or "Allowed",
            "disposition": disp,
        },
    }

def main():
    db = SessionLocal()
    cases = db.query(Case).all()
    print(f"Generating comparison profiles for {len(cases)} cases...")

    updated = 0
    for idx, c in enumerate(cases, 1):
        profile = build_profile_for_case(c)
        c.comparison_profile = profile
        updated += 1
        if idx % 50 == 0 or idx == len(cases):
            print(f"  Processed {idx}/{len(cases)} cases...")

    db.commit()
    print(f"SUCCESS: Generated comparison_profile for all {updated} cases in PostgreSQL!")

    # Verify sample
    sample = db.query(Case).filter(Case.title.ilike("%16662%")).first()
    if sample and sample.comparison_profile:
        print("\n--- Verification Sample (16662) ---")
        print(json.dumps(sample.comparison_profile, indent=2))

    db.close()

if __name__ == "__main__":
    main()
