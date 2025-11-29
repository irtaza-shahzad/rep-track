import requests
import json
from app.core.config import settings

# Login as test user
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "testuser2years@test.com", "password": "Password123"}
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

login_data = login_response.json()
print(f"Login response: {json.dumps(login_data, indent=2)}")
token = login_data.get("data", {}).get("access_token")
if not token:
    print("Could not find token in response")
    exit(1)
    
headers = {"Authorization": f"Bearer {token}"}

# Get stats summary
summary_response = requests.get("http://localhost:8000/api/stats/summary", headers=headers)
print("\n" + "="*80)
print("STATS SUMMARY RESPONSE")
print("="*80)
print(f"Status: {summary_response.status_code}")
print("\nResponse JSON:")
print(json.dumps(summary_response.json(), indent=2))
print("="*80)

# Check bestOneRepMaxByExercise keys
if summary_response.status_code == 200:
    data = summary_response.json()
    prs = data.get("bestOneRepMaxByExercise", {})
    print("\n" + "="*80)
    print("PR KEYS ANALYSIS")
    print("="*80)
    for key, value in prs.items():
        print(f"  Key: {repr(key)} (type: {type(key).__name__}) = {value}")
    print("="*80)
