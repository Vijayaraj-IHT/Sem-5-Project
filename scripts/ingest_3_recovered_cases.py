import os
import sys
import shutil
import uuid
from datetime import datetime, timezone
import hashlib
import pdfplumber

sys.path.insert(0, r"E:\SEM 5 PROJECT\Lexguard\backend")

from app.core.database import SessionLocal
from app.models.case import Case
from app.models.document_version import DocumentVersion
from app.models.audit_log import AuditLog
from app.models.user import User

TARGET_STORAGE_DIRS = [
    r"E:\SEM 5 PROJECT\Lexguard\storage\cases",
    r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\storage\cases",
    r"E:\SEM 5 PROJECT\LexGuard-HTML\backend\storage\cases",
]

CASES_TO_ADD = [
    {
        "src": r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\112fc34b-f0b5-4b1d-9faa-425a744b7792.pdf",
        "canonical_name": "MHC_2026_WP_MD_No_29834_of_2026_51f17283.pdf",
        "court": "Madras High Court (Madurai Bench)",
        "court_code": "MHC",
        "case_no": "WP(MD) No. 29834 of 2026",
        "title": "S.T. Promotors v. The Commercial Tax Officer, Madurai",
        "judge": "Hon'ble Senthilkumar Ramamoorthy",
        "parties": "S.T. Promotors v. The Commercial Tax Officer, Madurai",
        "petitioner": "S.T. Promotors",
        "respondent": "The Commercial Tax Officer, Madurai",
        "cnr": "HCMD011431952026",
        "year": 2026,
        "decision_date": datetime(2026, 10, 16).date(),
        "case_type": "Writ Petition",
        "legal_domain": "Taxation / Commercial Tax",
        "outcome": "Allowed / Disposed",
        "acts": ["Constitution of India", "Tamil Nadu Goods and Services Tax Act, 2017"],
        "sections": ["Article 226"],
    },
    {
        "src": r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\dda01d1b-4226-40b7-8226-030b46791931.pdf",
        "canonical_name": "MHC_2025_CRL_RC_MD_No_1111_of_2025_d1f2eaf5.pdf",
        "court": "Madras High Court (Madurai Bench)",
        "court_code": "MHC",
        "case_no": "CRL RC(MD) No. 1111 of 2025",
        "title": "Mahalakshmi v. State Rep. by Inspector of Police, Rajapalayam",
        "judge": "Hon'ble B. Murugesan",
        "parties": "Mahalakshmi v. State Rep. by Inspector of Police",
        "petitioner": "Mahalakshmi",
        "respondent": "The State of Tamil Nadu Rep. by The Inspector of Police, Rajapalayam",
        "cnr": "HCMD011002702025",
        "year": 2025,
        "decision_date": datetime(2026, 10, 16).date(),
        "case_type": "Criminal Revision",
        "legal_domain": "Criminal Procedure",
        "outcome": "Allowed",
        "acts": ["Code of Criminal Procedure, 1973"],
        "sections": ["Section 397", "Section 401"],
    },
    {
        "src": r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\876aa28d-951d-4680-8708-0212da6848df.pdf",
        "canonical_name": "BHC_2023_Criminal_Writ_Petition_No_18_of_2023_1dd6f18a.pdf",
        "court": "High Court of Bombay at Goa",
        "court_code": "BHC",
        "case_no": "Criminal Writ Petition No. 18 of 2023",
        "title": "Neville B. Furtado v. State thr. Police Inspector and Anr.",
        "judge": "Hon'ble Ashwin D. Bhobe",
        "parties": "Neville B. Furtado v. State & Anr.",
        "petitioner": "Neville B. Furtado",
        "respondent": "State thr. Police Inspector and Anr.",
        "cnr": "BHCGOA01000182023",
        "year": 2023,
        "decision_date": datetime(2026, 10, 21).date(),
        "case_type": "Criminal Writ Petition",
        "legal_domain": "Criminal Law / Constitutional Law",
        "outcome": "Disposed as Withdrawn with Liberty",
        "acts": ["Constitution of India"],
        "sections": ["Article 227"],
    },
]

def sha256_of_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.role.in_(["admin", "senior_staff", "staff"])).first()
    admin_id = admin_user.id if admin_user else None

    for item in CASES_TO_ADD:
        src = item["src"]
        file_hash = sha256_of_file(src)
        cid = str(uuid.uuid4())
        short_id = cid[:8]
        cname = item["canonical_name"]

        # 1. Read PDF
        with pdfplumber.open(src) as pdf:
            page_count = len(pdf.pages)
            pages_text = [p.extract_text() or "" for p in pdf.pages]
            full_text = "\n\n".join(pages_text)

        # 2. Copy to all 4 storage locations
        for target_dir in TARGET_STORAGE_DIRS:
            os.makedirs(target_dir, exist_ok=True)
            dst_path = os.path.join(target_dir, cname)
            shutil.copy2(src, dst_path)

        # 3. Create Case
        summary = f"Judgment in {item['case_no']} delivered by {item['judge']} at {item['court']}. The proceedings concern {item['legal_domain']} with respect to {', '.join(item['sections'][:4])}."
        layman_summary = f"In this matter, the {item['court']} adjudicated issues between {item['petitioner']} and {item['respondent']}. The Court rendered a decision disposing of the application under statutory provisions."
        official_citation = f"{item['year']} LexGuard ({item['court_code']}) {short_id.upper()}"

        new_case = Case(
            id=cid,
            cnr_number=item["cnr"],
            case_no=item["case_no"],
            case_type=item["case_type"],
            title=item["title"][:490],
            court=item["court"],
            year=item["year"],
            decision_date=item["decision_date"],
            judge=item["judge"],
            bench_type="Single Bench",
            parties=item["parties"],
            petitioner=item["petitioner"],
            respondent=item["respondent"],
            legal_domain=item["legal_domain"],
            act_tags=item["acts"],
            section_tags=item["sections"],
            keyword_tags=[item["legal_domain"].lower(), item["court_code"].lower(), item["outcome"].lower()],
            summary=summary,
            layman_summary=layman_summary,
            outcome=item["outcome"],
            file_path=f"storage/cases/{cname}",
            file_hash=file_hash,
            official_citation=official_citation,
            precedents_cited=[],
            full_text=full_text,
            page_count=page_count,
            status="VERIFIED",
            auto_extracted=True,
            uploaded_by_id=admin_id,
            approved_by_id=admin_id,
            approved_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_case)

        doc_ver = DocumentVersion(
            id=str(uuid.uuid4()),
            case_id=cid,
            version_no=1,
            file_path=f"storage/cases/{cname}",
            file_hash=file_hash,
            change_summary="Initial authentic judgment ingestion and cryptographic indexing",
            changed_by_id=admin_id,
            changed_at=datetime.now(timezone.utc),
        )
        db.add(doc_ver)

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=admin_id,
            action="CASE_INGEST_VERIFIED",
            case_id=cid,
            details=f"Ingested verified judgment: {item['title']} [{item['case_no']}] ({item['court']})",
            current_hash=file_hash,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit)
        print(f"Added: {item['case_no']} -> {cname}")

    db.commit()
    count = db.query(Case).count()
    print(f"\nSUCCESS: PostgreSQL now contains {count} cases!")
    db.close()

if __name__ == "__main__":
    main()
