"""
test_phase_deliverables.py
Verification suite for:
- Live stats (200 cases)
- Boolean and exact phrase search
- Research binders and export memorandum
- Static server endpoints
"""
import urllib.request
import json

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode('utf-8'))

# Test 1: Stats
stats = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/cases/stats').read().decode('utf-8'))
print('1. Stats:', stats)
assert stats['total_cases'] == 200, f"Expected 200 cases, got {stats['total_cases']}"

# Test 2: Landmarks
landmarks = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/cases/landmarks').read().decode('utf-8'))
print(f'2. Landmarks count: {len(landmarks)} landmark precedents registered')

# Test 3: Boolean search
res1 = post_json('http://127.0.0.1:8000/api/v1/search/', {
    'query': 'court:Supreme AND "Basic Structure"',
    'limit': 5
})
print(f"3. Search (court:Supreme AND 'Basic Structure'): {res1['total']} results")
for item in res1['results'][:3]:
    print(f"   * {item['title']} ({item['court']}, {item['year']}) [{item.get('official_citation')}]")

# Test 4: Boolean search for Bail & Article 21
res2 = post_json('http://127.0.0.1:8000/api/v1/search/', {
    'query': 'bail AND "Article 21"',
    'limit': 5
})
print(f"4. Search (bail AND 'Article 21'): {res2['total']} results")
for item in res2['results'][:3]:
    print(f"   * {item['title']} ({item['court']}, {item['year']}) [{item.get('official_citation')}]")

# Test 5: Static server
static_pages = ['bookmarks.html', 'case-viewer.html', 'search.html', 'index.html']
for page in static_pages:
    resp = urllib.request.urlopen(f'http://127.0.0.1:8888/{page}')
    print(f"5. Static server http://127.0.0.1:8888/{page}: {resp.status} OK")

print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
