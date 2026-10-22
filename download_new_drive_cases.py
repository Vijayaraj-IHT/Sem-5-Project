import os
import sys
import re
import urllib.request
import hashlib
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.core.database import SessionLocal
from app.models.case import Case
from app.models.user import User
from batch_ingest_1000 import process_single_pdf

INCOMING_DIR = BASE_DIR / "backend" / "incoming_cases"
INCOMING_DIR.mkdir(parents=True, exist_ok=True)

HTML_PATH = BASE_DIR / "scratch_drive.html"
with open(HTML_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Match table rows
rows = re.findall(r'<tr[^>]+data-id="([a-zA-Z0-9_-]{28,45})"[^>]*>(.*?)</tr>', content, re.DOTALL)
print(f"Total files in Google Drive folder: {len(rows)}")

# Find existing files in DB or manifest
db = SessionLocal()
staff_user = db.query(User).filter(User.role.in_(["senior_staff", "court_staff", "staff"])).first()
uploader_id = staff_user.id if staff_user else "drive-batch-uploader"

def download_file(file_id: str) -> bytes:
    urls = [
        f"https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0",
        f"https://drive.google.com/uc?export=download&id={file_id}",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = resp.read()
                if b"confirm=" in data and b"href=\"" in data:
                    confirm_token = None
                    for line in data.split(b"\n"):
                        if b"confirm=" in line:
                            m = re.search(r'confirm=([0-9a-zA-Z_-]+)', line.decode('utf-8', errors='ignore'))
                            if m:
                                confirm_token = m.group(1)
                                break
                    if confirm_token:
                        conf_url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm={confirm_token}"
                        conf_req = urllib.request.Request(conf_url, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(conf_req, timeout=35) as c_resp:
                            data = c_resp.read()
                if data.startswith(b"%PDF"):
                    return data
        except Exception as e:
            pass
    raise RuntimeError(f"Could not download PDF for file ID {file_id}")


# Track already processed hashes to avoid duplicates
existing_hashes = set(row[0] for row in db.query(Case.file_hash).all())
print(f"Existing cases in PostgreSQL: {len(existing_hashes)}")

downloaded_count = 0
ingested_count = 0
failed_count = 0

for idx, (data_id, row_html) in enumerate(rows, start=1):
    texts = [t.strip() for t in re.findall(r'>([^<]+)<', row_html) if t.strip()]
    raw_name = texts[1] if len(texts) > 1 else f"drive_{data_id}.pdf"
    
    # Clean filename
    clean_name = re.sub(r'[\/:*?"<>|]', '_', raw_name)
    target_path = INCOMING_DIR / f"{data_id}_{clean_name}"
    
    print(f"\n[{idx}/{len(rows)}] Processing Drive File: {data_id} ({clean_name[:45]})...")
    
    # 1. Download if not already in incoming
    pdf_bytes = None
    if target_path.exists():
        with open(target_path, "rb") as f:
            pdf_bytes = f.read()
        print(f"   -> Found cached locally.")
    else:
        try:
            print(f"   -> Downloading from Google Drive...")
            pdf_bytes = download_file(data_id)
            with open(target_path, "wb") as f:
                f.write(pdf_bytes)
            downloaded_count += 1
            print(f"   -> Downloaded ({len(pdf_bytes):,} bytes).")
        except Exception as e:
            print(f"   -> FAILED download: {e}")
            failed_count += 1
            continue
            
    # Check if hash already exists in DB
    h_doc = hashlib.sha256(pdf_bytes).hexdigest()
    if h_doc in existing_hashes:
        print(f"   -> SHA-256 {h_doc[:12]}.. already registered in PostgreSQL repository.")
        continue

    # 2. Extract, Train Vector, Affix Seal, and Index into PostgreSQL
    try:
        print(f"   -> Extracting CIS fields, computing embeddings & judicial seal...")
        record = process_single_pdf(target_path, db, uploader_id, auto_approve=True)
        existing_hashes.add(h_doc)
        ingested_count += 1
        print(f"   -> INGESTED & TRAINED: {record['case_no']} | H_doc: {record['h_doc'][:10]}.. | Seal: {record['phi_case'][:10]}..")
    except Exception as e:
        print(f"   -> Extraction/Ingestion error: {e}")
        failed_count += 1

db.close()

print(f"\n=======================================================")
print(f"  Google Drive Synchronization & Training Complete!")
print(f"  Total Drive Documents Processed: {len(rows)}")
print(f"  Newly Downloaded: {downloaded_count}")
print(f"  Newly Ingested & Trained: {ingested_count}")
print(f"  Failed: {failed_count}")
print(f"=======================================================\n")
