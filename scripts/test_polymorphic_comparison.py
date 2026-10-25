import urllib.request
import json

def test():
    # 1. Fetch Marimuthu precedent
    req1 = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/comparison/precedents?q=Marimuthu")
    prec_list = json.loads(req1.read().decode())
    prec = prec_list[0]

    # 2. Formulate a DIFFERENT target petition (e.g. new appeal seeking suspension under Section 430 BNSS / 389 CrPC with fine of Rs. 10,000)
    payload = {
        "precedent_case_ids": [prec["id"]],
        "case_title": "Ramasamy v. State of Tamil Nadu",
        "court_jurisdiction": "Madras High Court",
        "facts_summary": (
            "Criminal miscellaneous petition under Section 430(1) BNSS seeking suspension of sentence "
            "imposed by Sessions Court sentencing petitioner to 2 years imprisonment and to pay a fine of Rs.10,000/-. "
            "The petitioner has raised substantial grounds in appeal and the appeal is not likely to be taken up in the near future. "
            "Petitioner prays to be enlarged on bail executing a bond for a sum of Rs.10,000/- with two sureties."
        ),
        "statutory_provisions": ["Section 430 BNSS", "Section 389 CrPC"],
        "outcome": "Allowed",
    }

    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/comparison/compare-multi",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    res = urllib.request.urlopen(req2)
    res_data = json.loads(res.read().decode())

    print("\n=== POLYMORPHIC CBR COMPARISON RESULT ===")
    print(f"Overall Score: {res_data['best_match_score']}%")
    for r in res_data["results"]:
        print(f"Precedent: {r['precedent']['title']}")
        print(f"Result Score: {r['overall_score']}%")
        for d in r["dimensions"]:
            print(f"  [{d['dimension_name']}]: {d['dimension_score']}% ({d['match_state']})")
            print(f"    -> {d['explanation']}")

if __name__ == "__main__":
    test()
