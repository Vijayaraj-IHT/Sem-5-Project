import os

TERMS = [
    "PostgreSQL 17",
    "HttpOnly",
    "0-byte",
    "Visual Showcase",
    "916 Blocks",
    "Zero-Tamper",
    "Official Legal Tech Prototype",
    "Semester 5 Project",
    "Merkle Audit Ledger",
    "InLegalBERT AI",
    "HIGH COURT OF JUDICATURE AT MADRAS • Chennai Principal Seat & Madurai Bench",
    "CIS Version 3.2 Standard",
]

REPOS = [
    r"e:\SEM 5 PROJECT\Lexguard\lexguard-html",
    r"e:\SEM 5 PROJECT\LexGuard-HTML",
]

results = []

for repo in REPOS:
    for root, dirs, files in os.walk(repo):
        # skip git
        if ".git" in root or "node_modules" in root:
            continue
        for file in files:
            if file.endswith((".html", ".js", ".css", ".md")):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    for term in TERMS:
                        if term.lower() in content.lower():
                            results.append((path, term))
                except Exception:
                    pass

print(f"Total occurrences found: {len(results)}")
for r in results:
    print(f"File: {r[0]}")
    print(f"  Matched: '{r[1]}'")
