import os
import re
import uuid
import datetime
import hashlib
import pdfplumber
import psycopg2

FILES_TO_INGEST = [
    r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\112fc34b-f0b5-4b1d-9faa-425a744b7792.pdf",
    r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\dda01d1b-4226-40b7-8226-030b46791931.pdf",
    r"E:\SEM 5 PROJECT\Lexguard\backend\storage\cases\876aa28d-951d-4680-8708-0212da6848df.pdf",
]

def sha256_of_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    for f in FILES_TO_INGEST:
        print(f"\n==================== {os.path.basename(f)} ====================")
        with pdfplumber.open(f) as pdf:
            pages = len(pdf.pages)
            t0 = pdf.pages[0].extract_text() or ""
            t1 = pdf.pages[1].extract_text() if pages > 1 else ""
            t_last = pdf.pages[-1].extract_text() or ""
            full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
            print(f"Pages: {pages}, Size: {os.path.getsize(f)}, Hash: {sha256_of_file(f)}")
            print("--- Page 1 preview ---")
            print(t0[:600])
            print("--- Last Page preview ---")
            print(t_last[-400:])

if __name__ == "__main__":
    main()
