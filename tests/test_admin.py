import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://localhost:8030/api/v1"

def fetch(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            body = json.loads(body)
        except:
            pass
        return e.code, body

def main():
    # 1. Register a normal user (BUYER)
    print("Registering normal user...")
    user_email = f"buyer_{uuid.uuid4().hex[:8]}@example.com"
    status, user_data = fetch("POST", f"{BASE_URL}/auth/register", data={
        "email": user_email,
        "full_name": "Normal Buyer",
        "role": "BUYER",
        "password": "Secure123"
    })
    print("Normal User Response:", user_data)
    
    # Login to get token
    status, login_data = fetch("POST", f"{BASE_URL}/auth/login", data={
        "email": user_email,
        "password": "Secure123"
    })
    user_token = login_data["data"]["access_token"]

    # 2. Register an Admin user
    print("\nRegistering Admin user...")
    admin_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    status, admin_data = fetch("POST", f"{BASE_URL}/auth/register", data={
        "email": admin_email,
        "full_name": "Admin User",
        "role": "ADMIN",
        "password": "Secure123"
    })
    print("Admin User Response:", admin_data)
    
    # Login to get token
    status, login_data = fetch("POST", f"{BASE_URL}/auth/login", data={
        "email": admin_email,
        "password": "Secure123"
    })
    admin_token = login_data["data"]["access_token"]

    # 3. Test Admin Endpoint as Normal User (Should be 403 Forbidden)
    print("\nTesting /admin/users as Normal User...")
    status, data = fetch("GET", f"{BASE_URL}/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    print(f"Status: {status}")
    print("Response:", data)
    assert status == 403, f"Expected 403 Forbidden, got {status}"

    # 4. Test Admin Endpoint as Admin User (Should be 200 OK)
    print("\nTesting /admin/users as Admin User...")
    status, data = fetch("GET", f"{BASE_URL}/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status: {status}")
    print("Response:", data)
    assert status == 200, f"Expected 200 OK, got {status}"
    
    users_list = data["data"]
    first_user_id = users_list[0]["id"]

    # 5. Test Getting a Specific User
    print(f"\nTesting /admin/users/{first_user_id}...")
    status, data = fetch("GET", f"{BASE_URL}/admin/users/{first_user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status: {status}")
    print("Response:", data)
    assert status == 200, f"Expected 200 OK, got {status}"
    
    # 6. Test Suspending a User
    print(f"\nTesting SUSPEND /admin/users/{first_user_id}/status...")
    status, data = fetch("PUT", f"{BASE_URL}/admin/users/{first_user_id}/status", 
                         data={"status": "SUSPENDED"}, 
                         headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status: {status}")
    print("Response:", data)
    assert status == 200, f"Expected 200 OK, got {status}"
    assert data["data"]["is_active"] is False, "User should be suspended"
    
    print("\nAll tests passed successfully! 🎉")

if __name__ == "__main__":
    main()
