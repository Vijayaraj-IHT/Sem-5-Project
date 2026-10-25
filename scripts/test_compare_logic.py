import os
import sys
import re

sys.path.insert(0, r"E:\SEM 5 PROJECT\Lexguard\backend")

from app.core.database import SessionLocal
from app.models.case import Case

def test():
    db = SessionLocal()
    c1 = db.query(Case).filter(Case.title.ilike("%16662%")).first()
    print("Found c1:", c1.id, c1.title, c1.case_no, c1.court)
    print("Facts:", c1.facts[:120] if c1.facts else "None")
    
    # Check what other cases exist
    other_cases = db.query(Case).filter(Case.id != c1.id).limit(5).all()
    print("\nOther cases:")
    for o in other_cases:
        print(f"  {o.id[:8]} | {o.case_no} | {o.title[:40]} | {o.court}")
    db.close()

if __name__ == "__main__":
    test()
