import os

REPLACEMENTS = [
    # Topbar / Subtitles
    ("CIS Version 3.2 Standard", "Certified Digital Repository"),
    ("Merkle Audit Ledger", "System Audit Register"),
    ("merkle audit ledger", "system audit register"),
    ("InLegalBERT AI factual extraction", "Semantic Legal Search & Headnote Indexing"),
    ("InLegalBERT AI", "Semantic AI Headnote Indexing"),
    ("Semester 5 Project · ", ""),
    ("Semester 5 Project", "LexGuard Platform"),
    ("PostgreSQL 17 Active", "System Status: Online"),
    ("PostgreSQL 17", "PostgreSQL"),
    ("Secured with HttpOnly Cryptographic Tokens", "Secured Judicial Record System"),
    ("HttpOnly Cryptographic Tokens", "Secure Authentication Tokens"),
    ("Zero-byte browser SHA-256 digest validation", "Certified Document Integrity Check"),
    ("Official Legal Tech Prototype", "Authorized Judicial & Bar Portal"),
    ("0-byte", "Certified"),
    ("Visual Showcase", "Case Archive"),
    ("916 Blocks", "Audit Register"),
    ("Zero-Tamper", "Certified Copies"),
]

TARGET_DIRS = [
    r"e:\SEM 5 PROJECT\Lexguard\lexguard-html",
    r"e:\SEM 5 PROJECT\LexGuard-HTML",
]

total_replacements = 0

for target in TARGET_DIRS:
    for root, dirs, files in os.walk(target):
        if ".git" in root or "node_modules" in root or "database_dump" in root:
            continue
        for file in files:
            if file.endswith((".html", ".js", ".css", ".md")):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    orig = content
                    for old_text, new_text in REPLACEMENTS:
                        if old_text in content:
                            content = content.replace(old_text, new_text)
                    if content != orig:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"Updated: {path}")
                        total_replacements += 1
                except Exception as e:
                    print(f"Error reading {path}: {e}")

print(f"\nDone! Files updated: {total_replacements}")
