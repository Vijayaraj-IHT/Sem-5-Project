import sys
sys.path.insert(0, 'backend')
from app.core.database import SessionLocal
from app.models.case import Case
from app.services.extraction_service import ExtractionService

db = SessionLocal()
cases = db.query(Case).filter(Case.full_text != None).limit(5).all()

for c in cases:
    print('='*70)
    print(f'CASE ID: {c.id}')
    print(f'BEFORE: cnr={c.cnr_number} | case_no={c.case_no} | judge={c.judge} | pet={c.petitioner}')
    data, conf = ExtractionService._pass1_structural(c.full_text[:3000], c.full_text[-3000:], c.full_text, c.page_count or 5)
    print(f'AFTER:  cnr={data.get("cnr")} | case_no={data.get("case_no")} | judge={data.get("judge")} | pet={data.get("petitioner")}')
    print(f'        counsel_p={data.get("counsel_petitioner")} | counsel_r={data.get("counsel_respondent")} | disp={data.get("disposition")}')
