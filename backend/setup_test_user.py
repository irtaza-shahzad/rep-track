"""
Setup script to create test user for live workout testing
"""
import requests

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test user credentials
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User"
}

def create_test_user():
    """Create test user via registration endpoint"""
    print("Creating test user...")
    
    response = requests.post(
        f"{API_BASE}/auth/register",
        json=TEST_USER
    )
    
    if response.status_code == 201:
        print(f"✓ Test user created successfully")
        data = response.json()
        user = data.get("data", {}).get("user", {})
        print(f"  Email: {user.get('email')}")
        print(f"  ID: {user.get('id')}")
        return True
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print(f"✓ Test user already exists")
        return True
    else:
        print(f"✗ Failed to create user: {response.status_code}")
        print(response.text)
        return False


def verify_login():
    """Test login with created user"""
    print("\nVerifying login...")
    
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("data", {}).get("access_token")
        print(f"✓ Login successful")
        print(f"  Token: {token[:50]}...")
        return True
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(response.text)
        return False


if __name__ == "__main__":
    if create_test_user():
        verify_login()
