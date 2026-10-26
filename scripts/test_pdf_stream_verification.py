import urllib.request
import json
import psycopg2

def test_stream_5_cases():
    conn = psycopg2.connect(dbname="lexguard", user="lexguard", password="lexguard123", host="localhost", port=5432)
    cur = conn.cursor()
    cur.execute("SELECT id, case_no, title, file_path, file_hash FROM cases WHERE status = 'published' LIMIT 5")
    cases = cur.fetchall()

    print(f"Testing document streaming for {len(cases)} cases...")
    
    for cid, cno, title, fpath, fhash in cases:
        url = f"http://127.0.0.1:8000/api/v1/verification/documents/{cid}/stream"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.status
                headers = dict(resp.getheaders())
                content_disposition = headers.get("content-disposition", "")
                content_length = headers.get("content-length", 0)
                print(f"[PASS] Case {cid[:8]} ({cno}) -> Status: {status} | Size: {content_length} bytes | Disposition: {content_disposition}")
        except Exception as e:
            print(f"[FAIL] Case {cid[:8]} ({cno}) -> Error: {e}")

    # Check AuditLog for DOCUMENT_STREAM entries
    cur.execute("SELECT action, details, timestamp FROM audit_logs WHERE action IN ('DOCUMENT_STREAM', 'INTEGRITY_VIOLATION') ORDER BY timestamp DESC LIMIT 5")
    print("\nRecent Audit Log Entries:")
    for action, details, ts in cur.fetchall():
        print(f"  [{action}] {details} at {ts}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    test_stream_5_cases()
