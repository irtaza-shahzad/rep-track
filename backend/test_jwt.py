"""Check JWT payload"""
import requests
import jwt
import json

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "user1@gmail.com",
    "password": "root"
})

if response.status_code == 200:
    token = response.json()["data"]["access_token"]
    
    # Decode JWT (without verification for debugging)
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("JWT Payload:")
    print(json.dumps(decoded, indent=2))
    
    # Check what 'sub' contains
    print(f"\nUser ID from JWT 'sub': {decoded.get('sub')}")
    print(f"Type: {type(decoded.get('sub'))}")
