"""Simple test to debug the 500 error"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Login
print("Logging in...")
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "user1@gmail.com",
    "password": "root"
})

if response.status_code == 200:
    token = response.json()["data"]["access_token"]
    print(f"✓ Login successful, got token")
    
    # Start workout
    print("\nStarting workout...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/workouts/start",
        json={"name": "Test Workout"},
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Workout started successfully!")
        print(f"Session ID: {data['data']['id']}")
    else:
        print(f"✗ Failed to start workout")
        try:
            error_detail = response.json()
            print(f"Error detail: {json.dumps(error_detail, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
else:
    print(f"✗ Login failed: {response.status_code}")
    print(response.text)
