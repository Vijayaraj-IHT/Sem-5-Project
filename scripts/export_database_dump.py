import subprocess
import shutil
import os

env = os.environ.copy()
env["PGPASSWORD"] = "lexguard123"

pg_dump = r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
dest1 = r"e:\SEM 5 PROJECT\Lexguard\database_dump.sql"
dest2 = r"e:\SEM 5 PROJECT\LexGuard-HTML\database\database_dump.sql"

print(f"Dumping database to {dest1}...")
subprocess.run(
    [pg_dump, "-U", "lexguard", "-h", "localhost", "-p", "5432", "-d", "lexguard", "-f", dest1],
    env=env,
    check=True
)

file_size = os.path.getsize(dest1)
print(f"Dump complete: {file_size / (1024*1024):.2f} MB")

print(f"Copying to {dest2}...")
shutil.copy2(dest1, dest2)
print("Copied successfully to LexGuard-HTML repo!")
