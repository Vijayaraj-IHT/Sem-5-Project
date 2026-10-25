import os

dir1 = r"E:\SEM 5 PROJECT\Lexguard\storage\cases"
dir2 = r"E:\SEM 5 PROJECT\LexGuard-HTML\storage\cases"

f1 = set(os.listdir(dir1))
f2 = set(os.listdir(dir2))

print(f"Files in Lexguard/storage/cases: {len(f1)}")
print(f"Files in LexGuard-HTML/storage/cases: {len(f2)}")
print(f"In f1 but not f2: {len(f1 - f2)}")
print(f"In f2 but not f1: {len(f2 - f1)}")

print("\nSample files in Lexguard/storage/cases but not LexGuard-HTML/storage/cases:")
for f in sorted(list(f1 - f2))[:25]:
    print(" ", f)
