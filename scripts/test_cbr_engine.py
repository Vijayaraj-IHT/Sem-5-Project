import sys
import json

sys.path.insert(0, r"E:\SEM 5 PROJECT\Lexguard\backend")

from app.core.database import SessionLocal
from app.models.case import Case
from app.services.comparison_service import comparison_service
from app.schemas.comparison import CaseComparisonRequest

def test_cbr():
    db = SessionLocal()
    case1 = db.query(Case).filter(Case.title.ilike("%16662%")).first()
    print(f"Target Case: {case1.case_no} | {case1.title}")
    print(f"Profile: {case1.comparison_profile}\n")

    # TEST 1: Identical case
    req_self = CaseComparisonRequest(
        precedent_case_id=case1.id,
        target_case_id=case1.id,
        target_file_hash=case1.file_hash,
        target_case_no=case1.case_no,
        case_title=case1.title,
        court_jurisdiction=case1.court,
        facts_summary=case1.facts or case1.summary,
        statutory_provisions=["Section 430(1) BNSS"],
        outcome=case1.outcome,
    )
    res_self = comparison_service.compare_case(req_self, case1)
    print(f"[TEST 1] Self Match: {res_self.overall_score}% | Rating: {res_self.distinguishability_rating}")
    for d in res_self.dimensions:
        print(f"   {d.dimension_name}: {d.dimension_score}% - {d.explanation}")

    # TEST 2: Concordance Test (BNSS 430 vs CrPC 389)
    # Simulate a target case under Section 430 BNSS comparing to a precedent that has Section 389 CrPC
    # We find a case or test the concordance directly
    c_other = db.query(Case).filter(Case.id != case1.id).first()
    req_bnss = CaseComparisonRequest(
        precedent_case_id=c_other.id,
        case_title="Criminal Appeal Sentence Suspension Petition",
        court_jurisdiction="Madras High Court",
        facts_summary="Petition for suspension of sentence pending appeal against conviction. Simple imprisonment of one year imposed by sessions court.",
        statutory_provisions=["Section 430 BNSS"],
        outcome="Allowed",
    )
    res_other = comparison_service.compare_case(req_bnss, c_other)
    print(f"\n[TEST 2] Target BNSS 430 vs Precedent {c_other.case_no}: {res_other.overall_score}% | Rating: {res_other.distinguishability_rating}")
    for d in res_other.dimensions:
        print(f"   {d.dimension_name}: {d.dimension_score}% - {d.explanation}")

    db.close()

if __name__ == "__main__":
    test_cbr()
