import urllib.request
import json

def test():
    req1 = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/comparison/precedents?q=16662")
    prec_list = json.loads(req1.read().decode())
    print(f"Fetched {len(prec_list)} precedents matching 16662")
    target = prec_list[0]
    print(f"Target ID: {target['id']} | Title: {target['title']} | Hash: {target['file_hash'][:12]}...")

    payload = {
        "precedent_case_ids": [target["id"]],
        "target_case_id": target["id"],
        "target_file_hash": target["file_hash"],
        "target_case_no": target["case_no"],
        "case_title": target["title"],
        "court_jurisdiction": target["court"],
        "facts_summary": target["facts"] or target["summary"],
        "statutory_provisions": target["section_tags"],
        "outcome": target["outcome"],
    }

    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/comparison/compare-multi",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    res = urllib.request.urlopen(req2)
    res_data = json.loads(res.read().decode())
    print("\nLive Multi-Comparison API Response:")
    print(f"Best Match Score: {res_data['best_match_score']}% (Expected: 100.0%)")
    for r in res_data["results"]:
        print(f"Case: {r['precedent']['title']} -> Overall Score: {r['overall_score']}%")
        for d in r["dimensions"]:
            print(f"  [{d['dimension_name']}]: {d['dimension_score']}% ({d['match_state']}) - {d['explanation']}")

if __name__ == "__main__":
    test()
