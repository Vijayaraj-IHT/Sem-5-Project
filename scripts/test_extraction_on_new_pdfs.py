"""
test_extraction_on_new_pdfs.py
Tests extraction on sample new user PDFs to inspect regex parsing quality.
"""
import os
import sys
import hashlib
import pdfplumber

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.services.extraction_service import ExtractionService

src_dir = r"e:\SEM 5 PROJECT\LexGuard-HTML\storage\cases"

sample_files = [
    "Home _ Judgements and Orders, Supreme Court and High courts of India(10).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(100).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(101).pdf",
    "Home _ Judgements and Orders, Supreme Court and High courts of India(103).pdf",
]

for fname in sample_files:
    full = os.path.join(src_dir, fname)
    if not os.path.exists(full):
        continue
    print(f"\n=======================================================")
    print(f"FILE: {fname}")
    print(f"=======================================================")
    data = ExtractionService.extract_from_pdf(full)
    for k in ["court", "case_no", "title", "year", "judge", "petitioner", "respondent", "act_tags", "section_tags", "disposition", "official_citation"]:
        print(f"  {k:18}: {data.get(k)}")
    if data.get("summary"):
        print(f"  summary           : {data.get('summary')[:120]}...")
