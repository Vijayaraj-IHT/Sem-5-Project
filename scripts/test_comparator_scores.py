import sys

sys.path.insert(0, r"E:\SEM 5 PROJECT\Lexguard\backend")

from app.core.database import SessionLocal
from app.models.case import Case
from app.services.comparison_service import comparison_service
from app.schemas.comparison import CaseComparisonRequest

def test_comparator():
    db = SessionLocal()
    case1 = db.query(Case).filter(Case.title.ilike("%16662%")).first()
    print(f"Target case: {case1.case_no} | {case1.title} | {case1.court}")
    print(f"Facts: {case1.facts[:80]}...\n")

    # 1. Test Self-Comparison (Same case ID and metadata)
    req_self = CaseComparisonRequest(
        precedent_case_id=case1.id,
        target_case_id=case1.id,
        target_file_hash=case1.file_hash,
        target_case_no=case1.case_no,
        case_title=case1.title,
        court_jurisdiction=case1.court,
        facts_summary=case1.facts or case1.summary,
        statutory_provisions=case1.section_tags or [],
        outcome=case1.outcome,
    )
    res_self = comparison_service.compare_case(req_self, case1)
    print(f"[TEST 1: SELF-COMPARISON] Overall Score: {res_self.overall_score}% (Expected: 100.0%)")
    for d in res_self.dimensions:
        print(f"   {d.dimension_name}: {d.dimension_score}% ({d.match_state}) - {d.explanation}")

    # 2. Test Different Case in Same Domain (Criminal / Bail)
    c_other_crim = db.query(Case).filter(
        Case.id != case1.id,
        Case.legal_domain.ilike("%criminal%")
    ).first()
    if c_other_crim:
        req_other = CaseComparisonRequest(
            precedent_case_id=c_other_crim.id,
            target_case_id=case1.id,
            target_file_hash=case1.file_hash,
            target_case_no=case1.case_no,
            case_title=case1.title,
            court_jurisdiction=case1.court,
            facts_summary=case1.facts or case1.summary,
            statutory_provisions=case1.section_tags or [],
            outcome=case1.outcome,
        )
        res_other = comparison_service.compare_case(req_other, c_other_crim)
        print(f"\n[TEST 2: DIFFERENT CRIMINAL PRECEDENT: {c_other_crim.case_no}] Overall Score: {res_other.overall_score}%")
        for d in res_other.dimensions:
            print(f"   {d.dimension_name}: {d.dimension_score}% ({d.match_state}) - {d.explanation}")

    db.close()

if __name__ == "__main__":
    test_comparator()
