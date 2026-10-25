import os
import datetime

now = datetime.datetime.now()

def find_recent_pdfs(root_dir):
    print(f"Scanning {root_dir}...")
    found = []
    for root, dirs, files in os.walk(root_dir):
        # skip git
        if ".git" in root or "node_modules" in root or ".gemini" in root:
            continue
        for f in files:
            if f.lower().endswith(".pdf"):
                full_path = os.path.join(root, f)
                try:
                    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))
                    ctime = datetime.datetime.fromtimestamp(os.path.getctime(full_path))
                    latest = max(mtime, ctime)
                    if (now - latest).total_seconds() < 86400 * 3: # last 3 days
                        found.append((full_path, latest, os.path.getsize(full_path)))
                except Exception:
                    pass
    return found

recent_e = find_recent_pdfs(r"E:\SEM 5 PROJECT")
recent_e.sort(key=lambda x: x[1], reverse=True)

print(f"\nTotal PDFs modified/created in last 3 days in E:\\SEM 5 PROJECT: {len(recent_e)}")

# Group by directory
by_dir = {}
for p, t, sz in recent_e:
    d = os.path.dirname(p)
    by_dir.setdefault(d, []).append((p, t, sz))

for d, flist in by_dir.items():
    print(f"\nDirectory: {d} ({len(flist)} files)")
    for p, t, sz in flist[:5]:
        print(f"  {t.strftime('%Y-%m-%d %H:%M:%S')} | {sz:8d} | {os.path.basename(p)}")
