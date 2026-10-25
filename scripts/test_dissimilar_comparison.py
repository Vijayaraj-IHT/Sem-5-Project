import urllib.request
import json

def test():
    req1 = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/comparison/precedents?q=Marimuthu")
    prec = json.loads(req1.read().decode())[0]

    payload = {
        "precedent_case_ids": [prec["id"]],
        "case_title": "ABC Corp v. State",
        "court_jurisdiction": "Madras High Court",
        "facts_summary": (
            "Petition under Section 528 BNSS / Section 482 CrPC to quash FIR. "
            "Dispute is purely civil in nature arising out of commercial contract breach. "
            "No criminal cheating under Section 420 IPC."
        ),
        "statutory_provisions": ["Section 528 BNSS", "Section 482 CrPC", "Section 420 IPC"],
        "outcome": "Quashed",
    }
    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/comparison/compare-multi",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    res_data = json.loads(urllib.request.urlopen(req2).read().decode())
    r0 = res_data["results"][0]
    print(f"Dissimilar Case Overall Score: {r0['overall_score']}%")
    for d in r0["dimensions"]:
        print(f"  [{d['dimension_name']}]: {d['dimension_score']}% ({d['match_state']})")
        print(f"    -> {d['explanation']}")

if __name__ == "__main__":
    test()
